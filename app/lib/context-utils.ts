export type SentencePart = { text: string; match: boolean }

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function splitByTerm(sentence: string, term: string): SentencePart[] {
  const needle = term.trim()
  if (!needle) return [{ text: sentence, match: false }]
  const body = escapeRegExp(needle).replace(/['’]/g, "['’]")
  const pattern = new RegExp(`(?<![A-Za-z])(${body})(?![A-Za-z])`, "gi")
  const parts: SentencePart[] = []
  let last = 0
  for (const match of sentence.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > last) parts.push({ text: sentence.slice(last, start), match: false })
    parts.push({ text: match[0], match: true })
    last = start + match[0].length
  }
  if (last < sentence.length) parts.push({ text: sentence.slice(last), match: false })
  return parts.length > 0 ? parts : [{ text: sentence, match: false }]
}

const CONTEXT_LABELS: Record<string, string> = {
  movie: "Na cena",
  music: "Na música",
  book: "No livro",
}

export function contextLabel(sourceType: string | null | undefined): string {
  return CONTEXT_LABELS[sourceType ?? ""] ?? "Exemplo"
}
