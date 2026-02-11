import {
  GOOGLE_DRIVE_SYNC_FILE_MIME,
  GOOGLE_DRIVE_SYNC_FILE_NAME,
  createDriveSyncError,
  isDriveSyncError,
  type DriveSyncFileMetadata,
  type DriveUploadResult,
} from "@/types/google-drive-sync";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";

interface DriveSearchResponse {
  files?: Array<{
    id?: string;
    name?: string;
    modifiedTime?: string;
  }>;
}

interface DriveFileResponse {
  id?: string;
  name?: string;
  modifiedTime?: string;
}

export interface DriveDownloadedFile {
  file: DriveSyncFileMetadata;
  json: string;
}

function buildAuthHeaders(accessToken: string): Headers {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${accessToken}`);
  return headers;
}

async function safeResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

async function runDriveRequest(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (error) {
    throw createDriveSyncError({
      code: "NETWORK_FAILURE",
      message: "Network failure while calling Google Drive API.",
      retryable: true,
      cause: error,
    });
  }

  if (response.ok) {
    return response;
  }

  if (response.status === 401) {
    throw createDriveSyncError({
      code: "TOKEN_EXPIRED",
      message: "Google access token expired or is invalid.",
      retryable: true,
      status: response.status,
    });
  }

  if (response.status === 404) {
    throw createDriveSyncError({
      code: "MISSING_FILE",
      message: "Google Drive sync file was not found.",
      retryable: false,
      status: response.status,
    });
  }

  const body = await safeResponseText(response);

  throw createDriveSyncError({
    code: "DRIVE_API_ERROR",
    message:
      body.trim() || `Google Drive API request failed with ${response.status}.`,
    retryable: response.status >= 500 || response.status === 429,
    status: response.status,
  });
}

function normalizeMetadata(file: DriveFileResponse): DriveSyncFileMetadata | null {
  if (!file.id || !file.name) {
    return null;
  }

  return {
    id: file.id,
    name: file.name,
    modifiedTime: file.modifiedTime,
  };
}

export async function findSyncFile(
  accessToken: string,
): Promise<DriveSyncFileMetadata | null> {
  const query = `name='${GOOGLE_DRIVE_SYNC_FILE_NAME}' and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    spaces: "drive",
    pageSize: "1",
    orderBy: "modifiedTime desc",
    fields: "files(id,name,modifiedTime)",
  });

  const response = await runDriveRequest(`${DRIVE_FILES_URL}?${params.toString()}`, {
    method: "GET",
    headers: buildAuthHeaders(accessToken),
  });

  let parsed: DriveSearchResponse;

  try {
    parsed = (await response.json()) as DriveSearchResponse;
  } catch (error) {
    throw createDriveSyncError({
      code: "DRIVE_API_ERROR",
      message: "Invalid JSON response while searching sync file.",
      cause: error,
    });
  }

  const file = parsed.files?.[0];
  return file ? normalizeMetadata(file) : null;
}

export async function downloadSyncFileJson(accessToken: string): Promise<string> {
  const downloaded = await downloadSyncFilePayload(accessToken);
  return downloaded.json;
}

async function getFileById(
  accessToken: string,
  fileId: string,
): Promise<DriveSyncFileMetadata> {
  const params = new URLSearchParams({
    fields: "id,name,modifiedTime",
  });
  const response = await runDriveRequest(
    `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?${params.toString()}`,
    {
      method: "GET",
      headers: buildAuthHeaders(accessToken),
    },
  );

  let parsed: DriveFileResponse;

  try {
    parsed = (await response.json()) as DriveFileResponse;
  } catch (error) {
    throw createDriveSyncError({
      code: "DRIVE_API_ERROR",
      message: "Invalid JSON response while loading Drive file metadata.",
      cause: error,
    });
  }

  const metadata = normalizeMetadata(parsed);

  if (!metadata) {
    throw createDriveSyncError({
      code: "MISSING_FILE",
      message: "Google Drive sync file metadata is missing.",
    });
  }

  return metadata;
}

async function downloadFileContent(
  accessToken: string,
  fileId: string,
): Promise<string> {
  const params = new URLSearchParams({ alt: "media" });
  const response = await runDriveRequest(
    `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?${params.toString()}`,
    {
      method: "GET",
      headers: buildAuthHeaders(accessToken),
    },
  );

  return response.text();
}

export async function downloadSyncFilePayload(
  accessToken: string,
  fileId?: string,
): Promise<DriveDownloadedFile> {
  if (fileId) {
    try {
      const file = await getFileById(accessToken, fileId);
      const json = await downloadFileContent(accessToken, file.id);
      return { file, json };
    } catch (error) {
      if (!isDriveSyncError(error) || error.code !== "MISSING_FILE") {
        throw error;
      }
    }
  }

  const file = await findSyncFile(accessToken);

  if (!file) {
    throw createDriveSyncError({
      code: "MISSING_FILE",
      message: "Google Drive sync file was not found.",
      retryable: false,
    });
  }

  const json = await downloadFileContent(accessToken, file.id);
  return { file, json };
}

function buildMultipartBody(payloadJson: string, boundary: string): string {
  const metadata = JSON.stringify({
    name: GOOGLE_DRIVE_SYNC_FILE_NAME,
    mimeType: GOOGLE_DRIVE_SYNC_FILE_MIME,
  });

  return [
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    metadata,
    "\r\n",
    `--${boundary}\r\n`,
    `Content-Type: ${GOOGLE_DRIVE_SYNC_FILE_MIME}; charset=UTF-8\r\n\r\n`,
    payloadJson,
    "\r\n",
    `--${boundary}--`,
  ].join("");
}

async function createOrUpdateSyncFile(
  accessToken: string,
  payloadJson: string,
  existingFileId?: string,
): Promise<DriveSyncFileMetadata> {
  const boundarySeed =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const boundary = `anki-boundary-${boundarySeed}`;
  const body = buildMultipartBody(payloadJson, boundary);

  const params = new URLSearchParams({
    uploadType: "multipart",
    fields: "id,name,modifiedTime",
  });

  const endpoint = existingFileId
    ? `${DRIVE_UPLOAD_URL}/${encodeURIComponent(existingFileId)}?${params.toString()}`
    : `${DRIVE_UPLOAD_URL}?${params.toString()}`;

  const headers = buildAuthHeaders(accessToken);
  headers.set("Content-Type", `multipart/related; boundary=${boundary}`);

  const response = await runDriveRequest(endpoint, {
    method: existingFileId ? "PATCH" : "POST",
    headers,
    body,
  });

  let parsed: DriveFileResponse;

  try {
    parsed = (await response.json()) as DriveFileResponse;
  } catch (error) {
    throw createDriveSyncError({
      code: "DRIVE_API_ERROR",
      message: "Invalid JSON response while uploading sync file.",
      cause: error,
    });
  }

  const metadata = normalizeMetadata(parsed);

  if (!metadata) {
    throw createDriveSyncError({
      code: "DRIVE_API_ERROR",
      message: "Drive upload response missing file metadata.",
    });
  }

  return metadata;
}

export async function uploadSyncFileJson(
  accessToken: string,
  payloadJson: string,
): Promise<DriveUploadResult> {
  const existing = await findSyncFile(accessToken);
  const uploaded = await createOrUpdateSyncFile(
    accessToken,
    payloadJson,
    existing?.id,
  );

  return {
    file: uploaded,
    created: !existing,
  };
}
