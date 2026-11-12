"use client"

import { useState, useTransition } from "react"
import { FileText, X, Wand2, Plus, Check, Music } from "lucide-react"
import { addLessonItem } from "../../../actions/items"
import { translateTerm } from "../../../actions/translate"
import { fetchLyrics } from "../../../actions/lyrics"
import { extractUncommonWords } from "../../../lib/extract-words"

type ExtractedWord = {
  term: string
  sentence: string
  selected: boolean
  translation?: string
  translating?: boolean
}

const LYRICS_ERRORS: Record<string, string> = {
  not_found: "Não encontramos a letra dessa música. Cole a letra abaixo.",
  not_music: "Essa mídia não é uma música.",
  unavailable: "Não foi possível buscar a letra agora. Tente de novo ou cole abaixo.",
}

const PLACEHOLDERS: Record<string, string> = {
  movie: "Cole aqui a legenda ou um trecho do filme/série em inglês...",
  music: "Cole aqui a letra da música em inglês...",
  book: "Cole aqui um trecho do livro em inglês...",
}

export default function TranscriptExtractor({ lessonId, sourceType }: { lessonId: string; sourceType?: string | null }) {
  const isMusic = sourceType === "music"
  const [open, setOpen] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [words, setWords] = useState<ExtractedWord[]>([])
  const [step, setStep] = useState<"input" | "select">("input")
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false)
  const [lyricsError, setLyricsError] = useState<string | null>(null)

  async function handleFetchLyrics() {
    setLyricsError(null)
    setIsFetchingLyrics(true)
    try {
      const result = await fetchLyrics(lessonId)
      if ("lyrics" in result) setTranscript(result.lyrics)
      else setLyricsError(LYRICS_ERRORS[result.error])
    } catch {
      setLyricsError(LYRICS_ERRORS.unavailable)
    } finally {
      setIsFetchingLyrics(false)
    }
  }

  async function handleExtract() {
    const extracted = extractUncommonWords(transcript)
    if (extracted.length === 0) return

    const initial = extracted.map(({ term, sentence }) => ({ term, sentence, selected: true, translating: true }))
    setWords(initial)
    setStep("select")
    setIsTranslating(true)

    const BATCH = 8
    for (let i = 0; i < extracted.length; i += BATCH) {
      const batch = extracted.slice(i, i + BATCH)
      await Promise.all(
        batch.map(async ({ term }) => {
          const translation = await translateTerm(term)
          setWords(prev =>
            prev.map(w => w.term === term ? { ...w, translation: translation ?? undefined, translating: false } : w)
          )
        })
      )
    }
    setIsTranslating(false)
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
        if (word.translation) fd.append("translation", word.translation)
        fd.append("context", word.sentence)
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
    setIsTranslating(false)
    setLyricsError(null)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full py-3 border border-dashed border-white/10 hover:border-yellow-400/30 text-gray-600 hover:text-yellow-400 text-sm rounded-xl transition-colors justify-center"
      >
        {isMusic ? <Music size={15} /> : <FileText size={15} />}
        {isMusic ? "Extrair da letra" : "Extrair de um texto"}
      </button>
    )
  }

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {step === "input"
            ? (isMusic ? "Letra da música" : "Colar texto")
            : `${words.length} ${words.length === 1 ? "palavra encontrada" : "palavras encontradas"}${isTranslating ? " — traduzindo…" : ""}`}
        </span>
        <button onClick={handleClose} className="text-gray-600 hover:text-white transition-colors">
          <X size={15} />
        </button>
      </div>

      {done ? (
        <div className="text-center py-4 space-y-2">
          <Check size={24} className="text-green-400 mx-auto" />
          <p className="text-white text-sm font-medium">Palavras adicionadas!</p>
          <p className="text-gray-500 text-xs">Cada uma foi salva com a frase onde apareceu.</p>
          <button onClick={handleClose} className="text-xs text-gray-500 hover:text-white transition-colors">
            Fechar
          </button>
        </div>
      ) : step === "input" ? (
        <>
          {isMusic && (
            <button
              type="button"
              onClick={handleFetchLyrics}
              disabled={isFetchingLyrics}
              className="w-full flex items-center justify-center gap-2 bg-[#171717] hover:bg-[#1f1f1f] border border-[#2D2D2D] disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              <Music size={14} className={`text-yellow-400 ${isFetchingLyrics ? "animate-pulse" : ""}`} />
              {isFetchingLyrics ? "Buscando letra…" : "Buscar letra automaticamente"}
            </button>
          )}
          {lyricsError && <p className="text-xs text-red-400">{lyricsError}</p>}
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder={PLACEHOLDERS[sourceType ?? ""] ?? "Cole aqui o transcript da aula, podcast, série ou qualquer texto em inglês..."}
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
          <p className="text-xs text-gray-500">Selecione as palavras que quer adicionar à aula:</p>
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {words.map(({ term, sentence, selected, translation, translating }) => (
              <button
                key={term}
                title={sentence}
                onClick={() => toggleWord(term)}
                className={`flex flex-col items-start px-3 py-2 rounded-xl text-xs border transition-colors text-left ${
                  selected
                    ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                    : "bg-transparent border-white/10 text-gray-600"
                }`}
              >
                <span className="font-medium">{term}</span>
                {translating ? (
                  <span className="opacity-40 text-[10px] mt-0.5">…</span>
                ) : translation ? (
                  <span className="opacity-60 text-[10px] mt-0.5">{translation}</span>
                ) : null}
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
                disabled={isPending || isTranslating || words.filter(w => w.selected).length === 0}
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
