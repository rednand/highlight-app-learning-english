import { isNoteColor, normalizeSegments, type NoteColor, type NoteSegment } from "./note-format"

/**
 * Ponte entre o editor visual (um elemento contentEditable) e os trechos da
 * anotação. Os trechos coloridos viram <span data-note-color="verde">; o
 * texto é sempre colocado com textContent, nunca como HTML.
 *
 * Todas as posições ("letras visíveis") são contadas do mesmo jeito em toda
 * parte: cada letra conta 1 e cada quebra de linha conta 1, venha ela de um
 * "\n" no texto, de um <br> ou de um <div> que o navegador criou.
 */

export const COLOR_ATTR = "data-note-color"
const FILLER_ATTR = "data-note-filler"
const BLOCK_TAGS = new Set(["DIV", "P", "LI"])

export function renderNoteInto(
  el: HTMLElement,
  segments: NoteSegment[],
  classFor: (color: NoteColor) => string,
): void {
  const doc = el.ownerDocument
  el.replaceChildren()
  for (const segment of segments) {
    if (!segment.text) continue
    if (segment.color) {
      const span = doc.createElement("span")
      span.setAttribute(COLOR_ATTR, segment.color)
      span.className = classFor(segment.color)
      span.textContent = segment.text
      el.appendChild(span)
    } else {
      el.appendChild(doc.createTextNode(segment.text))
    }
  }
  // Um "\n" no fim do texto não aparece sozinho: um <br> de apoio faz a linha nova existir.
  const last = segments[segments.length - 1]
  if (last?.text.endsWith("\n")) {
    const filler = doc.createElement("br")
    filler.setAttribute(FILLER_ATTR, "")
    el.appendChild(filler)
  }
}

type Piece =
  | { kind: "text"; node: Text; start: number; text: string; color: NoteColor | null }
  | { kind: "break"; node: Element; start: number }

/** Lista, na ordem do documento, tudo que conta como letra visível. */
function linearize(el: HTMLElement): Piece[] {
  const pieces: Piece[] = []
  let pos = 0
  const walk = (node: Node, color: NoteColor | null) => {
    node.childNodes.forEach((child, index) => {
      if (child.nodeType === 3) {
        const text = child.textContent ?? ""
        pieces.push({ kind: "text", node: child as Text, start: pos, text, color })
        pos += text.length
        return
      }
      if (child.nodeType !== 1) return
      const element = child as HTMLElement
      if (element.tagName === "BR") {
        if (element.hasAttribute(FILLER_ATTR)) return
        // <br> no fim do editor é apoio do navegador (inclusive com o editor vazio), não uma linha a mais.
        if (node === el && element === el.lastChild) return
        pieces.push({ kind: "break", node: element, start: pos })
        pos += 1
        return
      }
      const attr = element.getAttribute(COLOR_ATTR)
      const childColor = attr === "" ? null : attr && isNoteColor(attr) ? attr : color
      if (BLOCK_TAGS.has(element.tagName) && index > 0) {
        pieces.push({ kind: "break", node: element, start: pos })
        pos += 1
      }
      walk(element, childColor)
    })
  }
  walk(el, null)
  return pieces
}

/** Lê o que está no editor e devolve os trechos (com quebras de linha como "\n"). */
export function readNoteFrom(el: HTMLElement): NoteSegment[] {
  return normalizeSegments(
    linearize(el).map((piece) =>
      piece.kind === "text" ? { text: piece.text, color: piece.color } : { text: "\n", color: null },
    ),
  )
}

/** True quando o navegador colocou quebras como elementos (<br>, <div>) e vale redesenhar. */
export function hasElementBreaks(el: HTMLElement): boolean {
  return linearize(el).some((piece) => piece.kind === "break")
}

function offsetOf(el: HTMLElement, pieces: Piece[], container: Node, offset: number): number {
  const doc = el.ownerDocument
  const point = doc.createRange()
  point.setStart(container, offset)
  let count = 0
  for (const piece of pieces) {
    if (piece.kind === "text") {
      if (piece.node === container) return piece.start + Math.min(offset, piece.text.length)
      if (point.comparePoint(piece.node, 0) < 0) count = piece.start + piece.text.length
      else break
    } else {
      // A quebra conta se o começo dela estiver antes do ponto da seleção.
      if (point.comparePoint(piece.node, 0) < 0) count = piece.start + 1
      else break
    }
  }
  return count
}

/** Posição da seleção contada em letras visíveis, ou null se estiver fora do editor. */
export function getVisibleSelection(el: HTMLElement): { from: number; to: number } | null {
  const selection = el.ownerDocument.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null
  const pieces = linearize(el)
  return {
    from: offsetOf(el, pieces, range.startContainer, range.startOffset),
    to: offsetOf(el, pieces, range.endContainer, range.endOffset),
  }
}

function pointAt(el: HTMLElement, pieces: Piece[], target: number): [Node, number] {
  let lastPoint: [Node, number] = [el, 0]
  for (const piece of pieces) {
    if (piece.kind === "text") {
      if (target <= piece.start + piece.text.length) return [piece.node, Math.max(0, target - piece.start)]
      lastPoint = [piece.node, piece.text.length]
    } else {
      const parent = piece.node.parentNode ?? el
      const index = Array.prototype.indexOf.call(parent.childNodes, piece.node) as number
      if (target <= piece.start) return [parent, index]
      lastPoint = [parent, index + 1]
    }
  }
  return lastPoint
}

/** Coloca a seleção nas letras visíveis de from até to. */
export function setVisibleSelection(el: HTMLElement, from: number, to: number): void {
  const doc = el.ownerDocument
  const pieces = linearize(el)
  const [startNode, startOffset] = pointAt(el, pieces, Math.min(from, to))
  const [endNode, endOffset] = pointAt(el, pieces, Math.max(from, to))
  const range = doc.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const selection = doc.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}
