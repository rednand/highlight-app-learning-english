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
const ANY_TAG = new RegExp(`\\[\\/?(?:${COLOR_GROUP})\\]`, "g")

export function isNoteColor(value: string): value is NoteColor {
  return (NOTE_COLORS as readonly string[]).includes(value)
}

/** Divide o texto em trechos simples e trechos coloridos. */
export function parseNote(text: string): NoteSegment[] {
  const segments: NoteSegment[] = []
  let last = 0
  for (const match of text.matchAll(MARKUP)) {
    const start = match.index ?? 0
    if (start > last) segments.push({ text: text.slice(last, start), color: null })
    const color = match[1]
    if (match[2] && isNoteColor(color)) segments.push({ text: match[2], color })
    last = start + match[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last), color: null })
  return segments
}

/** Texto sem nenhuma marcação de cor (para resumos e contagem). */
export function stripNoteColors(text: string): string {
  return text.replace(ANY_TAG, "")
}

export function hasNoteColors(text: string): boolean {
  return parseNote(text).some((segment) => segment.color !== null)
}

/**
 * Aplica (ou tira, com color = null) uma cor no trecho [start, end) do texto.
 * Marcações que já estavam dentro do trecho são removidas antes, então pintar
 * de novo troca a cor em vez de aninhar. Devolve o novo texto e a seleção
 * ajustada para continuar em cima do mesmo trecho.
 */
export function applyNoteColor(
  text: string,
  start: number,
  end: number,
  color: NoteColor | null,
): { text: string; selectionStart: number; selectionEnd: number } {
  const from = Math.max(0, Math.min(start, end, text.length))
  const to = Math.min(text.length, Math.max(start, end))
  const selected = stripNoteColors(text.slice(from, to))

  if (color === null) {
    return {
      text: text.slice(0, from) + selected + text.slice(to),
      selectionStart: from,
      selectionEnd: from + selected.length,
    }
  }

  const open = `[${color}]`
  const wrapped = `${open}${selected}[/${color}]`
  return {
    text: text.slice(0, from) + wrapped + text.slice(to),
    selectionStart: from + open.length,
    selectionEnd: from + open.length + selected.length,
  }
}
