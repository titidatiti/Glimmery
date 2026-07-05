import { describe, expect, it } from 'vitest';

import {
  driveDocumentFilename,
  driveSettingsFilename,
  parseDocumentIdFromFilename,
} from './driveLayout';

describe('driveLayout', () => {
  it('文稿文件名含 current 与 rev 槽位', () => {
    const id = 'abc-123';
    expect(driveDocumentFilename(id)).toBe('glimmery-doc-abc-123.json');
    expect(driveDocumentFilename(id, 1)).toBe('glimmery-doc-abc-123.rev1.json');
    expect(driveDocumentFilename(id, 3)).toBe('glimmery-doc-abc-123.rev3.json');
  });

  it('设置文件名', () => {
    expect(driveSettingsFilename()).toBe('glimmery-settings.json');
    expect(driveSettingsFilename(2)).toBe('glimmery-settings.rev2.json');
  });

  it('从文件名解析文稿 id', () => {
    expect(parseDocumentIdFromFilename('glimmery-doc-uuid.json')).toBe('uuid');
    expect(parseDocumentIdFromFilename('glimmery-doc-uuid.rev2.json')).toBe('uuid');
    expect(parseDocumentIdFromFilename('glimmery-manifest.json')).toBeNull();
  });
});
