import { isNoteColor, normalizeSegments, type NoteColor, type NoteSegment } from "./note-format"

/**
 * Ponte entre o editor visual (um elemento contentEditable) e os trechos da
 * anotação. Os trechos coloridos viram <span data-note-color="verde">; o
 * texto é sempre colocado com textContent, nunca como HTML.
 */

export const COLOR_ATTR = "data-note-color"

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
}

const BLOCK_TAGS = new Set(["DIV", "P", "LI"])

/** Lê o que está no editor e devolve os trechos (com quebras de linha como "\n"). */
export function readNoteFrom(el: HTMLElement): NoteSegment[] {
  const out: NoteSegment[] = []
  const walk = (node: Node, color: NoteColor | null) => {
    node.childNodes.forEach((child, index) => {
      if (child.nodeType === 3) {
        out.push({ text: child.textContent ?? "", color })
        return
      }
      if (child.nodeType !== 1) return
      const element = child as HTMLElement
      if (element.tagName === "BR") {
        out.push({ text: "\n", color: null })
        return
      }
      const attr = element.getAttribute(COLOR_ATTR)
      const childColor = attr === "" ? null : attr && isNoteColor(attr) ? attr : color
      const isBlock = BLOCK_TAGS.has(element.tagName)
      if (isBlock && index > 0) out.push({ text: "\n", color: null })
      walk(element, childColor)
    })
  }
  walk(el, null)
  const segments = normalizeSegments(out)
  // Navegadores deixam um <br> sobrando no fim do editor; não vira texto.
  const last = segments[segments.length - 1]
  if (last && last.color === null && last.text.endsWith("\n") && el.lastChild?.nodeName === "BR") {
    last.text = last.text.slice(0, -1)
  }
  return normalizeSegments(segments)
}

/** Posição da seleção contada em letras visíveis, ou null se estiver fora do editor. */
export function getVisibleSelection(el: HTMLElement): { from: number; to: number } | null {
  const selection = el.ownerDocument.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null
  const offsetOf = (container: Node, offset: number) => {
    const probe = el.ownerDocument.createRange()
    probe.selectNodeContents(el)
    probe.setEnd(container, offset)
    return probe.toString().length
  }
  return { from: offsetOf(range.startContainer, range.startOffset), to: offsetOf(range.endContainer, range.endOffset) }
}

/** Coloca a seleção nas letras visíveis de from até to. */
export function setVisibleSelection(el: HTMLElement, from: number, to: number): void {
  const doc = el.ownerDocument
  const walker = doc.createTreeWalker(el, 4)
  const locate = (target: number): [Node, number] => {
    let remaining = target
    let node = walker.nextNode()
    let last: Node | null = null
    while (node) {
      const length = node.textContent?.length ?? 0
      if (remaining <= length) return [node, remaining]
      remaining -= length
      last = node
      node = walker.nextNode()
    }
    return last ? [last, last.textContent?.length ?? 0] : [el, 0]
  }
  walker.currentNode = el
  const [startNode, startOffset] = locate(from)
  walker.currentNode = el
  const [endNode, endOffset] = locate(to)
  const range = doc.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  const selection = doc.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}
