export type ReviewState = "active" | "discarded" | "none"

export type CardState = { discarded_at: string | null }

export function reviewStateOf(cards: CardState | CardState[] | null | undefined): ReviewState {
  const card = Array.isArray(cards) ? cards[0] : cards
  if (!card) return "none"
  return card.discarded_at ? "discarded" : "active"
}

export type WordFilter = "todas" | "revisao" | "fora"

export type WordRow = {
  id: string
  term: string
  translation: string | null
  reviewState: ReviewState
  sourceTitle: string | null
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

export function filterWords<T extends WordRow>(words: T[], query: string, filter: WordFilter): T[] {
  const q = normalizeSearch(query)
  return words.filter((word) => {
    if (filter === "revisao" && word.reviewState !== "active") return false
    if (filter === "fora" && word.reviewState !== "discarded") return false
    if (!q) return true
    return [word.term, word.translation, word.sourceTitle]
      .some((field) => field && normalizeSearch(field).includes(q))
  })
}
