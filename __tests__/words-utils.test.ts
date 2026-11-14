import { describe, it, expect } from "vitest"
import {
  reviewStateOf,
  filterWords,
  normalizeSearch,
  buildSearchText,
  countByFilter,
  type WordItem,
} from "../app/lib/words-utils"
import { foldAccents } from "../app/lib/text"

describe("foldAccents", () => {
  it("remove acentos e deixa minúsculo", () => {
    expect(foldAccents("ÁRBITRO Cônjuge ação")).toBe("arbitro conjuge acao")
  })
})

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

  it("com vários cards, está na revisão se algum estiver ativo", () => {
    expect(reviewStateOf([{ discarded_at: "2026-11-14" }, { discarded_at: null }])).toBe("active")
    expect(reviewStateOf([{ discarded_at: "2026-11-14" }, { discarded_at: "2026-11-13" }])).toBe("discarded")
  })
})

describe("normalizeSearch e buildSearchText", () => {
  it("ignora acentos, maiúsculas e espaços nas pontas", () => {
    expect(normalizeSearch("  Cônjuge ")).toBe("conjuge")
  })

  it("junta só os campos preenchidos", () => {
    const text = buildSearchText(["Spouse", null, "A Última Casa", undefined])
    expect(text).toContain("spouse")
    expect(text).toContain("a ultima casa")
  })

  it("não deixa a busca casar entre dois campos", () => {
    const text = buildSearchText(["spouse", "conjuge"])
    expect(text.includes("spouse conjuge")).toBe(false)
  })
})

function word(id: string, fields: [string, string | null, string | null], reviewState: WordItem["reviewState"]): WordItem {
  const [term, translation, sourceTitle] = fields
  return {
    id, lessonId: `l${id}`, term, translation, sourceTitle, sourceType: null, reviewState,
    searchText: buildSearchText(fields),
  }
}

describe("filterWords", () => {
  const words = [
    word("1", ["Spouse", "Cônjuge", "A Última Casa"], "active"),
    word("2", ["Referee", "Árbitro", "Crystal Lake"], "discarded"),
    word("3", ["besieged", null, null], "none"),
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

  it("conta por filtro", () => {
    expect(countByFilter(words)).toEqual({ todas: 3, revisao: 1, fora: 1 })
  })
})
