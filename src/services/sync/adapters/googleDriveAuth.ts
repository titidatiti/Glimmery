import type { StorageKeyValue } from '@/services/storage';
import type { SyncAccountProfile } from '../types';
import {
  GOOGLE_DRIVE_OAUTH_SCOPES,
  KV_GOOGLE_DRIVE_PROFILE,
  KV_GOOGLE_DRIVE_TOKEN,
} from '../constants';

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

interface StoredProfile {
  email: string;
  name?: string;
  pictureUrl?: string;
}

interface GoogleUserInfoResponse {
  email?: string;
  name?: string;
  picture?: string;
}

interface GoogleOAuthClientError {
  type?: string;
  message?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: GoogleOAuthClientError) => void;
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
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

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

/** 在用户点击「连接」前预加载 GIS，避免首次点击因脚本未就绪导致弹窗被拦截 */
export function preloadGoogleIdentityScript(): void {
  void loadGoogleIdentityScript().catch(() => undefined);
}

function formatOAuthClientError(error: GoogleOAuthClientError): Error {
  if (error.type === 'popup_failed_to_open') {
    return new Error('授权窗口未能打开，请再点一次「连接 Google 账号」');
  }
  if (error.type === 'popup_closed') {
    return new Error('授权已取消');
  }
  if (error.message) {
    return new Error(error.message);
  }
  return new Error('授权失败');
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

  async getAccountProfile(): Promise<SyncAccountProfile | null> {
    const token = await this.getAccessToken();
    if (!token) {
      await this.kv.removeItem(KV_GOOGLE_DRIVE_PROFILE);
      return null;
    }

    const cached = await this.loadStoredProfile();
    if (cached) return cached;

    try {
      const profile = await this.fetchUserInfo(token);
      await this.kv.setItem(KV_GOOGLE_DRIVE_PROFILE, JSON.stringify(profile));
      return profile;
    } catch {
      return null;
    }
  }

  private async loadStoredProfile(): Promise<SyncAccountProfile | null> {
    const raw = await this.kv.getItem(KV_GOOGLE_DRIVE_PROFILE);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredProfile;
      if (!parsed.email) return null;
      return {
        email: parsed.email,
        name: parsed.name,
        pictureUrl: parsed.pictureUrl,
      };
    } catch {
      await this.kv.removeItem(KV_GOOGLE_DRIVE_PROFILE);
      return null;
    }
  }

  private async fetchUserInfo(accessToken: string): Promise<SyncAccountProfile> {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`无法读取 Google 账号信息 (${response.status})`);
    }
    const data = (await response.json()) as GoogleUserInfoResponse;
    if (!data.email) {
      throw new Error('Google 账号信息缺少邮箱');
    }
    return {
      email: data.email,
      name: data.name?.trim() || undefined,
      pictureUrl: data.picture || undefined,
    };
  }

  private async persistProfile(accessToken: string): Promise<void> {
    try {
      const profile = await this.fetchUserInfo(accessToken);
      await this.kv.setItem(KV_GOOGLE_DRIVE_PROFILE, JSON.stringify(profile));
    } catch {
      await this.kv.removeItem(KV_GOOGLE_DRIVE_PROFILE);
    }
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
        scope: GOOGLE_DRIVE_OAUTH_SCOPES,
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
          void this.kv.setItem(KV_GOOGLE_DRIVE_TOKEN, JSON.stringify(stored)).then(async () => {
            await this.persistProfile(response.access_token!);
            resolve(response.access_token!);
          });
        },
        error_callback: (error) => {
          reject(formatOAuthClientError(error));
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
    await this.kv.removeItem(KV_GOOGLE_DRIVE_PROFILE);
  }
}
