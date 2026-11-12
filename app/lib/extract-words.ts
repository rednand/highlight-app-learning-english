import COMMON_WORDS from "./common-words"

export type ExtractedTerm = {
  term: string
  sentence: string
}

const MAX_SENTENCE_LENGTH = 200

export function splitSentences(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

function normalizeWords(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[-']+|[-']+$/g, ""))
    .filter((w) => w.length > 3 && !COMMON_WORDS.has(w) && /^[a-z]/.test(w))
}

function trimSentence(sentence: string): string {
  if (sentence.length <= MAX_SENTENCE_LENGTH) return sentence
  return `${sentence.slice(0, MAX_SENTENCE_LENGTH - 1).trimEnd()}…`
}

export function extractUncommonWords(text: string): ExtractedTerm[] {
  const seen = new Map<string, string>()
  for (const sentence of splitSentences(text)) {
    for (const term of normalizeWords(sentence)) {
      if (!seen.has(term)) seen.set(term, trimSentence(sentence))
    }
  }
  return [...seen].map(([term, sentence]) => ({ term, sentence }))
}
