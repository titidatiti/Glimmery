/**
 * 编辑器行度量共享工具。
 * 抽离于 activeLinePlugin，供 activeLinePlugin 与 blockHandleConfig 共用，
 * 避免两个插件互相依赖。
 */

/** 解析元素的实际行高（px），处理 normal / em / rem，失败时回退 fallback */
export function resolveLineHeightPx(element: HTMLElement, fallbackLineHeight: number): number {
  const computed = getComputedStyle(element);
  const raw = computed.lineHeight;

  if (raw === 'normal') {
    const fontSize = parseFloat(computed.fontSize);
    return Number.isFinite(fontSize) ? fontSize * 1.2 : fallbackLineHeight;
  }

  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return fallbackLineHeight;

  if (raw.endsWith('em') || raw.endsWith('rem')) {
    const fontSize = parseFloat(computed.fontSize);
    return Number.isFinite(fontSize) ? value * fontSize : fallbackLineHeight;
  }

  return value;
}
