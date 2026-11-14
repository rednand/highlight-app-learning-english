import { foldAccents, textKey } from "./text"

export type ReviewState = "active" | "discarded" | "none"

export type CardState = { discarded_at: string | null }

export function reviewStateOf(cards: CardState | CardState[] | null | undefined): ReviewState {
  const list = Array.isArray(cards) ? cards : cards ? [cards] : []
  if (list.length === 0) return "none"
  return list.some((card) => !card.discarded_at) ? "active" : "discarded"
}

export type WordFilter = "todas" | "revisao" | "fora" | "repetidas"

export type WordItem = {
  id: string
  lessonId: string
  term: string
  translation: string | null
  sourceTitle: string | null
  sourceType: string | null
  reviewState: ReviewState
  searchText: string
}

export type WordWithDuplicates = WordItem & { duplicates: number }

export const termKey = textKey

/** Quantas vezes cada termo aparece na lista (mesmo termo, sem diferenciar maiúsculas e acentos). */
export function countDuplicates(terms: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const term of terms) {
    const key = termKey(term)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/**
 * Marca quantas cópias de cada palavra estão na revisão. Só conta as que
 * estão ativas: descartar uma cópia resolve a repetição.
 */
export function withDuplicates<T extends Pick<WordItem, "term" | "reviewState">>(words: T[]): (T & { duplicates: number })[] {
  const active = countDuplicates(words.filter((w) => w.reviewState === "active").map((w) => w.term))
  return words.map((w) => ({
    ...w,
    duplicates: w.reviewState === "active" ? (active.get(termKey(w.term)) ?? 1) : 1,
  }))
}

export function normalizeSearch(value: string): string {
  return foldAccents(value).trim()
}

export function buildSearchText(fields: (string | null | undefined)[]): string {
  return normalizeSearch(fields.filter(Boolean).join(" \u0000 "))
}

export function filterWords<T extends Pick<WordWithDuplicates, "reviewState" | "searchText" | "duplicates">>(
  words: T[],
  query: string,
  filter: WordFilter,
): T[] {
  const q = normalizeSearch(query)
  return words.filter((word) => {
    if (filter === "revisao" && word.reviewState !== "active") return false
    if (filter === "fora" && word.reviewState !== "discarded") return false
    if (filter === "repetidas" && word.duplicates < 2) return false
    return !q || word.searchText.includes(q)
  })
}

export function countByFilter(words: Pick<WordWithDuplicates, "reviewState" | "duplicates">[]): Record<WordFilter, number> {
  let revisao = 0
  let fora = 0
  let repetidas = 0
  for (const word of words) {
    if (word.reviewState === "active") revisao++
    else if (word.reviewState === "discarded") fora++
    if (word.duplicates > 1) repetidas++
  }
  return { todas: words.length, revisao, fora, repetidas }
}
