import { describe, expect, it } from 'vitest';

import {
  createDocumentFilePayload,
  createSettingsFilePayload,
} from './drivePayload';

describe('drivePayload clientName', () => {
  it('写入文稿 payload 时携带 clientName', () => {
    const payload = createDocumentFilePayload(
      {
        id: 'a',
        title: 't',
        content: '',
        createdAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2020-01-01T00:00:00.000Z',
      },
      'MacBook',
    );
    expect(payload.clientName).toBe('MacBook');
  });

  it('写入设置 payload 时携带 clientName', () => {
    const payload = createSettingsFilePayload(
      '2020-01-01T00:00:00.000Z',
      [],
      'default',
      'Windows (a1b2)',
    );
    expect(payload.clientName).toBe('Windows (a1b2)');
  });
});
