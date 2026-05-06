"use client"

import { useState, useEffect } from "react"
import { ROADMAP, totalSessions, sessionKey, type RoadmapLevel } from "./roadmap-data"

const STORAGE_KEY = "hl_roadmap_done"

function loadDone(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveDone(done: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]))
}

const LEVEL_COLOR: Record<RoadmapLevel, string> = {
  Basic: "text-green-400 border-green-400/30 bg-green-400/10",
  Intermediate: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Advanced: "text-red-400 border-red-400/30 bg-red-400/10",
}

const LEVEL_BAR: Record<RoadmapLevel, string> = {
  Basic: "bg-green-400",
  Intermediate: "bg-yellow-400",
  Advanced: "bg-red-400",
}

export default function RoadmapClient({ lessonCountByKey }: { lessonCountByKey: Record<string, number> }) {
  const [activeLevel, setActiveLevel] = useState<RoadmapLevel>("Basic")
  const [done, setDone] = useState<Set<string>>(new Set())

  useEffect(() => {
    setDone(loadDone())
  }, [])

  function toggle(key: string) {
    setDone(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      saveDone(next)
      return next
    })
  }

  const levelData = ROADMAP.find(r => r.level === activeLevel)!
  const total = totalSessions(levelData)
  const completed = levelData.temas.reduce((acc, t) =>
    acc + t.sessions.filter(s => s && done.has(sessionKey(activeLevel, t.tema, s))).length, 0
  )
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {ROADMAP.map(({ level }) => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              activeLevel === level
                ? LEVEL_COLOR[level]
                : "text-gray-500 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{completed} de {total} sessões concluídas</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${LEVEL_BAR[activeLevel]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {levelData.temas.map(({ tema, sessions }) => {
          const temaTotal = sessions.filter(Boolean).length
          const temaDone = sessions.filter(s => s && done.has(sessionKey(activeLevel, tema, s))).length
          const temaPct = temaTotal > 0 ? Math.round((temaDone / temaTotal) * 100) : 0

          return (
            <div key={tema} className="bg-[#111] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{tema}</span>
                <span className="text-[10px] text-gray-600">{temaDone}/{temaTotal} — {temaPct}%</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sessions.map((session, i) => {
                  if (!session) return null
                  const key = sessionKey(activeLevel, tema, session)
                  const isDone = done.has(key)
                  return (
                    <button
                      key={i}
                      onClick={() => toggle(key)}
                      className={`relative px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        isDone
                          ? `${LEVEL_COLOR[activeLevel]} line-through`
                          : "text-gray-400 border-white/10 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {session}
                      {lessonCountByKey[key] > 0 && (
                        <span className="group/badge absolute -top-1.5 -right-1.5">
                          <span className="bg-yellow-400 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {lessonCountByKey[key]}
                          </span>
                          <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-black opacity-0 group-hover/badge:opacity-100 transition-opacity shadow-lg">
                            {lessonCountByKey[key]} {lessonCountByKey[key] === 1 ? "aula vinculada" : "aulas vinculadas"}
                          </span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
