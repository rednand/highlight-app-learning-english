"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Eye, EyeOff, Film, Music, BookMarked, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { setItemInReview } from "../../actions/items"
import { filterWords, countByFilter, type ReviewState, type WordFilter, type WordItem } from "../../lib/words-utils"

const FILTERS: { value: WordFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "revisao", label: "Na revisão" },
  { value: "fora", label: "Fora da revisão" },
]

function SourceIcon({ type }: { type: string | null }) {
  const className = "text-gray-600 shrink-0"
  if (type === "movie") return <Film size={11} className={className} />
  if (type === "music") return <Music size={11} className={className} />
  if (type === "book") return <BookMarked size={11} className={className} />
  return <BookOpen size={11} className={className} />
}

export default function WordsClient({ words: serverWords }: { words: WordItem[] }) {
  const [overrides, setOverrides] = useState<Record<string, ReviewState>>({})
  const [pending, setPending] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<WordFilter>("todas")

  const words = useMemo(
    () => serverWords.map((w) => (overrides[w.id] ? { ...w, reviewState: overrides[w.id] } : w)),
    [serverWords, overrides],
  )
  const counts = useMemo(() => countByFilter(words), [words])
  const visible = useMemo(() => filterWords(words, query, filter), [words, query, filter])

  function setPendingFor(id: string, on: boolean) {
    setPending((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function toggle(word: WordItem) {
    if (pending.has(word.id)) return
    const inReview = word.reviewState === "discarded"
    setPendingFor(word.id, true)
    try {
      await setItemInReview(word.id, word.lessonId, inReview)
      setOverrides((prev) => ({ ...prev, [word.id]: inReview ? "active" : "discarded" }))
      toast(inReview ? `"${word.term}" voltou para a revisão` : `"${word.term}" saiu da revisão`)
    } catch {
      toast.error("Não foi possível alterar a revisão")
    } finally {
      setPendingFor(word.id, false)
    }
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar palavra, tradução ou mídia"
          className="w-full bg-[#151515] border border-[#292929] rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors"
        />
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors shrink-0 ${
              filter === value
                ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                : "text-gray-500 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {label} <span className="opacity-60">{counts[value]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500 py-10 text-center">
          {words.length === 0 ? "Nenhuma palavra ainda." : "Nenhuma palavra encontrada."}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((word) => {
            const discarded = word.reviewState === "discarded"
            return (
              <div
                key={word.id}
                className={`flex items-center gap-3 p-3.5 bg-[#151515] border border-[#292929] rounded-[18px] ${discarded ? "opacity-60" : ""}`}
              >
                <Link href={`/lessons/${word.lessonId}`} className="flex-1 min-w-0 group">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-white text-sm font-semibold truncate group-hover:text-yellow-400 transition-colors">
                      {word.term}
                    </p>
                    {discarded && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-gray-400 bg-white/5 shrink-0">
                        Fora da revisão
                      </span>
                    )}
                  </div>
                  {word.translation && <p className="text-gray-400 text-xs mt-0.5 truncate">{word.translation}</p>}
                  {word.sourceTitle && (
                    <p className="flex items-center gap-1 text-gray-600 text-[11px] mt-1 min-w-0">
                      <SourceIcon type={word.sourceType} />
                      <span className="truncate">{word.sourceTitle}</span>
                    </p>
                  )}
                </Link>
                {word.reviewState !== "none" && (
                  <button
                    onClick={() => toggle(word)}
                    disabled={pending.has(word.id)}
                    title={discarded ? "Voltar para a revisão" : "Tirar da revisão"}
                    aria-label={discarded ? `Voltar ${word.term} para a revisão` : `Tirar ${word.term} da revisão`}
                    className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors disabled:opacity-40 ${
                      discarded
                        ? "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
                        : "bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                    }`}
                  >
                    {discarded ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
