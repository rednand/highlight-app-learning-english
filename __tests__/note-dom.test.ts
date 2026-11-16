import { describe, it, expect, beforeEach } from "vitest"
import { renderNoteInto, readNoteFrom, getVisibleSelection, setVisibleSelection, hasElementBreaks, COLOR_ATTR } from "../app/lib/note-dom"
import { paintSegments, serializeSegments, normalizeSegments, parseNote } from "../app/lib/note-format"

const classFor = (c: string) => `c-${c}`
let el: HTMLDivElement

beforeEach(() => {
  document.body.innerHTML = ""
  el = document.createElement("div")
  el.contentEditable = "true"
  document.body.appendChild(el)
})

describe("paintSegments / serializeSegments", () => {
  const base = parseNote("spend [verde]time[/verde] now")

  it("pinta letras visíveis, mesmo cortando um trecho colorido", () => {
    expect(serializeSegments(paintSegments(base, 8, 14, "azul"))).toBe("spend [verde]ti[/verde][azul]me now[/azul]")
  })

  it("tira a cor com null e junta com o vizinho", () => {
    expect(serializeSegments(paintSegments(base, 6, 10, null))).toBe("spend time now")
  })

  it("aceita intervalo invertido e fora do texto", () => {
    expect(serializeSegments(paintSegments(parseNote("abc"), 3, 1, "rosa"))).toBe("a[rosa]bc[/rosa]")
    expect(serializeSegments(paintSegments(parseNote("abc"), 0, 99, "rosa"))).toBe("[rosa]abc[/rosa]")
  })

  it("normaliza juntando vizinhos iguais e tirando vazios", () => {
    expect(normalizeSegments([{ text: "a", color: "verde" }, { text: "", color: null }, { text: "b", color: "verde" }]))
      .toEqual([{ text: "ab", color: "verde" }])
  })
})

describe("renderNoteInto / readNoteFrom", () => {
  it("desenha os trechos com spans e lê de volta igual", () => {
    const segments = parseNote("oi [amarelo]tudo[/amarelo] bem\nlinha 2")
    renderNoteInto(el, segments, classFor)
    const span = el.querySelector(`[${COLOR_ATTR}]`)
    expect(span?.getAttribute(COLOR_ATTR)).toBe("amarelo")
    expect(span?.className).toBe("c-amarelo")
    expect(readNoteFrom(el)).toEqual(segments)
  })

  it("nunca interpreta o texto como HTML", () => {
    renderNoteInto(el, [{ text: "<img src=x onerror=alert(1)>", color: null }], classFor)
    expect(el.querySelector("img")).toBeNull()
    expect(readNoteFrom(el)).toEqual([{ text: "<img src=x onerror=alert(1)>", color: null }])
  })

  it("entende <br> e <div> que o navegador cria ao quebrar linha", () => {
    el.innerHTML = "a<br>b<div>c</div><div><span data-note-color=\"verde\">d</span></div>"
    expect(serializeSegments(readNoteFrom(el))).toBe("a\nb\nc\n[verde]d[/verde]")
  })

  it("ignora o <br> que sobra no fim do editor", () => {
    el.innerHTML = "texto<br>"
    expect(readNoteFrom(el)).toEqual([{ text: "texto", color: null }])
  })

  it("span sem cor válida herda a cor de fora", () => {
    el.innerHTML = "<span data-note-color=\"azul\">a<span data-note-color=\"roxo\">b</span></span>"
    expect(serializeSegments(readNoteFrom(el))).toBe("[azul]ab[/azul]")
  })

  it("editor vazio não tem trechos", () => {
    expect(readNoteFrom(el)).toEqual([])
  })
})

describe("seleção em letras visíveis", () => {
  it("lê e posiciona a seleção atravessando spans", () => {
    renderNoteInto(el, parseNote("spend [verde]time[/verde] now"), classFor)
    setVisibleSelection(el, 3, 12)
    expect(getVisibleSelection(el)).toEqual({ from: 3, to: 12 })
    expect(document.getSelection()?.toString()).toBe("nd time n")
  })

  it("seleção fora do editor devolve null", () => {
    renderNoteInto(el, parseNote("abc"), classFor)
    const outside = document.createElement("p")
    outside.textContent = "fora"
    document.body.appendChild(outside)
    const range = document.createRange()
    range.selectNodeContents(outside)
    document.getSelection()?.removeAllRanges()
    document.getSelection()?.addRange(range)
    expect(getVisibleSelection(el)).toBeNull()
  })

  it("posição além do fim vai para o final do texto", () => {
    renderNoteInto(el, parseNote("abc"), classFor)
    setVisibleSelection(el, 1, 50)
    expect(getVisibleSelection(el)).toEqual({ from: 1, to: 3 })
  })
})

describe("quebras de linha como elemento", () => {
  it("seleção depois de um <br> conta a quebra, igual à leitura", () => {
    el.innerHTML = "a<br>bc"
    const text = el.lastChild as Text
    const range = document.createRange()
    range.setStart(text, 0)
    range.setEnd(text, 2)
    document.getSelection()?.removeAllRanges()
    document.getSelection()?.addRange(range)
    expect(getVisibleSelection(el)).toEqual({ from: 2, to: 4 })
    expect(serializeSegments(readNoteFrom(el)).slice(2, 4)).toBe("bc")
  })

  it("seleção dentro de um <div> criado pelo navegador também bate", () => {
    el.innerHTML = "ab<div>cd</div>"
    const text = el.querySelector("div")!.firstChild as Text
    const range = document.createRange()
    range.setStart(text, 1)
    range.setEnd(text, 2)
    document.getSelection()?.removeAllRanges()
    document.getSelection()?.addRange(range)
    expect(getVisibleSelection(el)).toEqual({ from: 4, to: 5 })
    expect(serializeSegments(readNoteFrom(el))).toBe("ab\ncd")
  })

  it("posicionar a seleção logo depois de um <br>", () => {
    el.innerHTML = "a<br>bc"
    setVisibleSelection(el, 2, 3)
    expect(getVisibleSelection(el)).toEqual({ from: 2, to: 3 })
    expect(document.getSelection()?.toString()).toBe("b")
  })

  it("detecta quando há quebras como elemento", () => {
    el.innerHTML = "a<br>b"
    expect(hasElementBreaks(el)).toBe(true)
    renderNoteInto(el, parseNote("a\nb"), classFor)
    expect(hasElementBreaks(el)).toBe(false)
  })

  it("linha nova no fim ganha um <br> de apoio que não vira texto", () => {
    renderNoteInto(el, parseNote("abc\n"), classFor)
    expect(el.lastChild?.nodeName).toBe("BR")
    expect(serializeSegments(readNoteFrom(el))).toBe("abc\n")
    expect(hasElementBreaks(el)).toBe(false)
  })
})

describe("casos de borda do editor", () => {
  it("apagar tudo deixa só o <br> do navegador: o editor fica vazio", () => {
    el.innerHTML = "<br>"
    expect(readNoteFrom(el)).toEqual([])
    expect(hasElementBreaks(el)).toBe(false)
  })

  it("span com cor vazia dentro de um colorido fica sem cor", () => {
    el.innerHTML = '<span data-note-color="verde">a<span data-note-color="">b</span></span>'
    expect(serializeSegments(readNoteFrom(el))).toBe("[verde]a[/verde]b")
  })
})
