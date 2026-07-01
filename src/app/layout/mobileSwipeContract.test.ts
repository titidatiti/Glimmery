import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * 移动端「侧栏 ↔ 编辑区」横滑核心操作的**契约守护测试**。
 *
 * 该核心操作依赖三方契约：
 *   1) AppShell.module.css 里的移动端布局/指针/触摸不变量；
 *   2) AppShell.tsx 里 track/sidebar/main 的 ref 与 class 接线；
 *   3) useMobilePanelSwipe 的手势逻辑（其阈值由 mobilePanelSwipeMath.test 锁定）。
 *
 * 本文件用「读文件断言」的方式，把 1) 与 2) 的关键不变量固化下来。
 * 任何改动一旦破坏这些不变量，本测试会立即失败 —— 从而防止「修改其它内容时
 * 静默破坏横滑」。修改移动端布局属于**有意变更**时，请同步更新这里并真机验证。
 *
 * 详见 docs/MEMORY.md 中「移动端侧栏横滑易因 CSS 改动回归」条目。
 */

const cssRaw = readFileSync(new URL('./AppShell.module.css', import.meta.url), 'utf8');
/** 去掉注释，避免注释里出现的选择器文本干扰规则匹配 */
const css = cssRaw.replace(/\/\*[\s\S]*?\*\//g, '');
const tsx = readFileSync(new URL('./AppShell.tsx', import.meta.url), 'utf8');

/** 从 `@media (max-width: 767px)` 起，按花括号配平提取整段媒体查询内容 */
function extractMobileMediaBlock(source: string): string {
  const marker = source.indexOf('@media (max-width: 767px)');
  if (marker < 0) throw new Error('未找到移动端媒体查询 @media (max-width: 767px)');
  const open = source.indexOf('{', marker);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error('移动端媒体查询花括号不配平');
}

/** 提取某选择器（精确文本）对应的声明块内容；rule 内无嵌套花括号 */
function ruleBody(source: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(source);
  return match ? match[1] : null;
}

/** 提取所有匹配某选择器**子串**的规则声明块（用于同名选择器多处出现） */
function allRuleBodiesBySelectorContains(source: string, needle: string): string[] {
  const bodies: string[] = [];
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(source))) {
    if (m[1].includes(needle)) bodies.push(m[2]);
  }
  return bodies;
}

const mobile = extractMobileMediaBlock(css);

describe('移动端横滑 CSS 契约', () => {
  it('.mobileTrack 在移动端必须是横向 flex 行', () => {
    const body = ruleBody(mobile, '.mobileTrack');
    expect(body, '.mobileTrack 规则缺失于移动端媒体查询').not.toBeNull();
    expect(body!.replace(/\s+/g, ' ')).toContain('display: flex');
    expect(body!.replace(/\s+/g, ' ')).toContain('flex-direction: row');
  });

  it('.mobileTrack 保留纵向滚动/缩放的 touch-action', () => {
    const body = ruleBody(mobile, '.mobileTrack')!;
    expect(body).toContain('touch-action: pan-y pinch-zoom');
  });

  it('非沉浸且非拖拽时，编辑区不接收指针事件（保证侧栏可交互）', () => {
    const body = ruleBody(
      mobile,
      '.mobileShell:not(.focusMode):not(.mobileDragging) .mobileTrack .main',
    );
    expect(body, '缺少非沉浸态 .main pointer-events 规则').not.toBeNull();
    expect(body!).toContain('pointer-events: none');
  });

  it('沉浸且非拖拽时，侧栏不接收指针事件（保证编辑区可交互）', () => {
    const body = ruleBody(
      mobile,
      '.mobileShell.focusMode:not(.mobileDragging) .mobileTrack .sidebar',
    );
    expect(body, '缺少沉浸态 .sidebar pointer-events 规则').not.toBeNull();
    expect(body!).toContain('pointer-events: none');
  });

  it('仅编辑区滚动区允许纵向 pan-y', () => {
    const body = ruleBody(mobile, '.mobileShell .editorScroll');
    expect(body, '缺少 .editorScroll 的 touch-action 规则').not.toBeNull();
    expect(body!).toContain('touch-action: pan-y');
  });

  it('禁止给 .sidebarInner 设 touch-action（会吞掉侧栏横滑）', () => {
    for (const body of allRuleBodiesBySelectorContains(css, '.sidebarInner')) {
      expect(body).not.toContain('touch-action');
    }
  });

  it('禁止在 focusMode 的 .sidebar 上写 pointer-events: auto', () => {
    const ruleRe = /([^{}]+)\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = ruleRe.exec(css))) {
      const selector = m[1];
      if (/focusMode[^{]*\.sidebar/.test(selector)) {
        expect(m[2]).not.toContain('pointer-events: auto');
      }
    }
  });
});

describe('移动端横滑 DOM/接线契约（AppShell.tsx）', () => {
  it('横滑 hook 接收 track/sidebar/main 三个 ref', () => {
    expect(tsx).toMatch(/useMobilePanelSwipe\(\{[\s\S]*trackRef:\s*mobileTrackRef/);
    expect(tsx).toMatch(/useMobilePanelSwipe\(\{[\s\S]*sidebarRef/);
    expect(tsx).toMatch(/useMobilePanelSwipe\(\{[\s\S]*mainRef/);
  });

  it('track 元素绑定 mobileTrackRef、mobileTrack class 与 trackStyle 位移', () => {
    expect(tsx).toContain('ref={mobileTrackRef}');
    expect(tsx).toContain('className={styles.mobileTrack}');
    expect(tsx).toMatch(/style=\{isMobile \? trackStyle : undefined\}/);
  });

  it('sidebar 与 main 元素分别绑定各自 ref', () => {
    expect(tsx).toMatch(/ref=\{sidebarRef\}/);
    expect(tsx).toMatch(/ref=\{mainRef\}/);
  });

  it('shell 根据移动端/拖拽/沉浸状态切换 class', () => {
    expect(tsx).toContain('styles.mobileShell');
    expect(tsx).toContain('styles.mobileDragging');
    expect(tsx).toContain('styles.focusMode');
  });
});
