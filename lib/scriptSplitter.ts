const DEFAULT_MAX_CHARS = 2000;

/**
 * Splits a script into roughly equal parts at natural text boundaries.
 * Prefers paragraph breaks > newlines > sentence ends > word boundaries.
 */
export function splitScript(
  script: string,
  maxCharsPerPart = DEFAULT_MAX_CHARS
): string[] {
  const trimmed = script.trim();
  if (trimmed.length <= maxCharsPerPart) return [trimmed];

  const partCount = Math.ceil(trimmed.length / maxCharsPerPart);
  const targetSize = Math.ceil(trimmed.length / partCount);

  const parts: string[] = [];
  let cursor = 0;

  while (cursor < trimmed.length) {
    if (trimmed.length - cursor <= targetSize * 1.15) {
      parts.push(trimmed.slice(cursor).trim());
      break;
    }

    const windowEnd = Math.min(cursor + targetSize + 200, trimmed.length);
    const windowStart = Math.max(cursor + targetSize - 200, cursor + 1);
    const window = trimmed.slice(windowStart, windowEnd);

    let splitPos = -1;

    const paraBreak = window.indexOf("\n\n");
    if (paraBreak !== -1) {
      splitPos = windowStart + paraBreak + 2;
    }

    if (splitPos === -1) {
      const newline = window.indexOf("\n");
      if (newline !== -1) {
        splitPos = windowStart + newline + 1;
      }
    }

    if (splitPos === -1) {
      const sentenceMatch = window.match(/[.!?]\s/);
      if (sentenceMatch && sentenceMatch.index !== undefined) {
        splitPos = windowStart + sentenceMatch.index + 2;
      }
    }

    if (splitPos === -1) {
      const spaceIdx = window.lastIndexOf(" ");
      if (spaceIdx !== -1) {
        splitPos = windowStart + spaceIdx + 1;
      }
    }

    if (splitPos === -1 || splitPos <= cursor) {
      splitPos = cursor + targetSize;
    }

    parts.push(trimmed.slice(cursor, splitPos).trim());
    cursor = splitPos;
  }

  return parts.filter((p) => p.length > 0);
}
