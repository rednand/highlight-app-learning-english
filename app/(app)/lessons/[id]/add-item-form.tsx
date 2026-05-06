"use client"

import { useRef, useState, useTransition } from "react"
import { Plus, X, Wand2, Mic, MicOff } from "lucide-react"
import { addLessonItem } from "../../../actions/items"
import { fetchExampleSentence } from "../../../actions/examples"

export default function AddItemForm({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState("")
  const [translation, setTranslation] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [context, setContext] = useState("")
  const [isFetchingExample, setIsFetchingExample] = useState(false)
  const [exampleError, setExampleError] = useState(false)
  const [phonetic, setPhonetic] = useState("")
  const [mySentence, setMySentence] = useState("")
  const [isListening, setIsListening] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function toggleListening() {
    type SREvent = { results: { 0: { 0: { transcript: string } } } }
    type SRConstructor = new () => { lang: string; interimResults: boolean; maxAlternatives: number; onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null; onresult: ((e: SREvent) => void) | null; start: () => void }
    const w = window as typeof window & { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor }
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SR()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript
      setTerm(spoken)
    }

    recognition.start()
  }

  async function suggestTranslation() {
    if (!term.trim()) return
    setTranslation("")
    setIsSuggesting(true)
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=en|pt`
      )
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    setError(null)
    startTransition(async () => {
      try {
        await addLessonItem(fd)
        formRef.current?.reset()
        setTerm("")
        setTranslation("")
        setContext("")
        setPhonetic("")
        setMySentence("")
        setExampleError(false)
        setOpen(false)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao salvar")
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full py-3 border border-dashed border-white/10 hover:border-yellow-400/30 text-gray-600 hover:text-yellow-400 text-sm rounded-xl transition-colors justify-center"
      >
        <Plus size={15} />
        Adicionar palavra ou expressão
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Adicionar</span>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
            setTerm("")
            setTranslation("")
            setContext("")
            setPhonetic("")
            setMySentence("")
            setExampleError(false)
          }}
          className="text-gray-600 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <input type="hidden" name="lesson_id" value={lessonId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            name="term"
            required
            placeholder="Palavra / expressão"
            value={term}
            onChange={e => setTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors"
          />
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Parar gravação" : "Falar palavra"}
            className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-30 ${
              isListening ? "text-red-400 animate-pulse" : "text-gray-500 hover:text-yellow-400"
            }`}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
        </div>
        <div className="relative">
          <input
            name="translation"
            placeholder="Tradução"
            value={translation}
            onChange={e => setTranslation(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors"
          />
          <button
            type="button"
            onClick={suggestTranslation}
            disabled={isSuggesting || !term.trim()}
            title="Sugerir tradução"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400 disabled:opacity-30 transition-colors"
          >
            <Wand2 size={14} className={isSuggesting ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          name="type"
          defaultValue="word"
          className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-yellow-400/50 transition-colors"
        >
          <option value="word">Palavra</option>
          <option value="expression">Expressão</option>
          <option value="phrase">Frase</option>
        </select>
        <div className="relative">
          <input
            name="context"
            placeholder="Exemplo de uso"
            value={context}
            onChange={e => setContext(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors"
          />
          <button
            type="button"
            onClick={fetchExample}
            disabled={isFetchingExample || !term.trim()}
            title="Buscar exemplo de uso"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400 disabled:opacity-30 transition-colors"
          >
            <Wand2 size={14} className={isFetchingExample ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      <input type="hidden" name="phonetic" value={phonetic} />

      {phonetic && (
        <p className="text-xs font-mono text-gray-500">{phonetic}</p>
      )}
      {exampleError && (
        <p className="text-xs text-gray-500">Nenhum exemplo encontrado para &ldquo;{term}&rdquo;. Digite manualmente.</p>
      )}

      <textarea
        name="my_sentence"
        rows={2}
        placeholder="Minha frase (opcional) — escreva uma frase sua usando essa palavra"
        value={mySentence}
        onChange={e => setMySentence(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors resize-none"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-sm font-bold py-2.5 rounded-full transition-colors"
      >
        {isPending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  )
}
