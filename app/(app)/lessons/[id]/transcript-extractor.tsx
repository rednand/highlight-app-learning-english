"use client"

import { useState, useTransition } from "react"
import { FileText, X, Wand2, Plus, Check } from "lucide-react"
import COMMON_WORDS from "./common-words"
import { addLessonItem } from "../../../actions/items"

type ExtractedWord = {
  term: string
  selected: boolean
}

function extractUncommonWords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .map(w => w.replace(/^[-']+|[-']+$/g, ""))
    .filter(w => w.length > 3 && !COMMON_WORDS.has(w) && /^[a-z]/.test(w))

  return [...new Set(words)]
}

export default function TranscriptExtractor({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [words, setWords] = useState<ExtractedWord[]>([])
  const [step, setStep] = useState<"input" | "select">("input")
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleExtract() {
    const extracted = extractUncommonWords(transcript)
    if (extracted.length === 0) return
    setWords(extracted.map(term => ({ term, selected: true })))
    setStep("select")
  }

  function toggleWord(term: string) {
    setWords(prev => prev.map(w => w.term === term ? { ...w, selected: !w.selected } : w))
  }

  function handleAdd() {
    const selected = words.filter(w => w.selected)
    if (selected.length === 0) return

    startTransition(async () => {
      for (const word of selected) {
        const fd = new FormData()
        fd.append("lesson_id", lessonId)
        fd.append("term", word.term)
        fd.append("type", "word")
        await addLessonItem(fd)
      }
      setDone(true)
    })
  }

  function handleClose() {
    setOpen(false)
    setTranscript("")
    setWords([])
    setStep("input")
    setDone(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full py-3 border border-dashed border-white/10 hover:border-yellow-400/30 text-gray-600 hover:text-yellow-400 text-sm rounded-xl transition-colors justify-center"
      >
        <FileText size={15} />
        Extrair do transcript
      </button>
    )
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {step === "input" ? "Colar transcript" : `${words.length} ${words.length === 1 ? "palavra encontrada" : "palavras encontradas"}`}
        </span>
        <button onClick={handleClose} className="text-gray-600 hover:text-white transition-colors">
          <X size={15} />
        </button>
      </div>

      {done ? (
        <div className="text-center py-4 space-y-2">
          <Check size={24} className="text-green-400 mx-auto" />
          <p className="text-white text-sm font-medium">Palavras adicionadas!</p>
          <button
            onClick={handleClose}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      ) : step === "input" ? (
        <>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder="Cole aqui o transcript da aula, podcast, série ou qualquer texto em inglês..."
            rows={6}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors resize-none"
          />
          <button
            onClick={handleExtract}
            disabled={!transcript.trim()}
            className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black text-sm font-bold py-2.5 rounded-full transition-colors"
          >
            <Wand2 size={14} />
            Extrair palavras
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            Selecione as palavras que quer adicionar à aula:
          </p>
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
            {words.map(({ term, selected }) => (
              <button
                key={term}
                onClick={() => toggleWord(term)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selected
                    ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                    : "bg-transparent border-white/10 text-gray-600"
                }`}
              >
                {term}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setStep("input")}
              className="text-xs text-gray-600 hover:text-white transition-colors"
            >
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">
                {words.filter(w => w.selected).length} selecionadas
              </span>
              <button
                onClick={handleAdd}
                disabled={isPending || words.filter(w => w.selected).length === 0}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black text-xs font-bold px-4 py-2 rounded-full transition-colors"
              >
                <Plus size={13} />
                {isPending ? "Adicionando…" : "Adicionar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
