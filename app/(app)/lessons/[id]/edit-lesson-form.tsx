"use client"

import { useState, useTransition } from "react"
import { Pencil, X } from "lucide-react"
import { updateLesson } from "../../../actions/lessons"
import { ROADMAP, type RoadmapLevel, sessionKey } from "../../roadmap/roadmap-data"

type Props = {
  lesson: {
    id: string
    title: string
    lesson_date: string | null
    notes: string | null
    roadmap_key: string | null
  }
}

function parseRoadmapKey(key: string | null) {
  if (!key) return { level: "" as RoadmapLevel | "", tema: "", session: "" }
  const [level, tema, session] = key.split("||")
  return { level: level as RoadmapLevel, tema, session }
}

export default function EditLessonForm({ lesson }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const parsed = parseRoadmapKey(lesson.roadmap_key)
  const [level, setLevel] = useState<RoadmapLevel | "">(parsed.level)
  const [tema, setTema] = useState(parsed.tema)
  const [session, setSession] = useState(parsed.session)

  const temas = level ? ROADMAP.find(r => r.level === level)?.temas ?? [] : []
  const sessions = tema ? (temas.find(t => t.tema === tema)?.sessions.filter(Boolean) ?? []) as string[] : []
  const roadmapKey = level && tema && session ? sessionKey(level as RoadmapLevel, tema, session) : ""

  function handleLevelChange(val: string) {
    setLevel(val as RoadmapLevel | "")
    setTema("")
    setSession("")
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("roadmap_key", roadmapKey)
    startTransition(async () => {
      await updateLesson(fd)
      setOpen(false)
    })
  }

  const inputClass = "w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors text-sm"
  const selectClass = "w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors"

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors"
      >
        <Pencil size={13} />
        Editar
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-[#111] border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Editar aula</span>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-600 hover:text-white transition-colors">
          <X size={15} />
        </button>
      </div>

      <input type="hidden" name="id" value={lesson.id} />

      <input name="title" required defaultValue={lesson.title} placeholder="Título" className={inputClass} />

      <input name="lesson_date" type="date" defaultValue={lesson.lesson_date ?? ""} className={inputClass} />

      <textarea name="notes" rows={3} defaultValue={lesson.notes ?? ""} placeholder="Notas (opcional)" className={`${inputClass} resize-none`} />

      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Roadmap</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={level} onChange={e => handleLevelChange(e.target.value)} className={selectClass}>
            <option value="">Nível</option>
            {ROADMAP.map(r => <option key={r.level} value={r.level}>{r.level}</option>)}
          </select>
          <select value={tema} onChange={e => { setTema(e.target.value); setSession("") }} disabled={!level} className={selectClass}>
            <option value="">Tema</option>
            {temas.map(t => <option key={t.tema} value={t.tema}>{t.tema}</option>)}
          </select>
          <select value={session} onChange={e => setSession(e.target.value)} disabled={!tema} className={selectClass}>
            <option value="">Sessão</option>
            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

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
