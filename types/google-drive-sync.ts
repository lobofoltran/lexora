import type { FlashcardData } from "@/lib/export-import";

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const GOOGLE_DRIVE_SYNC_FILE_NAME = "anki-sync.json";
export const GOOGLE_DRIVE_SYNC_FILE_MIME = "application/json";

export type DriveSyncErrorCode =
  | "AUTH_CONFIG_MISSING"
  | "GIS_LOAD_FAILED"
  | "AUTH_FAILED"
  | "TOKEN_EXPIRED"
  | "OFFLINE"
  | "NETWORK_FAILURE"
  | "MISSING_FILE"
  | "CORRUPTED_JSON"
  | "VALIDATION_FAILED"
  | "DRIVE_API_ERROR"
  | "STORE_NOT_READY"
  | "UNKNOWN_ERROR";

export class DriveSyncError extends Error {
  code: DriveSyncErrorCode;
  retryable: boolean;
  status?: number;
  cause?: unknown;

  constructor(input: {
    code: DriveSyncErrorCode;
    message: string;
    retryable?: boolean;
    status?: number;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = "DriveSyncError";
    this.code = input.code;
    this.retryable = input.retryable ?? false;
    this.status = input.status;
    this.cause = input.cause;
  }
}

export function createDriveSyncError(input: {
  code: DriveSyncErrorCode;
  message: string;
  retryable?: boolean;
  status?: number;
  cause?: unknown;
}): DriveSyncError {
  return new DriveSyncError(input);
}

export function isDriveSyncError(value: unknown): value is DriveSyncError {
  return value instanceof DriveSyncError;
}

export type DriveSyncResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DriveSyncError };

export interface DriveSyncFileMetadata {
  id: string;
  name: string;
  modifiedTime?: string;
}

export interface DriveUploadResult {
  file: DriveSyncFileMetadata;
  created: boolean;
}

export interface SyncNowResult {
  mergedData: FlashcardData;
  uploadedFileId: string;
  created: boolean;
}

export type AutoSyncTrigger = "mutation" | "review" | "startup";

export interface AutoSyncResult {
  trigger: AutoSyncTrigger;
  didSync: boolean;
  reason?: string;
  mergedData?: FlashcardData;
  remoteFileId?: string;
}
