import { describe, it, expect } from "vitest"
import { parseNote, stripNoteColors, isNoteColor, serializeSegments, replaceInSegments } from "../app/lib/note-format"

describe("parseNote", () => {
  it("texto sem cor vira um trecho só", () => {
    expect(parseNote("spend time")).toEqual([{ text: "spend time", color: null }])
  })

  it("separa trechos coloridos do resto", () => {
    expect(parseNote("use [verde]spend[/verde] e não [vermelho]pass[/vermelho]!")).toEqual([
      { text: "use ", color: null },
      { text: "spend", color: "verde" },
      { text: " e não ", color: null },
      { text: "pass", color: "vermelho" },
      { text: "!", color: null },
    ])
  })

  it("aceita várias linhas dentro da cor", () => {
    expect(parseNote("[amarelo]linha 1\nlinha 2[/amarelo]")).toEqual([{ text: "linha 1\nlinha 2", color: "amarelo" }])
  })

  it("deixa como texto marcação incompleta, de outra cor ou desconhecida", () => {
    expect(parseNote("[verde]sem fim")).toEqual([{ text: "[verde]sem fim", color: null }])
    expect(parseNote("[verde]x[/azul]")).toEqual([{ text: "[verde]x[/azul]", color: null }])
    expect(parseNote("[roxo]x[/roxo]")).toEqual([{ text: "[roxo]x[/roxo]", color: null }])
  })

  it("ignora cor vazia", () => {
    expect(parseNote("a[azul][/azul]b")).toEqual([{ text: "a", color: null }, { text: "b", color: null }])
  })

  it("não interpreta HTML", () => {
    expect(parseNote("<b>oi</b>")).toEqual([{ text: "<b>oi</b>", color: null }])
  })
})

describe("stripNoteColors e hasNoteColors", () => {
  it("devolve o texto como aparece na tela", () => {
    expect(stripNoteColors("use [verde]spend[/verde] e isso")).toBe("use spend e isso")
  })

  it("marcação sem par continua aparecendo, igual na tela", () => {
    expect(stripNoteColors("[verde]sem fim")).toBe("[verde]sem fim")
  })

  it("reconhece só as cores da paleta", () => {
    expect(isNoteColor("verde")).toBe(true)
    expect(isNoteColor("roxo")).toBe(false)
  })
})

describe("texto que imita a marcação", () => {
  it("o que a pessoa digita como [azul]…[/azul] continua texto depois de salvar", () => {
    const saved = serializeSegments([{ text: "use [azul]x[/azul] assim", color: null }])
    expect(parseNote(saved).every((segment) => segment.color === null)).toBe(true)
    expect(stripNoteColors(saved).replace(/\u2060/g, "")).toBe("use [azul]x[/azul] assim")
  })

  it("um [/verde] digitado dentro de um trecho verde não fecha a cor antes da hora", () => {
    const saved = serializeSegments([{ text: "a[/verde]b", color: "verde" }])
    expect(parseNote(saved)).toHaveLength(1)
    expect(parseNote(saved)[0].color).toBe("verde")
  })
})

describe("replaceInSegments", () => {
  const base = parseNote("ab[verde]cd[/verde]ef")

  it("insere no meio e o texto herda a cor da letra antes", () => {
    const r = replaceInSegments(base, 3, 3, "X")
    expect(serializeSegments(r.segments)).toBe("ab[verde]cXd[/verde]ef")
    expect(r.caret).toBe(4)
  })

  it("quebra de linha nunca leva cor", () => {
    const r = replaceInSegments(base, 3, 3, "\n")
    expect(serializeSegments(r.segments)).toBe("ab[verde]c[/verde]\n[verde]d[/verde]ef")
  })

  it("troca a seleção pelo texto colado", () => {
    const r = replaceInSegments(base, 1, 5, "--")
    expect(serializeSegments(r.segments)).toBe("a--f")
    expect(r.caret).toBe(3)
  })

  it("no começo do texto o inserido fica sem cor", () => {
    expect(serializeSegments(replaceInSegments(parseNote("[azul]x[/azul]"), 0, 0, "o").segments)).toBe("o[azul]x[/azul]")
  })
})
