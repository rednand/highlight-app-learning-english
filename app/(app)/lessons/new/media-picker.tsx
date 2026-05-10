"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import { Search, X, Film, Tv } from "lucide-react"
import { searchTMDB, type TMDBResult } from "../../../actions/tmdb"

type Selection = TMDBResult & { season?: number }

export default function MediaPicker({ onSelect }: { onSelect: (s: Selection | null) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TMDBResult[]>([])
  const [selected, setSelected] = useState<Selection | null>(null)
  const [season, setSeason] = useState("")
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQuery(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const { results: r } = await searchTMDB(val)
        setResults(r)
      })
    }, 400)
  }

  function pick(r: TMDBResult) {
    const s: Selection = { ...r, season: season ? parseInt(season) : undefined }
    setSelected(s)
    setResults([])
    setQuery("")
    onSelect(s)
  }

  function clear() {
    setSelected(null)
    setSeason("")
    onSelect(null)
  }

  const posterUrl = (path: string) => `https://image.tmdb.org/t/p/w92${path}`

  if (selected) {
    return (
      <div className="flex items-center gap-4 p-3 bg-[#0f0f0f] border border-yellow-400/20 rounded-xl">
        {selected.poster_path ? (
          <Image src={posterUrl(selected.poster_path)} alt={selected.title} width={40} height={60} className="rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-10 h-15 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
            {selected.tmdb_type === "movie" ? <Film size={16} className="text-gray-600" /> : <Tv size={16} className="text-gray-600" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{selected.title}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {selected.tmdb_type === "movie" ? "Filme" : "Série"} · {selected.year}
            {selected.tmdb_type === "tv" && selected.season && ` · Temporada ${selected.season}`}
          </p>
        </div>
        <button type="button" onClick={clear} className="text-gray-600 hover:text-white transition-colors shrink-0">
          <X size={16} />
        </button>
        <input type="hidden" name="tmdb_id" value={selected.tmdb_id} />
        <input type="hidden" name="tmdb_type" value={selected.tmdb_type} />
        <input type="hidden" name="tmdb_poster_path" value={selected.poster_path ?? ""} />
        <input type="hidden" name="tmdb_season" value={selected.season ?? ""} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}
          placeholder="Buscar filme ou série..."
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-9 pr-10 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors text-sm"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/10 border-t-yellow-400 rounded-full animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
          {results.map((r) => (
            <button
              key={`${r.tmdb_type}-${r.tmdb_id}`}
              type="button"
              onClick={() => pick(r)}
              className="flex items-center gap-3 p-3 bg-[#0f0f0f] border border-white/5 rounded-xl hover:border-yellow-400/20 transition-all text-left"
            >
              {r.poster_path ? (
                <Image src={posterUrl(r.poster_path)} alt={r.title} width={32} height={48} className="rounded object-cover shrink-0" />
              ) : (
                <div className="w-8 h-12 bg-white/5 rounded flex items-center justify-center shrink-0">
                  {r.tmdb_type === "movie" ? <Film size={12} className="text-gray-600" /> : <Tv size={12} className="text-gray-600" />}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{r.title}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">
                  {r.tmdb_type === "movie" ? "Filme" : "Série"}{r.year ? ` · ${r.year}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <input type="hidden" name="tmdb_id" value="" />
      <input type="hidden" name="tmdb_type" value="" />
      <input type="hidden" name="tmdb_poster_path" value="" />
      <input type="hidden" name="tmdb_season" value="" />
    </div>
  )
}
