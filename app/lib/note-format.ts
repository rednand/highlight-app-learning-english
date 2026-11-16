/**
 * Cores nas anotações. O texto guarda marcações curtas, por exemplo
 * "[verde]phrasal verb[/verde]", e a tela mostra só o trecho colorido.
 * Não usamos HTML: nada do que a pessoa digita vira código na página.
 */

export const NOTE_COLORS = ["amarelo", "verde", "azul", "rosa", "vermelho"] as const
export type NoteColor = (typeof NOTE_COLORS)[number]

export type NoteSegment = { text: string; color: NoteColor | null }

const COLOR_GROUP = NOTE_COLORS.join("|")
const MARKUP = new RegExp(`\\[(${COLOR_GROUP})\\]([\\s\\S]*?)\\[\\/\\1\\]`, "g")

export function isNoteColor(value: string): value is NoteColor {
  return (NOTE_COLORS as readonly string[]).includes(value)
}

/**
 * Um pedaço do texto bruto: um trecho colorido (com suas marcações) ou texto
 * simples. Marcações sem par continuam como texto simples, e aparecem na tela.
 */
type Run = {
  color: NoteColor | null
  rawStart: number
  rawEnd: number
  contentStart: number
  contentEnd: number
}

function runsOf(text: string): Run[] {
  const runs: Run[] = []
  let last = 0
  for (const match of text.matchAll(MARKUP)) {
    const start = match.index ?? 0
    if (start > last) runs.push({ color: null, rawStart: last, rawEnd: start, contentStart: last, contentEnd: start })
    const openLength = match[1].length + 2
    runs.push({
      color: match[1] as NoteColor,
      rawStart: start,
      rawEnd: start + match[0].length,
      contentStart: start + openLength,
      contentEnd: start + openLength + match[2].length,
    })
    last = start + match[0].length
  }
  if (last < text.length) runs.push({ color: null, rawStart: last, rawEnd: text.length, contentStart: last, contentEnd: text.length })
  return runs
}

/** Divide o texto em trechos simples e trechos coloridos. */
export function parseNote(text: string): NoteSegment[] {
  return runsOf(text)
    .filter((run) => run.contentEnd > run.contentStart)
    .map((run) => ({ text: text.slice(run.contentStart, run.contentEnd), color: run.color }))
}

/** O texto como aparece na tela, sem as marcações de cor. */
export function stripNoteColors(text: string): string {
  return parseNote(text).map((segment) => segment.text).join("")
}

export function hasNoteColors(segments: NoteSegment[]): boolean {
  return segments.some((segment) => segment.color !== null)
}

/** Junta trechos vizinhos da mesma cor e descarta trechos vazios. */
export function normalizeSegments(segments: NoteSegment[]): NoteSegment[] {
  const out: NoteSegment[] = []
  for (const segment of segments) {
    if (!segment.text) continue
    const last = out[out.length - 1]
    if (last && last.color === segment.color) last.text += segment.text
    else out.push({ ...segment })
  }
  return out
}

/** Escreve os trechos no formato salvo ("[verde]…[/verde]"). */
export function serializeSegments(segments: NoteSegment[]): string {
  return normalizeSegments(segments)
    .map((segment) => (segment.color ? `[${segment.color}]${segment.text}[/${segment.color}]` : segment.text))
    .join("")
}

/** Pinta (ou tira a cor, com null) as letras visíveis de from até to. */
export function paintSegments(
  segments: NoteSegment[],
  from: number,
  to: number,
  color: NoteColor | null,
): NoteSegment[] {
  const start = Math.max(0, Math.min(from, to))
  const end = Math.max(from, to)
  const out: NoteSegment[] = []
  let pos = 0
  for (const segment of segments) {
    const segStart = pos
    const segEnd = pos + segment.text.length
    pos = segEnd
    const a = Math.max(start, segStart)
    const b = Math.min(end, segEnd)
    if (a >= b) {
      out.push(segment)
      continue
    }
    out.push({ text: segment.text.slice(0, a - segStart), color: segment.color })
    out.push({ text: segment.text.slice(a - segStart, b - segStart), color })
    out.push({ text: segment.text.slice(b - segStart), color: segment.color })
  }
  return normalizeSegments(out)
}
