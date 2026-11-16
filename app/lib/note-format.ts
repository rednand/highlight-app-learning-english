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

/** Posição no texto bruto → posição no texto visível. Dentro de uma marcação, encosta no conteúdo. */
function toVisible(runs: Run[], raw: number): number {
  let visible = 0
  for (const run of runs) {
    if (raw <= run.rawStart) return visible
    const length = run.contentEnd - run.contentStart
    if (raw < run.rawEnd) return visible + Math.min(Math.max(raw - run.contentStart, 0), length)
    visible += length
  }
  return visible
}

/**
 * Aplica (ou tira, com color = null) uma cor no trecho selecionado. A seleção
 * vem em posições do texto bruto, mas a cor vale para as letras que aparecem
 * na tela: pintar de novo troca a cor, a borracha funciona selecionando só a
 * palavra, e seleções que pegam metade de um trecho colorido não quebram nada.
 * Devolve o novo texto e a seleção em cima das mesmas letras.
 */
export function applyNoteColor(
  text: string,
  start: number,
  end: number,
  color: NoteColor | null,
): { text: string; selectionStart: number; selectionEnd: number } {
  const runs = runsOf(text)
  const from = toVisible(runs, Math.max(0, Math.min(start, end)))
  const to = toVisible(runs, Math.min(text.length, Math.max(start, end)))

  const chars: { ch: string; color: NoteColor | null }[] = []
  for (const run of runs) {
    for (let i = run.contentStart; i < run.contentEnd; i++) chars.push({ ch: text[i], color: run.color })
  }
  for (let i = from; i < to; i++) chars[i].color = color

  let out = ""
  let selectionStart = -1
  let selectionEnd = -1
  let i = 0
  while (i < chars.length) {
    const runColor = chars[i].color
    let j = i
    while (j < chars.length && chars[j].color === runColor) j++
    if (runColor) out += `[${runColor}]`
    for (let k = i; k < j; k++) {
      if (k === from) selectionStart = out.length
      out += chars[k].ch
      if (k === to - 1) selectionEnd = out.length
    }
    if (runColor) out += `[/${runColor}]`
    i = j
  }
  if (selectionStart < 0) selectionStart = out.length
  if (selectionEnd < 0) selectionEnd = selectionStart
  return { text: out, selectionStart, selectionEnd }
}
