import { describe, expect, it } from 'vitest';

import { DRIVE_APPDATA_SCOPE, includesDriveAppDataScope } from './constants';

describe('includesDriveAppDataScope', () => {
  it('识别已授权的 drive.appdata', () => {
    expect(
      includesDriveAppDataScope(
        `${DRIVE_APPDATA_SCOPE} https://www.googleapis.com/auth/userinfo.email`,
      ),
    ).toBe(true);
  });

  it('缺少 drive.appdata 时返回 false', () => {
    expect(
      includesDriveAppDataScope('https://www.googleapis.com/auth/userinfo.email openid'),
    ).toBe(false);
  });
});
