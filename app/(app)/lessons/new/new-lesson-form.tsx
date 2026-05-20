"use client"

import { useState } from "react"
import { createLesson } from "../../../actions/lessons"
import MediaPicker from "./media-picker"
import RoadmapPicker from "./roadmap-picker"
import type { TMDBResult } from "../../../actions/tmdb"

type Selection = TMDBResult & { season?: number }

export default function NewLessonForm() {
  const today = new Date().toISOString().split("T")[0]
  const [title, setTitle] = useState("")

  function handleMediaSelect(media: Selection | null) {
    if (media) {
      setTitle(
        media.tmdb_type === "tv" && media.season
          ? `${media.title} — T${media.season}`
          : media.title,
      )
    }
  }

  return (
    <form action={createLesson} className="space-y-5">

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Título
        </label>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Ex: Phrasal verbs com &ldquo;up&rdquo;'
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Data da aula
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
          Notas{" "}
          <span className="text-gray-700 normal-case font-normal tracking-normal">(opcional)</span>
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Contexto, tema da aula, observações..."
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors resize-none text-sm"
        />
      </div>

      <RoadmapPicker />

      <button
        type="submit"
        className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-full transition-colors text-sm"
      >
        Criar Aula
      </button>
    </form>
  )
}
