import {
  GOOGLE_DRIVE_SCOPE_ERROR_PATTERN,
  INSUFFICIENT_DRIVE_SCOPE_MESSAGE,
} from '../constants';
import type { GoogleDriveAuth } from '../adapters/googleDriveAuth';
import { isGlimmeryDriveFile } from './driveLayout';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export class GoogleDriveFileStore {
  private nameToId = new Map<string, string>();

  constructor(private readonly auth: GoogleDriveAuth) {}

  async refreshIndex(token: string): Promise<void> {
    this.nameToId.clear();
    let pageToken: string | undefined;

    do {
      const q = encodeURIComponent("name contains 'glimmery-' and trashed=false");
      const fields = encodeURIComponent('nextPageToken,files(id,name)');
      const url = `${DRIVE_FILES_URL}?spaces=appDataFolder&q=${q}&fields=${fields}&pageSize=100${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
      }`;
      const response = await this.driveFetch(url, token);
      let data: { files?: { id: string; name: string }[]; nextPageToken?: string };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        throw new Error('Google Drive 返回了无效响应，请检查网络或重新登录');
      }
      for (const file of data.files ?? []) {
        if (isGlimmeryDriveFile(file.name)) {
          this.nameToId.set(file.name, file.id);
        }
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
  }

  has(name: string): boolean {
    return this.nameToId.has(name);
  }

  async read(token: string, name: string): Promise<string | null> {
    const fileId = this.nameToId.get(name);
    if (!fileId) return null;
    const response = await this.driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token);
    return response.text();
  }

  async write(token: string, name: string, body: string): Promise<void> {
    const fileId = this.nameToId.get(name);
    if (fileId) {
      await this.driveFetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return;
    }

    const metadata = {
      name,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
    };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([body], { type: 'application/json' }));
    const response = await this.driveFetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, token, {
      method: 'POST',
      body: form,
    });
    const created = (await response.json()) as { id?: string };
    if (created.id) {
      this.nameToId.set(name, created.id);
    } else {
      await this.refreshIndex(token);
    }
  }

  async delete(token: string, name: string): Promise<void> {
    const fileId = this.nameToId.get(name);
    if (!fileId) return;
    await this.driveFetch(`${DRIVE_FILES_URL}/${fileId}`, token, { method: 'DELETE' });
    this.nameToId.delete(name);
  }

  private async requireToken(): Promise<string> {
    let token = await this.auth.getAccessToken();
    if (!token) {
      token = await this.auth.requestAccessToken({ prompt: 'consent' });
    }
    return token;
  }

  async withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
    const token = await this.requireToken();
    return fn(token);
  }

  private async driveFetch(
    url: string,
    token: string,
    init: RequestInit = {},
    allowScopeRetry = true,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(url, { ...init, headers });
    if (!response.ok) {
      let message = `Drive API 错误 (${response.status})`;
      try {
        const err = (await response.json()) as { error?: { message?: string } };
        if (err.error?.message) message = err.error.message;
      } catch {
        /* ignore */
      }

      if (
        allowScopeRetry &&
        response.status === 403 &&
        GOOGLE_DRIVE_SCOPE_ERROR_PATTERN.test(message)
      ) {
        await this.auth.signOut();
        const freshToken = await this.auth.requestAccessToken({ prompt: 'consent' });
        return this.driveFetch(url, freshToken, init, false);
      }

      if (GOOGLE_DRIVE_SCOPE_ERROR_PATTERN.test(message)) {
        throw new Error(INSUFFICIENT_DRIVE_SCOPE_MESSAGE);
      }

      throw new Error(message);
    }
    return response;
  }
}
