"use client"

import { useState, useRef } from "react"
import { Search, Music, X } from "lucide-react"

type TrackResult = {
  trackId: number
  trackName: string
  artistName: string
  artworkUrl100: string | null
}

export default function MusicPicker({ onSelectAction }: { onSelectAction: (s: TrackResult | null) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TrackResult[]>([])
  const [selected, setSelected] = useState<TrackResult | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQuery(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(val)}&media=music&limit=8&country=br`,
        )
        const data = await res.json() as { results: TrackResult[] }
        setResults(data.results ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  function pick(r: TrackResult) {
    setSelected(r)
    setResults([])
    setQuery("")
    onSelectAction(r)
  }

  function clear() {
    setSelected(null)
    onSelectAction(null)
  }

  if (selected) {
    return (
      <div className="flex items-center gap-4 p-3 bg-[#0f0f0f] border border-yellow-400/20 rounded-xl">
        {selected.artworkUrl100 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.artworkUrl100} alt={selected.trackName} className="rounded-lg object-cover shrink-0 w-12 h-12" />
        ) : (
          <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
            <Music size={16} className="text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{selected.trackName}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{selected.artistName}</p>
        </div>
        <button type="button" onClick={clear} className="text-gray-600 hover:text-white transition-colors shrink-0">
          <X size={16} />
        </button>
        <input type="hidden" name="music_artist" value={selected.artistName} />
        <input type="hidden" name="music_thumbnail_url" value={selected.artworkUrl100 ?? ""} />
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
          placeholder="Buscar música ou artista..."
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-9 pr-10 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/10 border-t-yellow-400 rounded-full animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.trackId}
              type="button"
              onClick={() => pick(r)}
              className="w-full flex items-center gap-3 p-3 bg-[#0f0f0f] border border-white/5 rounded-xl hover:border-yellow-400/20 transition-all text-left"
            >
              {r.artworkUrl100 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.artworkUrl100} alt={r.trackName} className="rounded-lg object-cover shrink-0 w-10 h-10" />
              ) : (
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                  <Music size={14} className="text-gray-600" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{r.trackName}</p>
                <p className="text-gray-600 text-[10px] mt-0.5 truncate">{r.artistName}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <input type="hidden" name="music_artist" value="" />
      <input type="hidden" name="music_thumbnail_url" value="" />
    </div>
  )
}
