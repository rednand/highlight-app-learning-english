"use client"

import { useState, useRef } from "react"
import { Search, BookMarked, X } from "lucide-react"

type BookResult = {
  id: string
  title: string
  author: string
  coverUrl: string | null
}

export default function BookPicker({ onSelectAction }: { onSelectAction: (b: BookResult | null) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BookResult[]>([])
  const [selected, setSelected] = useState<BookResult | null>(null)
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
          `https://openlibrary.org/search.json?q=${encodeURIComponent(val)}&limit=8&fields=key,title,author_name,cover_i`,
        )
        const data = await res.json() as { docs?: { key: string; title: string; author_name?: string[]; cover_i?: number }[] }
        const books: BookResult[] = (data.docs ?? []).map((doc) => ({
          id: doc.key,
          title: doc.title,
          author: doc.author_name?.[0] ?? "",
          coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        }))
        setResults(books)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  function pick(b: BookResult) {
    setSelected(b)
    setResults([])
    setQuery("")
    onSelectAction(b)
  }

  function clear() {
    setSelected(null)
    onSelectAction(null)
  }

  if (selected) {
    return (
      <div className="flex items-center gap-4 p-3 bg-[#0f0f0f] border border-yellow-400/20 rounded-xl">
        {selected.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.coverUrl} alt={selected.title} className="rounded-lg object-cover shrink-0 w-10 h-14" />
        ) : (
          <div className="w-10 h-14 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
            <BookMarked size={16} className="text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{selected.title}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{selected.author}</p>
        </div>
        <button type="button" onClick={clear} className="text-gray-600 hover:text-white transition-colors shrink-0">
          <X size={16} />
        </button>
        <input type="hidden" name="book_author" value={selected.author} />
        <input type="hidden" name="book_cover_url" value={selected.coverUrl ?? ""} />
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
          placeholder="Buscar livro ou autor..."
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-9 pr-10 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/10 border-t-yellow-400 rounded-full animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {results.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => pick(b)}
              className="w-full flex items-center gap-3 p-3 bg-[#0f0f0f] border border-white/5 rounded-xl hover:border-yellow-400/20 transition-all text-left"
            >
              {b.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.coverUrl} alt={b.title} className="rounded-lg object-cover shrink-0 w-8 h-11" />
              ) : (
                <div className="w-8 h-11 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                  <BookMarked size={14} className="text-gray-600" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{b.title}</p>
                <p className="text-gray-600 text-[10px] mt-0.5 truncate">{b.author}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <input type="hidden" name="book_author" value="" />
      <input type="hidden" name="book_cover_url" value="" />
    </div>
  )
}
