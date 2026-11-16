"use client"

import { useState, useTransition } from "react"
import { Pencil, Trash2, Plus, StickyNote } from "lucide-react"
import { toast } from "sonner"
import { addLessonNote, updateLessonNote, deleteLessonNote } from "../../../actions/notes"
import { stripNoteColors } from "../../../lib/note-format"
import ColoredText from "../../../../components/notes/colored-text"
import RichNoteEditor from "../../../../components/notes/rich-note-editor"

export type LessonNote = {
  id: string
  content: string
  created_at: string
  updated_at: string | null
}

// Fuso fixo para o servidor e o navegador escreverem a mesma coisa.
const TIME_ZONE = "America/Sao_Paulo"

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE })
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })
  if (dayKey(date) === dayKey(new Date())) return `Hoje, ${time}`
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: TIME_ZONE })}, ${time}`
}

function NoteEditor({
  initial = "",
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: string
  placeholder: string
  submitLabel: string
  onSubmit: (text: string) => Promise<void>
  onCancel: () => void
}) {
  const [text, setText] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const canSave = stripNoteColors(text).trim().length > 0

  function submit() {
    if (isPending || !canSave) return
    startTransition(async () => {
      try {
        await onSubmit(text)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível salvar a anotação")
      }
    })
  }

  return (
    <div className="space-y-2">
      <RichNoteEditor
        initial={initial}
        placeholder={placeholder}
        onChange={setText}
        onSubmit={submit}
        onCancel={onCancel}
      />
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="text-xs text-fg-dim hover:text-white transition-colors">
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !canSave}
          className="bg-brand hover:bg-brand-strong disabled:opacity-40 text-black text-xs font-bold px-4 py-2 rounded-full transition-colors"
        >
          {isPending ? "Salvando…" : submitLabel}
        </button>
      </div>
    </div>
  )
}

function NoteCard({ note, lessonId }: { note: LessonNote; lessonId: string }) {
  const [editing, setEditing] = useState(false)
  const [isDeleting, startDelete] = useTransition()
  const edited = note.updated_at && new Date(note.updated_at).getTime() - new Date(note.created_at).getTime() > 60_000

  function handleDelete() {
    toast("Apagar esta anotação?", {
      action: {
        label: "Apagar",
        onClick: () =>
          startDelete(async () => {
            try {
              await deleteLessonNote(note.id, lessonId)
            } catch {
              toast.error("Não foi possível apagar a anotação")
            }
          }),
      },
    })
  }

  if (editing) {
    return (
      <div className="p-4 bg-surface border border-line rounded-[18px]">
        <NoteEditor
          initial={note.content}
          placeholder="Escreva sua anotação"
          submitLabel="Salvar"
          onSubmit={async (text) => {
            await updateLessonNote(note.id, lessonId, text)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className={`p-4 bg-surface border border-line rounded-[18px] ${isDeleting ? "opacity-50" : ""}`}>
      <p className="text-fg-soft text-sm leading-relaxed whitespace-pre-wrap break-words">
        <ColoredText text={note.content} />
      </p>
      <div className="flex items-center justify-between gap-3 mt-3">
        <span className="text-[11px] text-fg-dim" suppressHydrationWarning>
          {formatWhen(note.created_at)}
          {edited ? " · editada" : ""}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(true)} title="Editar anotação" className="text-fg-dim hover:text-white transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={handleDelete} disabled={isDeleting} title="Apagar anotação" className="text-fg-dim hover:text-red-400 disabled:opacity-40 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LessonNotes({ lessonId, notes }: { lessonId: string; notes: LessonNote[] }) {
  const [adding, setAdding] = useState(false)

  return (
    <section className="border-t border-white/5 pt-8 mb-8">
      <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-fg-subtle uppercase mb-4">
        <StickyNote size={13} className="text-fg-faint" />
        Anotações
        {notes.length > 0 && (
          <span className="text-fg-dim font-normal tracking-normal normal-case">({notes.length})</span>
        )}
      </h2>

      {notes.length > 0 && (
        <div className="space-y-2 mb-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} lessonId={lessonId} />
          ))}
        </div>
      )}

      {adding ? (
        <div className="p-4 bg-surface border border-line rounded-[18px]">
          <NoteEditor
            placeholder="O que você quer lembrar desta aula? Selecione um trecho e toque numa cor para pintar."
            submitLabel="Adicionar"
            onSubmit={async (text) => {
              await addLessonNote(lessonId, text)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 w-full py-3 border border-dashed border-white/10 hover:border-brand/30 text-fg-dim hover:text-brand text-sm rounded-xl transition-colors justify-center"
        >
          {notes.length === 0 ? <StickyNote size={15} /> : <Plus size={15} />}
          {notes.length === 0 ? "Adicionar anotação" : "Nova anotação"}
        </button>
      )}
    </section>
  )
}
