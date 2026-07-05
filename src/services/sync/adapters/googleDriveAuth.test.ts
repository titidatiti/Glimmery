import { describe, expect, it } from 'vitest';

import {
  buildStoredGoogleToken,
  GOOGLE_TOKEN_DEFAULT_EXPIRES_IN_SEC,
  GOOGLE_TOKEN_EXPIRY_BUFFER_MS,
  isStoredGoogleTokenFresh,
} from './googleDriveAuth';

describe('isStoredGoogleTokenFresh', () => {
  const now = 1_700_000_000_000;

  it('在缓冲期内视为有效', () => {
    const stored = buildStoredGoogleToken('token', 3600, 'scope', now);
    expect(isStoredGoogleTokenFresh(stored, now + 3600 * 1000 - GOOGLE_TOKEN_EXPIRY_BUFFER_MS - 1)).toBe(
      true,
    );
  });

  it('进入缓冲期后视为过期', () => {
    const stored = buildStoredGoogleToken('token', 3600, 'scope', now);
    expect(isStoredGoogleTokenFresh(stored, now + 3600 * 1000 - GOOGLE_TOKEN_EXPIRY_BUFFER_MS)).toBe(
      false,
    );
  });
});

describe('buildStoredGoogleToken', () => {
  it('按 expires_in 计算 expiresAt', () => {
    const now = 1_000;
    const stored = buildStoredGoogleToken('abc', GOOGLE_TOKEN_DEFAULT_EXPIRES_IN_SEC, 'scope', now);
    expect(stored.accessToken).toBe('abc');
    expect(stored.expiresAt).toBe(now + GOOGLE_TOKEN_DEFAULT_EXPIRES_IN_SEC * 1000);
  });
});
