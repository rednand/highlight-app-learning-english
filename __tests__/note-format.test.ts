import { describe, it, expect } from "vitest"
import { parseNote, stripNoteColors, hasNoteColors, isNoteColor } from "../app/lib/note-format"

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

  it("diz se há alguma cor aplicada", () => {
    expect(hasNoteColors(parseNote("[azul]x[/azul]"))).toBe(true)
    expect(hasNoteColors(parseNote("[azul]x"))).toBe(false)
    expect(hasNoteColors(parseNote("nada"))).toBe(false)
  })

  it("reconhece só as cores da paleta", () => {
    expect(isNoteColor("verde")).toBe(true)
    expect(isNoteColor("roxo")).toBe(false)
  })
})
