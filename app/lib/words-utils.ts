import { foldAccents } from "./text"

export type ReviewState = "active" | "discarded" | "none"

export type CardState = { discarded_at: string | null }

export function reviewStateOf(cards: CardState | CardState[] | null | undefined): ReviewState {
  const list = Array.isArray(cards) ? cards : cards ? [cards] : []
  if (list.length === 0) return "none"
  return list.some((card) => !card.discarded_at) ? "active" : "discarded"
}

export type WordFilter = "todas" | "revisao" | "fora"

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

export function normalizeSearch(value: string): string {
  return foldAccents(value).trim()
}

export function buildSearchText(fields: (string | null | undefined)[]): string {
  return normalizeSearch(fields.filter(Boolean).join(" \u0000 "))
}

export function filterWords<T extends Pick<WordItem, "reviewState" | "searchText">>(
  words: T[],
  query: string,
  filter: WordFilter,
): T[] {
  const q = normalizeSearch(query)
  return words.filter((word) => {
    if (filter === "revisao" && word.reviewState !== "active") return false
    if (filter === "fora" && word.reviewState !== "discarded") return false
    return !q || word.searchText.includes(q)
  })
}

export function countByFilter(words: Pick<WordItem, "reviewState">[]): Record<WordFilter, number> {
  let revisao = 0
  let fora = 0
  for (const word of words) {
    if (word.reviewState === "active") revisao++
    else if (word.reviewState === "discarded") fora++
  }
  return { todas: words.length, revisao, fora }
}
