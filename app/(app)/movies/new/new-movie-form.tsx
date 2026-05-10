"use client"

import { useState } from "react"
import { createLesson } from "../../../actions/lessons"
import MediaPicker from "../../lessons/new/media-picker"
import type { TMDBResult } from "../../../actions/tmdb"

type Selection = TMDBResult & { season?: number }

export default function NewMovieForm() {
  const today = new Date().toISOString().split("T")[0]
  const [title, setTitle] = useState("")
  const [hasPicked, setHasPicked] = useState(false)

  function handleSelect(media: Selection | null) {
    if (media) {
      setTitle(
        media.tmdb_type === "tv" && media.season
          ? `${media.title} — T${media.season}`
          : media.title,
      )
      setHasPicked(true)
    } else {
      setTitle("")
      setHasPicked(false)
    }
  }

  return (
    <form action={createLesson} className="space-y-5">
      <input type="hidden" name="source_type" value="movie" />

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Título
        </label>
        <MediaPicker onSelect={handleSelect} />
      </div>

      {hasPicked && (
        <>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Como quer chamar essa sessão de estudo?
            </label>
            <input
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Data <span className="text-gray-700 normal-case font-normal tracking-normal">(opcional)</span>
            </label>
            <input
              name="lesson_date"
              type="date"
              defaultValue={today}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Notas <span className="text-gray-700 normal-case font-normal tracking-normal">(opcional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Episódio, cena, contexto..."
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors resize-none text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-full transition-colors text-sm"
          >
            Criar sessão de estudo
          </button>
        </>
      )}
    </form>
  )
}
