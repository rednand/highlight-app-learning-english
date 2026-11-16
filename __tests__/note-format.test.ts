import { describe, it, expect } from "vitest"
import { parseNote, stripNoteColors, hasNoteColors, applyNoteColor, isNoteColor } from "../app/lib/note-format"

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
  it("tira todas as marcações", () => {
    expect(stripNoteColors("use [verde]spend[/verde] e [rosa]isso")).toBe("use spend e isso")
  })

  it("diz se há alguma cor aplicada", () => {
    expect(hasNoteColors("[azul]x[/azul]")).toBe(true)
    expect(hasNoteColors("[azul]x")).toBe(false)
    expect(hasNoteColors("nada")).toBe(false)
  })

  it("reconhece só as cores da paleta", () => {
    expect(isNoteColor("verde")).toBe(true)
    expect(isNoteColor("roxo")).toBe(false)
  })
})

describe("applyNoteColor", () => {
  it("pinta o trecho selecionado e mantém a seleção nele", () => {
    const r = applyNoteColor("spend time", 0, 5, "verde")
    expect(r.text).toBe("[verde]spend[/verde] time")
    expect(r.text.slice(r.selectionStart, r.selectionEnd)).toBe("spend")
  })

  it("pintar de novo troca a cor em vez de aninhar", () => {
    const first = applyNoteColor("spend time", 0, 5, "verde")
    const start = first.selectionStart - "[verde]".length
    const end = first.selectionEnd + "[/verde]".length
    const second = applyNoteColor(first.text, start, end, "azul")
    expect(second.text).toBe("[azul]spend[/azul] time")
  })

  it("tira a cor com null", () => {
    const original = "[rosa]oi[/rosa] tudo"
    const r = applyNoteColor(original, 0, original.length, null)
    expect(r.text).toBe("oi tudo")
    expect(r.text.slice(r.selectionStart, r.selectionEnd)).toBe("oi tudo")
  })

  it("aceita seleção de trás para frente e fora dos limites", () => {
    expect(applyNoteColor("abc", 3, 1, "azul").text).toBe("a[azul]bc[/azul]")
    expect(applyNoteColor("abc", -5, 99, "azul").text).toBe("[azul]abc[/azul]")
  })
})
