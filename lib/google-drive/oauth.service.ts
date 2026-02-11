import {
  GOOGLE_DRIVE_SCOPE,
  createDriveSyncError,
  isDriveSyncError,
} from "@/types/google-drive-sync";

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GIS_SCRIPT_SELECTOR = 'script[data-anki-gis="true"]';
const TOKEN_REFRESH_GRACE_MS = 30_000;

interface TokenState {
  accessToken: string;
  expiresAt: number;
}

let tokenState: TokenState | null = null;
let gisLoadPromise: Promise<void> | null = null;

function readClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    throw createDriveSyncError({
      code: "AUTH_CONFIG_MISSING",
      message: "Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID.",
    });
  }

  return clientId;
}

function isTokenStillValid(state: TokenState | null): state is TokenState {
  return !!state && Date.now() < state.expiresAt - TOKEN_REFRESH_GRACE_MS;
}

function ensureBrowserEnvironment(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw createDriveSyncError({
      code: "AUTH_FAILED",
      message: "Google Drive sync is available only in the browser.",
    });
  }
}

function normalizeAuthError(error: unknown): Error {
  if (isDriveSyncError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return error;
  }

  return createDriveSyncError({
    code: "UNKNOWN_ERROR",
    message: "Unknown Google authentication error.",
    cause: error,
  });
}

function requestAccessTokenWithLoadedGis(prompt: "" | "consent"): Promise<string> {
  ensureBrowserEnvironment();
  const clientId = readClientId();

  return new Promise<string>((resolve, reject) => {
    const oauth2 = window.google?.accounts?.oauth2;

    if (!oauth2) {
      reject(
        createDriveSyncError({
          code: "GIS_LOAD_FAILED",
          message: "Google Identity Services is not ready.",
          retryable: true,
        }),
      );
      return;
    }

    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            createDriveSyncError({
              code: "AUTH_FAILED",
              message: response.error_description ?? "Google sign-in failed.",
              retryable: prompt === "",
              cause: response,
            }),
          );
          return;
        }

        const expiresInSeconds =
          typeof response.expires_in === "number" && response.expires_in > 0
            ? response.expires_in
            : 3600;

        tokenState = {
          accessToken: response.access_token,
          expiresAt: Date.now() + expiresInSeconds * 1000,
        };

        resolve(response.access_token);
      },
      error_callback: (authError) => {
        reject(
          createDriveSyncError({
            code: "AUTH_FAILED",
            message:
              authError.error_description ??
              authError.error ??
              "Google sign-in popup failed.",
            retryable: prompt === "",
            cause: authError,
          }),
        );
      },
    });

    tokenClient.requestAccessToken({ prompt });
  });
}

async function waitForGis(maxWaitMs = 10_000): Promise<void> {
  const started = Date.now();

  while (!window.google?.accounts?.oauth2) {
    if (Date.now() - started > maxWaitMs) {
      throw createDriveSyncError({
        code: "GIS_LOAD_FAILED",
        message: "Google Identity Services did not initialize in time.",
        retryable: true,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

export async function loadGoogleIdentityServices(): Promise<void> {
  ensureBrowserEnvironment();

  if (window.google?.accounts?.oauth2) {
    return;
  }

  if (!gisLoadPromise) {
    gisLoadPromise = new Promise<void>((resolve, reject) => {
      const onLoad = () => resolve();
      const onError = () =>
        reject(
          createDriveSyncError({
            code: "GIS_LOAD_FAILED",
            message: "Failed to load Google Identity Services.",
            retryable: true,
          }),
        );

      const existing = document.querySelector<HTMLScriptElement>(
        GIS_SCRIPT_SELECTOR,
      );

      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.ankiGis = "true";
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
      document.head.appendChild(script);
    });
  }

  try {
    await gisLoadPromise;
    await waitForGis();
  } catch (error) {
    gisLoadPromise = null;
    throw normalizeAuthError(error);
  }
}

async function requestAccessToken(prompt: "" | "consent"): Promise<string> {
  ensureBrowserEnvironment();
  await loadGoogleIdentityServices();
  return requestAccessTokenWithLoadedGis(prompt);
}

export async function signInWithGoogle(): Promise<string> {
  ensureBrowserEnvironment();

  if (!window.google?.accounts?.oauth2) {
    throw createDriveSyncError({
      code: "GIS_LOAD_FAILED",
      message: "Google sign-in is still initializing. Try again.",
      retryable: true,
    });
  }

  // Keep popup invocation in user-gesture call stack.
  return requestAccessTokenWithLoadedGis("consent");
}

export async function getGoogleAccessToken(options?: {
  forceRefresh?: boolean;
  interactive?: boolean;
}): Promise<string> {
  if (options?.forceRefresh) {
    tokenState = null;
  }

  if (isTokenStillValid(tokenState)) {
    return tokenState.accessToken;
  }

  try {
    return await requestAccessToken("");
  } catch (silentError) {
    const normalized = normalizeAuthError(silentError);

    if (options?.interactive === false) {
      throw normalized;
    }

    if (isDriveSyncError(normalized) && normalized.code !== "AUTH_FAILED") {
      throw normalized;
    }

    return requestAccessToken("consent");
  }
}

export async function signOutFromGoogle(tokenOverride?: string): Promise<void> {
  const currentToken = tokenOverride ?? tokenState?.accessToken;
  tokenState = null;

  if (!currentToken) {
    return;
  }

  ensureBrowserEnvironment();
  await loadGoogleIdentityServices();

  await new Promise<void>((resolve) => {
    window.google?.accounts?.oauth2.revoke(currentToken, () => resolve());
    setTimeout(resolve, 2_000);
  });
}

export function hasInMemoryAccessToken(): boolean {
  return isTokenStillValid(tokenState);
}
