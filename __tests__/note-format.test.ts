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

/** Posição de uma palavra no texto bruto (para simular a seleção no campo). */
function sel(text: string, word: string): [number, number] {
  const i = text.indexOf(word)
  return [i, i + word.length]
}

describe("applyNoteColor", () => {
  it("pinta o trecho selecionado e mantém a seleção nele", () => {
    const r = applyNoteColor("spend time", 0, 5, "verde")
    expect(r.text).toBe("[verde]spend[/verde] time")
    expect(r.text.slice(r.selectionStart, r.selectionEnd)).toBe("spend")
  })

  it("pintar de novo a mesma palavra troca a cor, sem aninhar", () => {
    const first = applyNoteColor("spend time", 0, 5, "verde")
    const second = applyNoteColor(first.text, first.selectionStart, first.selectionEnd, "azul")
    expect(second.text).toBe("[azul]spend[/azul] time")
    expect(parseNote(second.text)).toEqual([{ text: "spend", color: "azul" }, { text: " time", color: null }])
  })

  it("borracha funciona selecionando só a palavra colorida", () => {
    const text = "[rosa]oi[/rosa] tudo"
    const r = applyNoteColor(text, ...sel(text, "oi"), null)
    expect(r.text).toBe("oi tudo")
    expect(r.text.slice(r.selectionStart, r.selectionEnd)).toBe("oi")
  })

  it("pintar metade de um trecho colorido divide sem quebrar a marcação", () => {
    const text = "[verde]spend time[/verde] now"
    const [start] = sel(text, "time")
    const r = applyNoteColor(text, start, text.length, "azul")
    expect(r.text).toBe("[verde]spend [/verde][azul]time now[/azul]")
    expect(stripNoteColors(r.text)).toBe("spend time now")
  })

  it("seleção começando no meio de uma marcação não deixa pedaços de código", () => {
    const text = "[verde]spend[/verde]"
    const r = applyNoteColor(text, 3, text.length, "azul")
    expect(r.text).toBe("[azul]spend[/azul]")
  })

  it("juntar trechos vizinhos da mesma cor vira um só", () => {
    const text = "[verde]a[/verde]b"
    const r = applyNoteColor(text, ...sel(text, "b"), "verde")
    expect(r.text).toBe("[verde]ab[/verde]")
  })

  it("aceita seleção de trás para frente e fora dos limites", () => {
    expect(applyNoteColor("abc", 3, 1, "azul").text).toBe("a[azul]bc[/azul]")
    expect(applyNoteColor("abc", -5, 99, "azul").text).toBe("[azul]abc[/azul]")
  })

  it("seleção vazia não muda o texto nem move o cursor", () => {
    expect(applyNoteColor("abc", 1, 1, "azul")).toEqual({ text: "abc", selectionStart: 1, selectionEnd: 1 })
    const colored = "x[verde]ab[/verde]"
    expect(applyNoteColor(colored, 1, 1, "azul")).toEqual({ text: colored, selectionStart: 1, selectionEnd: 1 })
  })
})
