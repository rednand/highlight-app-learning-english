"use client"

import { useState, useTransition } from "react"
import { Pencil, X, Wand2, Trash2 } from "lucide-react"
import { updateLessonItem, deleteLessonItem } from "../../../actions/items"
import { fetchExampleSentence } from "../../../actions/examples"
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
  word: "text-yellow-400 bg-yellow-400/10",
  expression: "text-orange-400 bg-orange-400/10",
  phrase: "text-amber-300 bg-amber-300/10",
}

export default function ItemCard({ item }: { item: Item }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState(item.term)
  const [translation, setTranslation] = useState(item.translation ?? "")
  const [context, setContext] = useState(item.context ?? "")
  const [phonetic, setPhonetic] = useState(item.phonetic ?? "")
  const [mySentence, setMySentence] = useState(item.my_sentence ?? "")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isFetchingExample, setIsFetchingExample] = useState(false)

  async function suggestTranslation() {
    if (!term.trim()) return
    setTranslation("")
    setIsSuggesting(true)
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=en|pt`)
      const json = await res.json()
      const suggested = json?.responseData?.translatedText
      if (suggested) setTranslation(suggested)
    } catch {
    } finally {
      setIsSuggesting(false)
    }
  }

  async function fetchExample() {
    if (!term.trim()) return
    setContext("")
    setIsFetchingExample(true)
    try {
      const { example, phonetic: ipa } = await fetchExampleSentence(term)
      if (example) setContext(example)
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

  const inputClass = "w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors"

  if (editing) {
    return (
      <div className="p-4 bg-[#0f0f0f] border border-yellow-400/20 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="lesson_id" value={item.lesson_id} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="term" required value={term} onChange={e => setTerm(e.target.value)} placeholder="Palavra / expressão" className={inputClass} />
            <div className="relative">
              <input name="translation" value={translation} onChange={e => setTranslation(e.target.value)} placeholder="Tradução" className={`${inputClass} pr-9`} />
              <button type="button" onClick={suggestTranslation} disabled={isSuggesting || !term.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400 disabled:opacity-30 transition-colors">
                <Wand2 size={14} className={isSuggesting ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select name="type" defaultValue={item.type} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-yellow-400/50 transition-colors">
              <option value="word">Palavra</option>
              <option value="expression">Expressão</option>
              <option value="phrase">Frase</option>
            </select>
            <div className="relative">
              <input name="context" value={context} onChange={e => setContext(e.target.value)} placeholder="Exemplo de uso" className={`${inputClass} pr-9`} />
              <button type="button" onClick={fetchExample} disabled={isFetchingExample || !term.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400 disabled:opacity-30 transition-colors">
                <Wand2 size={14} className={isFetchingExample ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>

          <input type="hidden" name="phonetic" value={phonetic} />
          {phonetic && <p className="text-xs font-mono text-gray-500">{phonetic}</p>}

          <textarea
            name="my_sentence"
            rows={2}
            placeholder="Minha frase (opcional)"
            value={mySentence}
            onChange={e => setMySentence(e.target.value)}
            className={`${inputClass} resize-none`}
          />

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-600 hover:text-white transition-colors flex items-center gap-1">
              <X size={12} /> Cancelar
            </button>
            <button type="submit" disabled={isPending} className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-xs font-bold px-4 py-2 rounded-full transition-colors">
              {isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-[#0f0f0f] border border-white/5 rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium text-sm">{item.term}</p>
          <SpeakButton text={item.term} />
        </div>
        {item.phonetic && <p className="text-gray-600 text-xs font-mono mt-0.5">{item.phonetic}</p>}
        {item.translation && <p className="text-gray-500 text-xs mt-0.5">{item.translation}</p>}
        {item.context && <p className="text-gray-600 text-xs mt-1.5 italic">&ldquo;{item.context}&rdquo;</p>}
        {item.my_sentence && (
          <p className="text-amber-300/70 text-xs mt-1.5 italic">&ldquo;{item.my_sentence}&rdquo; <span className="not-italic text-gray-700">— minha frase</span></p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${TYPE_COLOR[item.type] ?? TYPE_COLOR.word}`}>
          {TYPE_LABEL[item.type] ?? item.type}
        </span>
        <button onClick={() => setEditing(true)} title="Editar" className="text-gray-700 hover:text-white transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={handleDelete} disabled={isPending} title="Excluir" className="text-gray-700 hover:text-red-400 disabled:opacity-40 transition-colors">
          <Trash2 size={13} className={isPending ? "animate-pulse" : ""} />
        </button>
      </div>
    </div>
  )
}
