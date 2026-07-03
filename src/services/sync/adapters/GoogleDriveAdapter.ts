import type { DocumentData } from '@/core/documents';
import { normalizeDocument } from '@/core/documents';
import type { StorageKeyValue } from '@/services/storage';
import {
  DRIVE_BACKUP_FILENAME,
  DRIVE_BACKUP_VERSION,
  type DriveBackupPayload,
} from '../constants';
import type { SyncProvider, SyncResult } from '../types';
import { GoogleDriveAuth } from './googleDriveAuth';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export class GoogleDriveAdapter implements SyncProvider {
  readonly id = 'google-drive';

  private readonly auth: GoogleDriveAuth;

  constructor(
    kv: StorageKeyValue,
    private readonly clientId: string,
  ) {
    this.auth = new GoogleDriveAuth(kv, clientId);
  }

  isConfigured(): boolean {
    return this.clientId.length > 0;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.auth.isAuthenticated();
  }

  async authenticate(): Promise<void> {
    await this.auth.requestAccessToken();
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  async push(docs: DocumentData[]): Promise<SyncResult> {
    try {
      const token = await this.requireToken();
      const payload: DriveBackupPayload = {
        version: DRIVE_BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        documents: docs,
      };
      const body = JSON.stringify(payload);
      const fileId = await this.findBackupFileId(token);

      if (fileId) {
        await this.driveFetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, token, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      } else {
        const metadata = {
          name: DRIVE_BACKUP_FILENAME,
          mimeType: 'application/json',
          parents: ['appDataFolder'],
        };
        const form = new FormData();
        form.append(
          'metadata',
          new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
        );
        form.append('file', new Blob([body], { type: 'application/json' }));
        await this.driveFetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, token, {
          method: 'POST',
          body: form,
        });
      }

      return { success: true, pushed: docs.length, pulled: 0 };
    } catch (error) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        error: error instanceof Error ? error.message : '备份失败',
      };
    }
  }

  async pull(): Promise<DocumentData[]> {
    const token = await this.requireToken();
    const fileId = await this.findBackupFileId(token);
    if (!fileId) return [];

    const response = await this.driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token);
    const text = await response.text();
    const payload = JSON.parse(text) as DriveBackupPayload;
    if (!Array.isArray(payload.documents)) {
      throw new Error('云端备份格式无效');
    }
    return payload.documents.map((doc) => normalizeDocument(doc));
  }

  private async requireToken(): Promise<string> {
    let token = await this.auth.getAccessToken();
    if (!token) {
      token = await this.auth.requestAccessToken();
    }
    return token;
  }

  private async findBackupFileId(token: string): Promise<string | null> {
    const query = encodeURIComponent(`name='${DRIVE_BACKUP_FILENAME}' and trashed=false`);
    const response = await this.driveFetch(
      `${DRIVE_FILES_URL}?spaces=appDataFolder&q=${query}&fields=files(id)&pageSize=1`,
      token,
    );
    const data = (await response.json()) as { files?: { id: string }[] };
    return data.files?.[0]?.id ?? null;
  }

  private async driveFetch(
    url: string,
    token: string,
    init: RequestInit = {},
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
      throw new Error(message);
    }
    return response;
  }
}
