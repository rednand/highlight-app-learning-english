"use client"

import { useState, useTransition } from "react"
import { Pencil, X, Wand2, Trash2, EyeOff, Eye } from "lucide-react"
import { updateLessonItem, deleteLessonItem, setItemInReview } from "../../../actions/items"
import { toast } from "sonner"
import { fetchExampleSentence } from "../../../actions/examples"
import { translateTerm } from "../../../actions/translate"
import SpeakButton from "../../speak-button"

type Item = {
  id: string
  lesson_id: string
  term: string
  translation: string | null
  type: string
  context: string | null
  phonetic: string | null
  my_sentence: string | null
}

const TYPE_LABEL: Record<string, string> = {
  word: "Palavra",
  expression: "Expressão",
  phrase: "Frase",
}

const TYPE_COLOR: Record<string, string> = {
  word: "text-brand bg-brand/10",
  expression: "text-orange-400 bg-orange-400/10",
  phrase: "text-sky-300 bg-sky-300/10",
}

export default function ItemCard({ item, reviewState = "active" }: { item: Item; reviewState?: "active" | "discarded" | "none" }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState(item.term)
  const [translation, setTranslation] = useState(item.translation ?? "")
  const [context, setContext] = useState(item.context ?? "")
  const [phonetic, setPhonetic] = useState(item.phonetic ?? "")
  const [mySentence, setMySentence] = useState(item.my_sentence ?? "")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isFetchingExample, setIsFetchingExample] = useState(false)
  const [translationError, setTranslationError] = useState(false)
  const [exampleError, setExampleError] = useState(false)
  const discarded = reviewState === "discarded"

  function toggleReview() {
    startTransition(async () => {
      try {
        await setItemInReview(item.id, item.lesson_id, discarded)
        toast(discarded ? "Palavra de volta na revisão" : "Palavra fora da revisão")
      } catch {
        toast.error("Não foi possível alterar a revisão")
      }
    })
  }

  async function suggestTranslation() {
    if (!term.trim()) return
    setTranslation("")
    setTranslationError(false)
    setIsSuggesting(true)
    try {
      const suggested = await translateTerm(term)
      if (suggested) setTranslation(suggested)
      else setTranslationError(true)
    } catch {
      setTranslationError(true)
    } finally {
      setIsSuggesting(false)
    }
  }

  async function fetchExample() {
    if (!term.trim()) return
    setContext("")
    setExampleError(false)
    setIsFetchingExample(true)
    try {
      const { example, phonetic: ipa } = await fetchExampleSentence(term)
      if (example) setContext(example)
      else setExampleError(true)
      if (ipa) setPhonetic(ipa)
    } finally {
      setIsFetchingExample(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateLessonItem(fd)
      setEditing(false)
    })
  }

  function handleDelete() {
    startTransition(() => deleteLessonItem(item.id, item.lesson_id))
  }

  const inputClass = "w-full bg-page border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-fg-faint outline-none focus:border-brand/50 transition-colors"

  if (editing) {
    return (
      <div className="p-4 bg-sunken border border-brand/20 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="lesson_id" value={item.lesson_id} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="term" required value={term} onChange={e => setTerm(e.target.value)} placeholder="Palavra / expressão" className={inputClass} />
            <div className="relative">
              <input name="translation" value={translation} onChange={e => setTranslation(e.target.value)} placeholder="Tradução" className={`${inputClass} pr-9`} />
              <button type="button" onClick={suggestTranslation} disabled={isSuggesting || !term.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-brand disabled:opacity-30 transition-colors">
                <Wand2 size={14} className={isSuggesting ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select name="type" defaultValue={item.type} className="w-full bg-page border border-white/10 rounded-lg px-3 py-2.5 text-sm text-fg-soft outline-none focus:border-brand/50 transition-colors">
              <option value="word">Palavra</option>
              <option value="expression">Expressão</option>
              <option value="phrase">Frase</option>
            </select>
            <div className="relative">
              <input name="context" value={context} onChange={e => setContext(e.target.value)} placeholder="Exemplo de uso" className={`${inputClass} pr-9`} />
              <button type="button" onClick={fetchExample} disabled={isFetchingExample || !term.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-brand disabled:opacity-30 transition-colors">
                <Wand2 size={14} className={isFetchingExample ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>

          <input type="hidden" name="phonetic" value={phonetic} />
          {phonetic && <p className="text-xs font-mono text-fg-subtle">{phonetic}</p>}
          {translationError && (
            <p className="text-xs text-fg-subtle">
              Nenhuma tradução encontrada para &ldquo;{term}&rdquo;. Digite manualmente.
            </p>
          )}
          {exampleError && (
            <p className="text-xs text-fg-subtle">
              Nenhum exemplo encontrado para &ldquo;{term}&rdquo;. Digite manualmente.
            </p>
          )}

          <textarea
            name="my_sentence"
            rows={2}
            placeholder="Minha frase (opcional)"
            value={mySentence}
            onChange={e => setMySentence(e.target.value)}
            className={`${inputClass} resize-none`}
          />

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-fg-dim hover:text-white transition-colors flex items-center gap-1">
              <X size={12} /> Cancelar
            </button>
            <button type="submit" disabled={isPending} className="bg-brand hover:bg-brand-strong disabled:opacity-50 text-black text-xs font-bold px-4 py-2 rounded-full transition-colors">
              {isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-4 p-4 bg-surface border border-line rounded-[18px] ${discarded ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-medium text-sm">{item.term}</p>
          <SpeakButton text={item.term} />
          {discarded && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-fg-muted bg-white/5">Fora da revisão</span>
          )}
        </div>
        {item.phonetic && <p className="text-fg-muted text-xs font-mono mt-0.5">{item.phonetic}</p>}
        {item.translation && <p className="text-fg-soft text-xs mt-0.5">{item.translation}</p>}
        {item.context && <p className="text-fg-muted text-xs mt-1.5 italic">&ldquo;{item.context}&rdquo;</p>}
        {item.my_sentence && (
          <p className="text-brand-strong/70 text-xs mt-1.5 italic">&ldquo;{item.my_sentence}&rdquo; <span className="not-italic text-fg-dim">— minha frase</span></p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${TYPE_COLOR[item.type] ?? TYPE_COLOR.word}`}>
          {TYPE_LABEL[item.type] ?? item.type}
        </span>
        {reviewState !== "none" && (
          <button
            onClick={toggleReview}
            disabled={isPending}
            title={discarded ? "Voltar para a revisão" : "Tirar da revisão"}
            className="text-fg-dim hover:text-white disabled:opacity-40 transition-colors"
          >
            {discarded ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        )}
        <button onClick={() => setEditing(true)} title="Editar" className="text-fg-dim hover:text-white transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={handleDelete} disabled={isPending} title="Excluir" className="text-fg-dim hover:text-red-400 disabled:opacity-40 transition-colors">
          <Trash2 size={13} className={isPending ? "animate-pulse" : ""} />
        </button>
      </div>
    </div>
  )
}
