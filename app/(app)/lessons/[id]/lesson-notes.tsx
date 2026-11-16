"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Pencil, Trash2, Plus, StickyNote, ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { addLessonNote, updateLessonNote, deleteLessonNote } from "../../../actions/notes"
import { addNoteImage, removeNoteImage } from "../../../actions/note-images"
import { stripNoteColors } from "../../../lib/note-format"
import { MAX_IMAGES_PER_NOTE, MAX_IMAGE_BYTES, isAllowedImageType } from "../../../lib/note-images"
import ColoredText from "../../../../components/notes/colored-text"
import RichNoteEditor from "../../../../components/notes/rich-note-editor"
import NoteImages, { type NoteImage } from "../../../../components/notes/note-images"
import { compressImage } from "../../../../components/notes/compress-image"

export type LessonNote = {
  id: string
  content: string
  created_at: string
  updated_at: string | null
  images: { path: string; url: string }[]
}

type PendingImage = { key: string; file: File; url: string }

/** Envia as imagens de uma anotação, uma por vez; devolve quantas falharam. */
async function uploadImages(noteId: string, lessonId: string, files: File[]): Promise<number> {
  let failed = 0
  for (const file of files) {
    const fd = new FormData()
    fd.append("noteId", noteId)
    fd.append("lessonId", lessonId)
    fd.append("file", file)
    try {
      await addNoteImage(fd)
    } catch {
      failed++
    }
  }
  if (failed > 0) toast.error(failed === 1 ? "Uma imagem não foi enviada" : `${failed} imagens não foram enviadas`)
  return failed
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
  existingImages = [],
  removingImage = null,
  onRemoveExisting,
  onSubmit,
  onCancel,
}: {
  initial?: string
  placeholder: string
  submitLabel: string
  existingImages?: NoteImage[]
  removingImage?: string | null
  onRemoveExisting?: (key: string) => void
  onSubmit: (text: string, files: File[]) => Promise<void>
  onCancel: () => void
}) {
  const [text, setText] = useState(initial)
  const [pending, setPending] = useState<PendingImage[]>([])
  const [preparing, setPreparing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInput = useRef<HTMLInputElement>(null)
  const pendingRef = useRef(pending)

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])
  // Libera as prévias locais quando o editor fecha.
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  const slots = MAX_IMAGES_PER_NOTE - existingImages.length - pending.length
  const canSave = stripNoteColors(text).trim().length > 0 || pending.length > 0 || existingImages.length > 0

  async function pick(files: FileList | null) {
    if (!files || files.length === 0) return
    const chosen = Array.from(files).slice(0, Math.max(0, slots))
    if (files.length > chosen.length) toast(`Cada anotação pode ter até ${MAX_IMAGES_PER_NOTE} imagens`)
    setPreparing(true)
    const ready: PendingImage[] = []
    for (const file of chosen) {
      try {
        const compressed = await compressImage(file)
        if (!isAllowedImageType(compressed.type) || compressed.size > MAX_IMAGE_BYTES) throw new Error()
        ready.push({ key: crypto.randomUUID(), file: compressed, url: URL.createObjectURL(compressed) })
      } catch {
        toast.error(`Não foi possível usar "${file.name}"`)
      }
    }
    setPending((prev) => [...prev, ...ready])
    setPreparing(false)
    if (fileInput.current) fileInput.current.value = ""
  }

  function dropPending(key: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.key === key)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter((p) => p.key !== key)
    })
  }

  function submit() {
    if (isPending || preparing || !canSave) return
    startTransition(async () => {
      try {
        await onSubmit(text, pending.map((p) => p.file))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível salvar a anotação")
      }
    })
  }

  return (
    <div className="space-y-3">
      <RichNoteEditor
        initial={initial}
        placeholder={placeholder}
        onChange={setText}
        onSubmit={submit}
        onCancel={onCancel}
      />

      <NoteImages
        images={[...existingImages, ...pending.map((p) => ({ key: p.key, url: p.url }))]}
        removing={removingImage}
        onRemove={(key) => (pending.some((p) => p.key === key) ? dropPending(key) : onRemoveExisting?.(key))}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => pick(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={slots <= 0 || preparing || isPending}
            className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-white disabled:opacity-40 transition-colors"
          >
            <ImagePlus size={15} />
            {preparing ? "Preparando…" : "Imagem"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="text-xs text-fg-dim hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || preparing || !canSave}
            className="bg-brand hover:bg-brand-strong disabled:opacity-40 text-black text-xs font-bold px-4 py-2 rounded-full transition-colors"
          >
            {isPending ? (pending.length > 0 ? "Enviando…" : "Salvando…") : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function NoteCard({ note, lessonId }: { note: LessonNote; lessonId: string }) {
  const [editing, setEditing] = useState(false)
  const [isDeleting, startDelete] = useTransition()
  const [removingImage, setRemovingImage] = useState<string | null>(null)
  const images: NoteImage[] = note.images.map((image) => ({ key: image.path, url: image.url }))

  async function removeImage(path: string) {
    setRemovingImage(path)
    try {
      await removeNoteImage(note.id, lessonId, path)
    } catch {
      toast.error("Não foi possível tirar a imagem")
    } finally {
      setRemovingImage(null)
    }
  }
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
          existingImages={images}
          removingImage={removingImage}
          onRemoveExisting={removeImage}
          onSubmit={async (text, files) => {
            await updateLessonNote(note.id, lessonId, text)
            await uploadImages(note.id, lessonId, files)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className={`p-4 bg-surface border border-line rounded-[18px] ${isDeleting ? "opacity-50" : ""}`}>
      {stripNoteColors(note.content).trim() && (
        <p className="text-fg-soft text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">
          <ColoredText text={note.content} />
        </p>
      )}
      <NoteImages images={images} />
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
            onSubmit={async (text, files) => {
              const hasText = stripNoteColors(text).trim().length > 0
              const { id } = await addLessonNote(lessonId, text, files.length > 0)
              const failed = await uploadImages(id, lessonId, files)
              // Anotação só de imagens em que nenhuma subiu: não deixa uma anotação vazia.
              if (!hasText && files.length > 0 && failed === files.length) await deleteLessonNote(id, lessonId)
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
