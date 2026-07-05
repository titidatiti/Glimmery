const STORAGE_KEY = 'glimmery-sync-client-name';

export const MAX_SYNC_CLIENT_NAME_LENGTH = 64;

function randomSuffix(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(2));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(16).slice(2, 6);
}

function detectOsLabel(): string {
  if (typeof navigator === 'undefined') return 'Web';

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? '';
  const userAgent = navigator.userAgent ?? '';
  const p = platform.toLowerCase();
  const ua = userAgent.toLowerCase();

  if (p.includes('win') || ua.includes('windows')) return 'Windows';
  if (p.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) return 'macOS';
  if (p.includes('linux') || ua.includes('linux')) return 'Linux';
  if (p.includes('android') || ua.includes('android')) return 'Android';
  if (p.includes('iphone') || p.includes('ipad') || ua.includes('iphone') || ua.includes('ipad')) {
    return 'iOS';
  }
  return 'Web';
}

export function generateDefaultSyncClientName(): string {
  return `${detectOsLabel()} (${randomSuffix()})`;
}

export function sanitizeSyncClientName(name: string): string {
  return name.trim().slice(0, MAX_SYNC_CLIENT_NAME_LENGTH);
}

export function loadSyncClientName(): string {
  if (typeof localStorage === 'undefined') return generateDefaultSyncClientName();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw?.trim()) return sanitizeSyncClientName(raw);
    const generated = generateDefaultSyncClientName();
    localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    return generateDefaultSyncClientName();
  }
}

export function saveSyncClientName(name: string): string {
  const sanitized = sanitizeSyncClientName(name);
  const final = sanitized.length > 0 ? sanitized : generateDefaultSyncClientName();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, final);
    } catch {
      /* ignore quota errors */
    }
  }
  return final;
}

export function formatSyncClientLabel(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : '未知设备';
}
