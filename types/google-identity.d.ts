interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  error_uri?: string;
  prompt?: string;
  scope?: string;
  token_type?: string;
}

interface GoogleTokenErrorResponse {
  type?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: "" | "consent" }) => void;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: GoogleTokenErrorResponse) => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
  revoke: (token: string, done?: () => void) => void;
}

interface GoogleIdentityServices {
  accounts: {
    oauth2: GoogleAccountsOAuth2;
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export {};
