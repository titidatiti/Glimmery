import type { StorageKeyValue } from '@/services/storage';
import type { SyncAccountProfile } from '../types';
import {
  GOOGLE_DRIVE_OAUTH_SCOPES,
  includesDriveAppDataScope,
  INSUFFICIENT_DRIVE_SCOPE_MESSAGE,
  KV_GOOGLE_DRIVE_PROFILE,
  KV_GOOGLE_DRIVE_TOKEN,
} from '../constants';

export interface StoredGoogleToken {
  accessToken: string;
  expiresAt: number;
  scope?: string;
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
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: TokenClientConfig) => {
    requestAccessToken: (overrides?: { prompt?: '' | 'none' | 'consent' | 'select_account' }) => void;
  };
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

/** 到期前 1 分钟即视为需要续期 */
export const GOOGLE_TOKEN_EXPIRY_BUFFER_MS = 60_000;

export const GOOGLE_TOKEN_DEFAULT_EXPIRES_IN_SEC = 3600;

export type GoogleTokenPrompt = 'none' | 'consent' | 'select_account';

export interface RequestAccessTokenOptions {
  /** 首次连接用 consent；过期续期用 none（静默，不弹窗） */
  prompt?: GoogleTokenPrompt;
}

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

export function isStoredGoogleTokenFresh(
  stored: StoredGoogleToken,
  now = Date.now(),
  bufferMs = GOOGLE_TOKEN_EXPIRY_BUFFER_MS,
): boolean {
  return now < stored.expiresAt - bufferMs;
}

export function buildStoredGoogleToken(
  accessToken: string,
  expiresInSec: number,
  scope: string | undefined,
  now = Date.now(),
): StoredGoogleToken {
  return {
    accessToken,
    expiresAt: now + expiresInSec * 1000,
    scope,
  };
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

function formatTokenResponseError(response: GoogleTokenResponse): Error {
  return new Error(response.error_description ?? response.error ?? '授权失败');
}

export class GoogleDriveAuth {
  private silentRefreshInFlight: Promise<string> | null = null;

  constructor(
    private readonly kv: StorageKeyValue,
    private readonly clientId: string,
  ) {}

  async getAccessToken(): Promise<string | null> {
    const stored = await this.loadStoredToken();
    if (stored) {
      if (!includesDriveAppDataScope(stored.scope)) {
        await this.clearStoredToken();
        return null;
      }
      if (isStoredGoogleTokenFresh(stored)) {
        return stored.accessToken;
      }
    }

    if (!(await this.hasPriorConnection(stored))) {
      return null;
    }

    try {
      return await this.refreshAccessTokenSilently();
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getAccessToken()) !== null;
  }

  /**
   * 只读检查登录态；过期时会尝试静默续期，不弹授权窗。
   */
  async getAuthSessionStatus(): Promise<'none' | 'active' | 'expired'> {
    const stored = await this.loadStoredToken();
    if (stored && !includesDriveAppDataScope(stored.scope)) {
      return 'expired';
    }

    const token = await this.getAccessToken();
    if (token) return 'active';

    if (await this.hasPriorConnection(stored)) {
      return 'expired';
    }

    return 'none';
  }

  async getAccountProfile(): Promise<SyncAccountProfile | null> {
    const cached = await this.loadStoredProfile();
    const token = await this.getAccessToken();
    if (!token) {
      return cached;
    }

    if (cached) return cached;

    try {
      const profile = await this.fetchUserInfo(token);
      await this.kv.setItem(KV_GOOGLE_DRIVE_PROFILE, JSON.stringify(profile));
      return profile;
    } catch {
      return cached;
    }
  }

  private async hasPriorConnection(stored: StoredGoogleToken | null): Promise<boolean> {
    if (stored) return true;
    return (await this.loadStoredProfile()) !== null;
  }

  private async loadStoredToken(): Promise<StoredGoogleToken | null> {
    const raw = await this.kv.getItem(KV_GOOGLE_DRIVE_TOKEN);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredGoogleToken;
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

  async refreshAccessTokenSilently(): Promise<string> {
    if (this.silentRefreshInFlight) {
      return this.silentRefreshInFlight;
    }

    this.silentRefreshInFlight = this.requestAccessToken({ prompt: 'none' }).finally(() => {
      this.silentRefreshInFlight = null;
    });

    return this.silentRefreshInFlight;
  }

  async requestAccessToken(options?: RequestAccessTokenOptions): Promise<string> {
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
            reject(formatTokenResponseError(response));
            return;
          }
          if (!includesDriveAppDataScope(response.scope)) {
            reject(new Error(INSUFFICIENT_DRIVE_SCOPE_MESSAGE));
            return;
          }
          const stored = buildStoredGoogleToken(
            response.access_token,
            response.expires_in ?? GOOGLE_TOKEN_DEFAULT_EXPIRES_IN_SEC,
            response.scope,
          );
          void this.kv.setItem(KV_GOOGLE_DRIVE_TOKEN, JSON.stringify(stored)).then(async () => {
            await this.persistProfile(response.access_token!);
            resolve(response.access_token!);
          });
        },
        error_callback: (error) => {
          reject(formatOAuthClientError(error));
        },
      });
      client.requestAccessToken(options?.prompt ? { prompt: options.prompt } : undefined);
    });
  }

  async clearStoredToken(): Promise<void> {
    await this.kv.removeItem(KV_GOOGLE_DRIVE_TOKEN);
  }

  async signOut(): Promise<void> {
    const stored = await this.loadStoredToken();
    if (stored?.accessToken) {
      try {
        await loadGoogleIdentityScript();
        window.google?.accounts?.oauth2?.revoke(stored.accessToken, () => undefined);
      } catch {
        /* revoke 失败仍清除本地 token */
      }
    }
    await this.kv.removeItem(KV_GOOGLE_DRIVE_TOKEN);
    await this.kv.removeItem(KV_GOOGLE_DRIVE_PROFILE);
  }
}
