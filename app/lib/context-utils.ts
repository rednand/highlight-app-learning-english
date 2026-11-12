export type SentencePart = { text: string; match: boolean }

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function splitByTerm(sentence: string, term: string): SentencePart[] {
  const needle = term.trim()
  if (!needle) return [{ text: sentence, match: false }]
  const pattern = new RegExp(`(${escapeRegExp(needle)})`, "gi")
  return sentence
    .split(pattern)
    .filter((text) => text !== "")
    .map((text) => ({ text, match: text.toLowerCase() === needle.toLowerCase() }))
}

const CONTEXT_LABELS: Record<string, string> = {
  movie: "Na cena",
  music: "Na música",
  book: "No livro",
}

export function contextLabel(sourceType: string | null | undefined): string {
  return CONTEXT_LABELS[sourceType ?? ""] ?? "Exemplo"
}
