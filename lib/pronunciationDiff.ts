import { diffArrays } from "diff";
import { doubleMetaphone } from "double-metaphone";
import { toWords, toWordsOrdinal } from "number-to-words";

export type DiffStatus =
  | "match"
  | "phonetic_match"
  | "mismatch"
  | "missing"
  | "extra";

export interface DiffWord {
  scriptWord: string | null;
  spokenWord: string | null;
  confidence: number | null;
  status: DiffStatus;
  start: number | null;
  end: number | null;
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface DiffStats {
  total: number;
  matches: number;
  phoneticMatches: number;
  mismatches: number;
  missing: number;
  extra: number;
  accuracy: number;
}

/**
 * Convert a year-like 4-digit number into spoken halves:
 *   1916 → "nineteen sixteen", 1800 → "eighteen hundred",
 *   2000 → "two thousand", 2024 → "twenty twenty four"
 */
function yearToWords(n: number): string {
  const hi = Math.floor(n / 100);
  const lo = n % 100;
  if (lo === 0) {
    if (hi % 10 === 0) return toWords(n);        // 2000 → "two thousand"
    return `${toWords(hi)} hundred`;              // 1800 → "eighteen hundred"
  }
  return `${toWords(hi)} ${toWords(lo)}`;         // 1916 → "nineteen sixteen"
}

const ORDINAL_SUFFIXES = /^(\d+)(?:st|nd|rd|th)$/i;
const YEAR_RANGE = /^(1[89]\d{2}|20\d{2})$/;

/**
 * Replace all digit sequences in the text with their spoken-word equivalents.
 * Runs before any other normalization so the diff sees words instead of digits.
 */
function expandNumbers(text: string): string {
  return text.replace(/\d+(?:st|nd|rd|th)?/gi, (token) => {
    const ordinalMatch = token.match(ORDINAL_SUFFIXES);
    if (ordinalMatch) {
      return toWordsOrdinal(Number(ordinalMatch[1]));
    }

    const n = Number(token);
    if (!Number.isFinite(n)) return token;

    if (YEAR_RANGE.test(token)) {
      return yearToWords(n);
    }

    return toWords(n);
  });
}

export function cleanText(text: string): string[] {
  return expandNumbers(text)
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^\w]/g, "");
}

function phoneticallyEqual(a: string, b: string): boolean {
  const [aPri, aSec] = doubleMetaphone(a);
  const [bPri, bSec] = doubleMetaphone(b);

  if (!aPri || !bPri) return false;

  return (
    aPri === bPri ||
    aPri === bSec ||
    aSec === bPri ||
    (aSec !== "" && bSec !== "" && aSec === bSec)
  );
}

/**
 * Align script and transcript using the `diff` library's LCS-based
 * diffArrays, then apply Double Metaphone on changed sections.
 *
 * This handles 1-to-many expansions (e.g. "1916" → "nineteen sixteen")
 * and any other insertions/deletions gracefully, preventing the cascading
 * mismatch problem of a naive index-by-index comparison.
 */
export function diffWords(
  scriptWords: string[],
  transcriptWords: TranscriptWord[]
): DiffWord[] {
  const cleanedScript = scriptWords.map(cleanWord);
  const cleanedTranscript = transcriptWords.map((tw) => cleanWord(tw.word));

  const changes = diffArrays(cleanedScript, cleanedTranscript);

  const result: DiffWord[] = [];
  let sIdx = 0; // pointer into scriptWords
  let tIdx = 0; // pointer into transcriptWords

  for (let ci = 0; ci < changes.length; ci++) {
    const change = changes[ci];
    const count = change.count ?? change.value.length;

    if (!change.added && !change.removed) {
      // Common / exact match — words are identical after cleaning
      for (let k = 0; k < count; k++) {
        const tw = transcriptWords[tIdx];
        result.push({
          scriptWord: scriptWords[sIdx],
          spokenWord: tw.word,
          confidence: tw.confidence,
          status: "match",
          start: tw.start,
          end: tw.end,
        });
        sIdx++;
        tIdx++;
      }
    } else if (change.removed && !change.added) {
      // Words in the script that the diff says are NOT in the transcript.
      // Check if the next chunk is an `added` block — that means this is
      // a "changed" section where we can try phonetic pairing.
      const next = ci + 1 < changes.length ? changes[ci + 1] : null;

      if (next && next.added) {
        // Changed section: pair removed (script) with added (transcript)
        const removedCount = count;
        const addedCount = next.count ?? next.value.length;
        const paired = Math.min(removedCount, addedCount);

        for (let k = 0; k < paired; k++) {
          const sw = scriptWords[sIdx + k];
          const tw = transcriptWords[tIdx + k];
          const status: DiffStatus = phoneticallyEqual(
            cleanWord(sw),
            cleanWord(tw.word)
          )
            ? "phonetic_match"
            : "mismatch";

          result.push({
            scriptWord: sw,
            spokenWord: tw.word,
            confidence: tw.confidence,
            status,
            start: tw.start,
            end: tw.end,
          });
        }

        // Leftover script words (removed more than added)
        for (let k = paired; k < removedCount; k++) {
          result.push({
            scriptWord: scriptWords[sIdx + k],
            spokenWord: null,
            confidence: null,
            status: "missing",
            start: null,
            end: null,
          });
        }

        // Leftover transcript words (added more than removed)
        for (let k = paired; k < addedCount; k++) {
          const tw = transcriptWords[tIdx + k];
          result.push({
            scriptWord: null,
            spokenWord: tw.word,
            confidence: tw.confidence,
            status: "extra",
            start: tw.start,
            end: tw.end,
          });
        }

        sIdx += removedCount;
        tIdx += addedCount;
        ci++; // skip the next (added) chunk since we consumed it
      } else {
        // Pure removal — words in script but not in transcript at all
        for (let k = 0; k < count; k++) {
          result.push({
            scriptWord: scriptWords[sIdx],
            spokenWord: null,
            confidence: null,
            status: "missing",
            start: null,
            end: null,
          });
          sIdx++;
        }
      }
    } else if (change.added) {
      // Pure addition — Deepgram heard words not in the script (e.g. "um")
      for (let k = 0; k < count; k++) {
        const tw = transcriptWords[tIdx];
        result.push({
          scriptWord: null,
          spokenWord: tw.word,
          confidence: tw.confidence,
          status: "extra",
          start: tw.start,
          end: tw.end,
        });
        tIdx++;
      }
    }
  }

  return result;
}

export function computeStats(words: DiffWord[]): DiffStats {
  const stats: DiffStats = {
    total: words.length,
    matches: 0,
    phoneticMatches: 0,
    mismatches: 0,
    missing: 0,
    extra: 0,
    accuracy: 0,
  };

  for (const w of words) {
    switch (w.status) {
      case "match":
        stats.matches++;
        break;
      case "phonetic_match":
        stats.phoneticMatches++;
        break;
      case "mismatch":
        stats.mismatches++;
        break;
      case "missing":
        stats.missing++;
        break;
      case "extra":
        stats.extra++;
        break;
    }
  }

  const denominator = stats.total || 1;
  stats.accuracy =
    Math.round(
      ((stats.matches + stats.phoneticMatches) / denominator) * 10000
    ) / 100;

  return stats;
}
