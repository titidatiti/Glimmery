import { describe, expect, it } from 'vitest';

import type { DocumentData } from './types';
import { planRestore } from './syncUseCases';

function doc(id: string, updatedAt: string, title = 't'): DocumentData {
  return { id, title, content: '', createdAt: '2020-01-01T00:00:00.000Z', updatedAt };
}

describe('planRestore', () => {
  it('识别内容不同且 updatedAt 不同的冲突', () => {
    const local = [{ ...doc('a', '2024-01-02T00:00:00.000Z'), content: '本地' }];
    const remote = [{ ...doc('a', '2024-01-03T00:00:00.000Z'), content: '云端' }];
    const plan = planRestore(local, remote);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.remoteOnly).toHaveLength(0);
  });

  it('云端新文稿归入 remoteOnly', () => {
    const plan = planRestore([], [doc('b', '2024-01-01T00:00:00.000Z')]);
    expect(plan.remoteOnly).toHaveLength(1);
    expect(plan.conflicts).toHaveLength(0);
  });

  it('相同 updatedAt 无冲突', () => {
    const d = doc('a', '2024-01-01T00:00:00.000Z');
    const plan = planRestore([d], [{ ...d }]);
    expect(plan.conflicts).toHaveLength(0);
  });
});
