import { describe, expect, it } from 'vitest';

import { parseChangelog } from './parseChangelog';

const SAMPLE = `# 更新日志

## [0.2.1] - 2026-07-05

### 云同步

- 进度显示 x/y
- 本机名称

### 修复

- 修复某问题

## [0.2.0] - 2026-07-01

- 首条无小节

[0.2.1]: https://example.com
`;

describe('parseChangelog', () => {
  it('解析版本、日期与小节', () => {
    const releases = parseChangelog(SAMPLE);
    expect(releases).toHaveLength(2);
    expect(releases[0]).toMatchObject({
      version: '0.2.1',
      date: '2026-07-05',
    });
    expect(releases[0]?.sections).toHaveLength(2);
    expect(releases[0]?.sections[0]?.items[0]).toBe('进度显示 x/y');
  });

  it('无 ### 时归入默认小节', () => {
    const releases = parseChangelog(SAMPLE);
    expect(releases[1]?.sections[0]?.title).toBe('更新');
    expect(releases[1]?.sections[0]?.items[0]).toBe('首条无小节');
  });
});
