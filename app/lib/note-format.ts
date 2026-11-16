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
  contentStart: number
  contentEnd: number
}

function runsOf(text: string): Run[] {
  const runs: Run[] = []
  let last = 0
  for (const match of text.matchAll(MARKUP)) {
    const start = match.index ?? 0
    if (start > last) runs.push({ color: null, contentStart: last, contentEnd: start })
    const openLength = match[1].length + 2
    runs.push({
      color: match[1] as NoteColor,
      contentStart: start + openLength,
      contentEnd: start + openLength + match[2].length,
    })
    last = start + match[0].length
  }
  if (last < text.length) runs.push({ color: null, contentStart: last, contentEnd: text.length })
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

// Caractere invisível colocado dentro de "[verde]" digitado pela pessoa, para
// que texto parecido com a marcação não vire cor sem querer.
const WORD_JOINER = "\u2060"
const TYPED_TAG = new RegExp(`\\[(?=\\/?(?:${COLOR_GROUP})\\])`, "g")

function protectTypedTags(text: string): string {
  return text.replace(TYPED_TAG, `[${WORD_JOINER}`)
}

/** Escreve os trechos no formato salvo ("[verde]…[/verde]"). */
export function serializeSegments(segments: NoteSegment[]): string {
  return normalizeSegments(segments)
    .map((segment) => {
      const text = protectTypedTags(segment.text)
      return segment.color ? `[${segment.color}]${text}[/${segment.color}]` : text
    })
    .join("")
}

/**
 * Troca as letras visíveis de from até to por um texto (digitado ou colado).
 * O texto novo fica com a cor da letra logo antes, como acontece ao digitar.
 */
export function replaceInSegments(
  segments: NoteSegment[],
  from: number,
  to: number,
  text: string,
): { segments: NoteSegment[]; caret: number } {
  const start = Math.max(0, Math.min(from, to))
  const end = Math.max(from, to)
  let pos = 0
  let colorBefore: NoteColor | null = null
  const before: NoteSegment[] = []
  const after: NoteSegment[] = []
  for (const segment of segments) {
    const segStart = pos
    const segEnd = pos + segment.text.length
    pos = segEnd
    if (segStart < start) {
      before.push({ text: segment.text.slice(0, start - segStart), color: segment.color })
      colorBefore = segment.color
    }
    if (segEnd > end) after.push({ text: segment.text.slice(Math.max(0, end - segStart)), color: segment.color })
  }
  const inserted: NoteSegment = { text, color: text === "\n" ? null : colorBefore }
  return { segments: normalizeSegments([...before, inserted, ...after]), caret: start + text.length }
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
