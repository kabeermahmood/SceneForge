const PARAGRAPH_SPLIT = /\n{2,}/;
const SENTENCE_SPLIT = /(?<=[.!?\u2026\u2014])\s+/;
const CLAUSE_SPLIT = /(?<=[,;:])\s+/;
const WORD_SPLIT = /\s+/;

export function splitScript(text: string, maxChars: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const paragraphs = trimmed
    .split(PARAGRAPH_SPLIT)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (const piece of splitLong(paragraph, maxChars)) {
        chunks.push(piece);
      }
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = paragraph;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function splitLong(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const sentences = text.split(SENTENCE_SPLIT).filter(Boolean);
  if (sentences.length > 1) {
    return packPieces(sentences, maxChars, " ", (piece) =>
      piece.length > maxChars ? splitByClauses(piece, maxChars) : [piece]
    );
  }

  return splitByClauses(text, maxChars);
}

function splitByClauses(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const clauses = text.split(CLAUSE_SPLIT).filter(Boolean);
  if (clauses.length > 1) {
    return packPieces(clauses, maxChars, " ", (piece) =>
      piece.length > maxChars ? splitByWords(piece, maxChars) : [piece]
    );
  }

  return splitByWords(text, maxChars);
}

function splitByWords(text: string, maxChars: number): string[] {
  const words = text.split(WORD_SPLIT).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += maxChars) {
        chunks.push(word.slice(i, i + maxChars));
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      chunks.push(current);
      current = word;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function packPieces(
  pieces: string[],
  maxChars: number,
  joiner: string,
  fallback: (piece: string) => string[]
): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const raw of pieces) {
    const piece = raw.trim();
    if (!piece) continue;

    if (piece.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (const fb of fallback(piece)) chunks.push(fb);
      continue;
    }

    const candidate = current ? `${current}${joiner}${piece}` : piece;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = piece;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
