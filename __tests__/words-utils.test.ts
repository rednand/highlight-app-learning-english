import { describe, it, expect } from "vitest"
import { reviewStateOf, filterWords, normalizeSearch, type WordRow } from "../app/lib/words-utils"

describe("reviewStateOf", () => {
  it("sem card é 'none'", () => {
    expect(reviewStateOf(null)).toBe("none")
    expect(reviewStateOf(undefined)).toBe("none")
    expect(reviewStateOf([])).toBe("none")
  })

  it("aceita objeto ou lista", () => {
    expect(reviewStateOf({ discarded_at: null })).toBe("active")
    expect(reviewStateOf([{ discarded_at: "2026-11-14T00:00:00Z" }])).toBe("discarded")
  })
})

describe("normalizeSearch", () => {
  it("ignora acentos, maiúsculas e espaços nas pontas", () => {
    expect(normalizeSearch("  Cônjuge ")).toBe("conjuge")
  })
})

describe("filterWords", () => {
  const words: WordRow[] = [
    { id: "1", term: "Spouse", translation: "Cônjuge", reviewState: "active", sourceTitle: "A Última Casa" },
    { id: "2", term: "Referee", translation: "Árbitro", reviewState: "discarded", sourceTitle: "Crystal Lake" },
    { id: "3", term: "besieged", translation: null, reviewState: "none", sourceTitle: null },
  ]

  it("'todas' sem busca devolve tudo", () => {
    expect(filterWords(words, "", "todas").map((w) => w.id)).toEqual(["1", "2", "3"])
  })

  it("filtra por estado da revisão", () => {
    expect(filterWords(words, "", "revisao").map((w) => w.id)).toEqual(["1"])
    expect(filterWords(words, "", "fora").map((w) => w.id)).toEqual(["2"])
  })

  it("busca no termo, na tradução e no título, sem acento", () => {
    expect(filterWords(words, "conjuge", "todas").map((w) => w.id)).toEqual(["1"])
    expect(filterWords(words, "ARBITRO", "todas").map((w) => w.id)).toEqual(["2"])
    expect(filterWords(words, "crystal", "todas").map((w) => w.id)).toEqual(["2"])
    expect(filterWords(words, "besie", "todas").map((w) => w.id)).toEqual(["3"])
  })

  it("combina busca e filtro", () => {
    expect(filterWords(words, "referee", "revisao")).toEqual([])
  })
})
