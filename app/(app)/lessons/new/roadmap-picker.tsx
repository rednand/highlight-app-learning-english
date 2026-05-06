"use client"

import { useState } from "react"
import { ROADMAP, type RoadmapLevel, sessionKey } from "../../roadmap/roadmap-data"

export default function RoadmapPicker() {
  const [level, setLevel] = useState<RoadmapLevel | "">("")
  const [tema, setTema] = useState("")
  const [session, setSession] = useState("")

  const temas = level ? ROADMAP.find(r => r.level === level)?.temas ?? [] : []
  const sessions = tema ? temas.find(t => t.tema === tema)?.sessions.filter(Boolean) ?? [] : []

  const key = level && tema && session ? sessionKey(level as RoadmapLevel, tema, session) : ""

  function handleLevelChange(val: string) {
    setLevel(val as RoadmapLevel | "")
    setTema("")
    setSession("")
  }

  function handleTemaChange(val: string) {
    setTema(val)
    setSession("")
  }

  const selectClass = "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors"

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        Associar ao Roadmap <span className="text-gray-700 normal-case font-normal tracking-normal">(opcional)</span>
      </label>

      <input type="hidden" name="roadmap_key" value={key} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select value={level} onChange={e => handleLevelChange(e.target.value)} className={selectClass}>
          <option value="">Nível</option>
          {ROADMAP.map(r => (
            <option key={r.level} value={r.level}>{r.level}</option>
          ))}
        </select>

        <select value={tema} onChange={e => handleTemaChange(e.target.value)} disabled={!level} className={selectClass}>
          <option value="">Tema</option>
          {temas.map(t => (
            <option key={t.tema} value={t.tema}>{t.tema}</option>
          ))}
        </select>

        <select value={session} onChange={e => setSession(e.target.value)} disabled={!tema} className={selectClass}>
          <option value="">Sessão</option>
          {(sessions as string[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {key && (
        <p className="text-xs text-yellow-400/70">
          ✓ {level} › {tema} › {session}
        </p>
      )}
    </div>
  )
}
