import type { StorageKeyValue } from '@/services/storage';
import { DRIVE_APPDATA_SCOPE, KV_GOOGLE_DRIVE_TOKEN } from '../constants';

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: unknown) => void;
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: TokenClientConfig) => { requestAccessToken: () => void };
  revoke: (token: string, callback?: () => void) => void;
}

interface GoogleAccounts {
  oauth2: GoogleAccountsOAuth2;
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let gisScriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google 登录仅可在浏览器中使用'));
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (!gisScriptPromise) {
    gisScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('无法加载 Google Identity Services'));
      document.head.appendChild(script);
    });
  }
  return gisScriptPromise;
}

export class GoogleDriveAuth {
  constructor(
    private readonly kv: StorageKeyValue,
    private readonly clientId: string,
  ) {}

  async getAccessToken(): Promise<string | null> {
    const raw = await this.kv.getItem(KV_GOOGLE_DRIVE_TOKEN);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredToken;
      if (Date.now() < parsed.expiresAt - 60_000) {
        return parsed.accessToken;
      }
    } catch {
      /* 损坏的 token 视为未登录 */
    }
    await this.kv.removeItem(KV_GOOGLE_DRIVE_TOKEN);
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getAccessToken()) !== null;
  }

  async requestAccessToken(): Promise<string> {
    await loadGoogleIdentityScript();
    const oauth2 = window.google?.accounts?.oauth2;
    if (!oauth2) {
      throw new Error('Google Identity Services 未就绪');
    }

    return new Promise((resolve, reject) => {
      const client = oauth2.initTokenClient({
        client_id: this.clientId,
        scope: DRIVE_APPDATA_SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error_description ?? response.error ?? '授权失败'));
            return;
          }
          const expiresIn = response.expires_in ?? 3600;
          const stored: StoredToken = {
            accessToken: response.access_token,
            expiresAt: Date.now() + expiresIn * 1000,
          };
          void this.kv.setItem(KV_GOOGLE_DRIVE_TOKEN, JSON.stringify(stored)).then(() => {
            resolve(response.access_token!);
          });
        },
        error_callback: (error) => {
          reject(error instanceof Error ? error : new Error('授权被取消'));
        },
      });
      client.requestAccessToken();
    });
  }

  async signOut(): Promise<void> {
    const token = await this.getAccessToken();
    if (token) {
      try {
        await loadGoogleIdentityScript();
        window.google?.accounts?.oauth2?.revoke(token, () => undefined);
      } catch {
        /* revoke 失败仍清除本地 token */
      }
    }
    await this.kv.removeItem(KV_GOOGLE_DRIVE_TOKEN);
  }
}
