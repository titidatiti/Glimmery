import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * 移动端横滑的契约测试——刻意做得很薄。
 * 新方案把手势识别完全交给浏览器原生 scroll-snap，需要锁定的不变量只剩
 * 「容器必须是横向滚动 + snap」「面板必须能对齐 snap 起点」这两条。
 */
const css = readFileSync(new URL('./MobilePanelScroller.module.css', import.meta.url), 'utf8');
const appShellCss = readFileSync(new URL('../layout/AppShell.module.css', import.meta.url), 'utf8');

function ruleBody(source: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(source);
  return match ? match[1] : null;
}

function mobileBlock(source: string): string {
  const combined = /@media\s*\(\s*max-width:\s*767px\s*\)\s*,\s*\(\s*orientation:\s*landscape\s*\)\s*and\s*\(\s*max-height:\s*500px\s*\)\s*,\s*\(\s*orientation:\s*portrait\s*\)\s*and\s*\(\s*max-width:\s*1024px\s*\)\s*\{([\s\S]*)\}\s*$/.exec(
    source,
  );
  if (combined) return combined[1];
  const fallback = /@media\s*\(\s*max-width:\s*767px\s*\)\s*\{([\s\S]*)\}\s*$/.exec(source);
  return fallback ? fallback[1] : '';
}

describe('移动端横滑滚动容器契约', () => {
  it('.scroller 必须是可横向滚动的 flex 行，并开启 x 轴 snap', () => {
    const body = ruleBody(css, '.scroller');
    expect(body, '.scroller 规则缺失').not.toBeNull();
    expect(body!).toContain('display: flex');
    expect(body!).toContain('overflow-x: auto');
    expect(body!).toContain('scroll-snap-type: x mandatory');
  });

  it('.panel 必须占满容器宽度并对齐 snap 起点', () => {
    const body = ruleBody(css, '.panel');
    expect(body, '.panel 规则缺失').not.toBeNull();
    expect(body!).toContain('flex: 0 0 100%');
    expect(body!).toContain('scroll-snap-align: start');
  });

  it('AppShell 移动端禁止给 .editorScroll 设置 touch-action: pan-y（会吞掉横滑）', () => {
    const mobile = mobileBlock(appShellCss);
    const body = ruleBody(mobile, '.mobileShell .editorScroll');
    expect(body, '缺少 .mobileShell .editorScroll 规则').not.toBeNull();
    expect(body!).not.toMatch(/touch-action:\s*pan-y/);
  });

  it('手持横屏侧栏 inner 必须是两列 grid', () => {
    const landscapeBlock = /@media\s*\(\s*orientation:\s*landscape\s*\)\s*and\s*\(\s*max-height:\s*500px\s*\)\s*\{([\s\S]*?)\n\}/.exec(
      appShellCss,
    );
    expect(landscapeBlock, '缺少横屏 media 块').not.toBeNull();
    const body = ruleBody(landscapeBlock![1], '.mobileShell .sidebarInner');
    expect(body, '缺少 .mobileShell .sidebarInner 横屏规则').not.toBeNull();
    expect(body!).toContain('display: grid');
    expect(body!).toContain('grid-template-columns');
  });
});
