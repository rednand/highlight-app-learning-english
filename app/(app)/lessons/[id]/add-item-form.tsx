"use client"

import { useRef, useState, useTransition, useEffect } from "react"
import { Plus, X, Wand2, Mic, MicOff } from "lucide-react"
import { addLessonItem, addLessonItems } from "../../../actions/items"
import { fetchExampleSentence } from "../../../actions/examples"
import { translateTerm } from "../../../actions/translate"

export default function AddItemForm({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [term, setTerm] = useState("")
  const [translation, setTranslation] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [translationError, setTranslationError] = useState(false)
  const [context, setContext] = useState("")
  const [isFetchingExample, setIsFetchingExample] = useState(false)
  const [exampleError, setExampleError] = useState(false)
  const [phonetic, setPhonetic] = useState("")
  const [mySentence, setMySentence] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [bulkText, setBulkText] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function closeModal() {
    setOpen(false)
    setError(null)
    setTerm("")
    setTranslation("")
    setContext("")
    setPhonetic("")
    setMySentence("")
    setBulk(false)
    setBulkText("")
    setExampleError(false)
    setTranslationError(false)
  }

  function toggleListening() {
    type SREvent = { results: { 0: { 0: { transcript: string } } } }
    type SRConstructor = new () => { lang: string; interimResults: boolean; maxAlternatives: number; onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null; onresult: ((e: SREvent) => void) | null; start: () => void }
    const w = window as typeof window & { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor }
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return

    if (isListening) { setIsListening(false); return }

    const recognition = new SR()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => setTerm(event.results[0][0].transcript)
    recognition.start()
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    setError(null)
    startTransition(async () => {
      try {
        if (bulk) await addLessonItems(lessonId, bulkText)
        else await addLessonItem(fd)
        closeModal()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao salvar")
      }
    })
  }

  const inputClass = "w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full py-3 border border-dashed border-white/10 hover:border-yellow-400/30 text-gray-600 hover:text-yellow-400 text-sm rounded-xl transition-colors justify-center"
      >
        <Plus size={15} />
        Adicionar palavra ou expressão
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Adicionar palavra</h2>
              <button type="button" onClick={closeModal} className="text-gray-600 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <input type="hidden" name="lesson_id" value={lessonId} />

            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0a0a0a] border border-white/10 rounded-full">
              <button
                type="button"
                onClick={() => setBulk(false)}
                className={`text-xs font-bold py-1.5 rounded-full transition-colors ${!bulk ? "bg-yellow-400 text-black" : "text-gray-500 hover:text-white"}`}
              >
                Uma palavra
              </button>
              <button
                type="button"
                onClick={() => setBulk(true)}
                className={`text-xs font-bold py-1.5 rounded-full transition-colors ${bulk ? "bg-yellow-400 text-black" : "text-gray-500 hover:text-white"}`}
              >
                Várias de uma vez
              </button>
            </div>

            {bulk && (
              <div className="space-y-2">
                <textarea
                  rows={8}
                  placeholder={"Uma por linha. Tradução é opcional:\nhang out = sair com amigos\nreluctant\nkeep an eye on - ficar de olho em"}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  className={`${inputClass} resize-none`}
                  autoFocus
                />
                <p className="text-xs text-gray-600">
                  Use &ldquo;=&rdquo; ou &ldquo; - &rdquo; para separar a tradução. Sem tradução, ela é sugerida automaticamente.
                </p>
              </div>
            )}

            {!bulk && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <input
                  name="term"
                  required
                  placeholder="Palavra / expressão"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  className={`${inputClass} pr-9`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? "Parar gravação" : "Falar palavra"}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${
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
                  className={`${inputClass} pr-9`}
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
            </div>}

            {!bulk && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className={`${inputClass} pr-9`}
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
            </div>}

            <input type="hidden" name="phonetic" value={phonetic} />

            {!bulk && phonetic && <p className="text-xs font-mono text-gray-500">{phonetic}</p>}
            {!bulk && translationError && (
              <p className="text-xs text-gray-500">
                Nenhuma tradução encontrada para &ldquo;{term}&rdquo;. Digite manualmente.
              </p>
            )}
            {!bulk && exampleError && (
              <p className="text-xs text-gray-500">
                Nenhum exemplo encontrado para &ldquo;{term}&rdquo;. Digite manualmente.
              </p>
            )}

            {!bulk && (
              <textarea
                name="my_sentence"
                rows={2}
                placeholder="Minha frase (opcional) — escreva uma frase sua usando essa palavra"
                value={mySentence}
                onChange={e => setMySentence(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isPending || (bulk && !bulkText.trim())}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              {isPending ? "Salvando…" : bulk ? "Salvar todas" : "Salvar"}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
