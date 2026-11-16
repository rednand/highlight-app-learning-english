"use client"

import { useEffect, useRef, useState } from "react"
import { Eraser } from "lucide-react"
import { toast } from "sonner"
import {
  NOTE_COLORS, paintSegments, parseNote, replaceInSegments, serializeSegments, type NoteColor, type NoteSegment,
} from "../../app/lib/note-format"
import { getVisibleSelection, hasElementBreaks, readNoteFrom, renderNoteInto, setVisibleSelection } from "../../app/lib/note-dom"
import { NOTE_COLOR_STYLES } from "./colored-text"

type Props = {
  initial: string
  placeholder: string
  onChange: (markup: string) => void
  onSubmit: () => void
  onCancel: () => void
}

const classFor = (color: NoteColor) => NOTE_COLOR_STYLES[color].text

/**
 * Editor que pinta direto: a pessoa seleciona um trecho e toca na cor.
 * O texto continua salvo no formato curto ("[verde]…[/verde]").
 */
export default function RichNoteEditor({ initial, placeholder, onChange, onSubmit, onCancel }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastSelection = useRef<{ from: number; to: number } | null>(null)
  const [empty, setEmpty] = useState(() => parseNote(initial).length === 0)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const segments = parseNote(initial)
    renderNoteInto(el, segments, classFor)
    el.focus()
    const length = segments.reduce((sum, s) => sum + s.text.length, 0)
    setVisibleSelection(el, length, length)

    function remember() {
      if (!el) return
      const selection = getVisibleSelection(el)
      if (selection) lastSelection.current = selection
    }
    document.addEventListener("selectionchange", remember)
    return () => document.removeEventListener("selectionchange", remember)
    // O conteúdo inicial só é desenhado uma vez; depois o editor é dono do texto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commit(segments: NoteSegment[]) {
    setEmpty(segments.length === 0)
    onChange(serializeSegments(segments))
  }

  /** Redesenha o editor com os trechos e põe a seleção de volta. */
  function redraw(segments: NoteSegment[], from: number, to: number) {
    const el = editorRef.current
    if (!el) return
    renderNoteInto(el, segments, classFor)
    el.focus()
    setVisibleSelection(el, from, to)
    commit(segments)
  }

  function handleInput() {
    const el = editorRef.current
    if (!el) return
    lastSelection.current = null
    // Alguns teclados (Android, Safari) quebram linha criando <br>/<div>: volta ao formato simples.
    if (hasElementBreaks(el)) {
      const selection = getVisibleSelection(el)
      const segments = readNoteFrom(el)
      const caret = selection?.to ?? segments.reduce((sum, s) => sum + s.text.length, 0)
      redraw(segments, selection?.from ?? caret, caret)
      return
    }
    commit(readNoteFrom(el))
  }

  function insertText(text: string) {
    const el = editorRef.current
    if (!el) return
    const selection = getVisibleSelection(el)
    const length = readNoteFrom(el).reduce((sum, s) => sum + s.text.length, 0)
    const from = selection?.from ?? length
    const to = selection?.to ?? length
    const result = replaceInSegments(readNoteFrom(el), from, to, text)
    redraw(result.segments, result.caret, result.caret)
  }

  function paint(color: NoteColor | null) {
    const el = editorRef.current
    if (!el) return
    const selection = getVisibleSelection(el) ?? lastSelection.current
    if (!selection || selection.from === selection.to) {
      toast("Selecione um trecho do texto e depois toque na cor")
      el.focus()
      return
    }
    const from = Math.min(selection.from, selection.to)
    const to = Math.max(selection.from, selection.to)
    redraw(paintSegments(readNoteFrom(el), from, to, color), from, to)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap" role="toolbar" aria-label="Cor do trecho selecionado">
        <span className="text-[11px] text-fg-dim mr-1">Cor:</span>
        {NOTE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => paint(color)}
            title={NOTE_COLOR_STYLES[color].label}
            aria-label={`Pintar trecho de ${NOTE_COLOR_STYLES[color].label.toLowerCase()}`}
            className={`w-7 h-7 rounded-full border-2 border-line hover:border-fg-muted transition-colors ${NOTE_COLOR_STYLES[color].swatch}`}
          />
        ))}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => paint(null)}
          title="Tirar a cor"
          aria-label="Tirar a cor do trecho selecionado"
          className="w-7 h-7 rounded-full border-2 border-line hover:border-fg-muted flex items-center justify-center text-fg-muted transition-colors"
        >
          <Eraser size={13} />
        </button>
      </div>

      <div className="relative">
        {empty && (
          <p className="absolute inset-0 px-4 py-3 text-sm text-fg-faint pointer-events-none select-none">{placeholder}</p>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Anotação"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onInput={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              onSubmit()
              return
            }
            if (e.key === "Enter") {
              e.preventDefault()
              insertText("\n")
              return
            }
            if (e.key === "Escape") onCancel()
          }}
          onPaste={(e) => {
            e.preventDefault()
            insertText(e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n"))
          }}
          onDrop={(e) => e.preventDefault()}
          className="w-full min-h-24 max-h-96 overflow-y-auto bg-page border border-line rounded-xl px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap break-words outline-none focus:border-brand/50 transition-colors"
        />
      </div>
    </div>
  )
}
