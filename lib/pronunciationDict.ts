export const DICT_RULES_STORAGE = "voicestudio_dict_rules";
export const DICT_ENABLED_STORAGE = "voicestudio_dict_enabled";
export const DICT_SYNCED_STORAGE = "voicestudio_dict_synced";

export const MAX_RULES = 100;
export const MAX_FROM_LENGTH = 100;
export const MAX_TO_LENGTH = 200;

export interface PronunciationRule {
  from: string;
  to: string;
}

export interface SyncedDictState {
  id: string;
  version_id: string;
  hash: string;
  syncedAt: number;
}

export function sanitizeRules(rules: PronunciationRule[]): PronunciationRule[] {
  const seen = new Set<string>();
  const out: PronunciationRule[] = [];
  for (const raw of rules) {
    const from = (raw.from || "").trim();
    const to = (raw.to || "").trim();
    if (!from || !to) continue;
    if (from.length > MAX_FROM_LENGTH || to.length > MAX_TO_LENGTH) continue;
    const key = from.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ from, to });
    if (out.length >= MAX_RULES) break;
  }
  return out;
}

export function hashRules(rules: PronunciationRule[]): string {
  const sorted = [...rules]
    .map((r) => `${r.from}\u0001${r.to}`)
    .sort()
    .join("\u0002");
  let h = 0x811c9dc5;
  for (let i = 0; i < sorted.length; i++) {
    h ^= sorted.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function loadRules(): PronunciationRule[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(DICT_RULES_STORAGE);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PronunciationRule[];
    if (!Array.isArray(parsed)) return [];
    return sanitizeRules(parsed);
  } catch {
    return [];
  }
}

export function saveRules(rules: PronunciationRule[]): void {
  localStorage.setItem(DICT_RULES_STORAGE, JSON.stringify(sanitizeRules(rules)));
}

export function loadEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DICT_ENABLED_STORAGE) === "1";
}

export function saveEnabled(enabled: boolean): void {
  localStorage.setItem(DICT_ENABLED_STORAGE, enabled ? "1" : "0");
}

export function loadSynced(): SyncedDictState | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(DICT_SYNCED_STORAGE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SyncedDictState;
    if (!parsed?.id || !parsed?.version_id || !parsed?.hash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSynced(state: SyncedDictState | null): void {
  if (state === null) {
    localStorage.removeItem(DICT_SYNCED_STORAGE);
    return;
  }
  localStorage.setItem(DICT_SYNCED_STORAGE, JSON.stringify(state));
}

export function formatRelative(ts: number): string {
  const diffSec = (Date.now() - ts) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}
