export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogRelease {
  version: string;
  date?: string;
  sections: ChangelogSection[];
}

const RELEASE_HEADING = /^## \[([^\]]+)\](?:\s*-\s*(\S+))?/;
const SECTION_HEADING = /^### (.+)$/;
const LIST_ITEM = /^- (.+)$/;
const LINK_REFERENCE = /^\[[^\]]+\]:\s*\S+/;

/** 解析 CHANGELOG.md 为结构化版本条目（不含文首说明与底部链接行） */
export function parseChangelog(markdown: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];
  let current: ChangelogRelease | null = null;
  let currentSection: ChangelogSection | null = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('# ') || LINK_REFERENCE.test(trimmed)) {
      continue;
    }

    const releaseMatch = RELEASE_HEADING.exec(trimmed);
    if (releaseMatch) {
      current = {
        version: releaseMatch[1],
        date: releaseMatch[2],
        sections: [],
      };
      releases.push(current);
      currentSection = null;
      continue;
    }

    if (!current) continue;

    const sectionMatch = SECTION_HEADING.exec(trimmed);
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1], items: [] };
      current.sections.push(currentSection);
      continue;
    }

    const itemMatch = LIST_ITEM.exec(trimmed);
    if (itemMatch) {
      if (!currentSection) {
        currentSection = { title: '更新', items: [] };
        current.sections.push(currentSection);
      }
      currentSection.items.push(itemMatch[1]);
    }
  }

  return releases;
}
