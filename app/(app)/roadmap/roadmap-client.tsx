"use client"

import { useState, useTransition } from "react"
import { Trophy, CheckCircle, Circle, Lock } from "lucide-react"
import { ROADMAP, totalSessions, sessionKey, type RoadmapLevel } from "./roadmap-data"
import { toggleRoadmapSession } from "../../actions/roadmap"

const LEVEL_COLOR: Record<RoadmapLevel, string> = {
  Basic: "text-green-400 border-green-400/30 bg-green-400/10",
  Intermediate: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Advanced: "text-red-400 border-red-400/30 bg-red-400/10",
}

export default function RoadmapClient({
  lessonCountByKey,
  initialDone,
}: {
  lessonCountByKey: Record<string, number>
  initialDone: string[]
}) {
  const [activeLevel, setActiveLevel] = useState<RoadmapLevel>("Basic")
  const [done, setDone] = useState<Set<string>>(() => new Set(initialDone))
  const [, startTransition] = useTransition()

  function toggle(key: string) {
    const willBeDone = !done.has(key)
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    startTransition(() => {
      toggleRoadmapSession(key, willBeDone)
    })
  }

  const levelData = ROADMAP.find((r) => r.level === activeLevel)!
  const total = totalSessions(levelData)
  const completed = levelData.temas.reduce(
    (acc, t) => acc + t.sessions.filter((s) => s && done.has(sessionKey(activeLevel, t.tema, s))).length,
    0,
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

      <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 flex items-center justify-center">
              <Trophy size={17} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Progresso Geral</p>
              <p className="text-xs text-gray-500 mt-0.5">{completed} de {total} sessões concluídas</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-yellow-400">{pct}%</span>
        </div>
        <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {levelData.temas.map(({ tema, label, sessions }) => {
          const temaTotal = sessions.filter(Boolean).length
          const temaDone = sessions.filter((s) => s && done.has(sessionKey(activeLevel, tema, s))).length
          const temaPct = temaTotal > 0 ? Math.round((temaDone / temaTotal) * 100) : 0

          return (
            <div key={tema} className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                <span className="text-[10px] text-gray-500">
                  {temaDone}/{temaTotal}&nbsp;
                  <span className="text-yellow-400 font-bold">{temaPct}%</span>
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${temaPct}%` }}
                />
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
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        isDone
                          ? "text-green-400 border-green-400/30 bg-green-400/10"
                          : "text-gray-400 border-white/10 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle size={11} className="shrink-0" />
                      ) : (
                        <Circle size={11} className="shrink-0 opacity-50" />
                      )}
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

      <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 mb-3">Legenda</p>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle size={13} className="text-green-400" />
            Concluído
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Circle size={13} className="opacity-50" />
            Disponível
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock size={13} className="opacity-30" />
            Bloqueado
          </div>
        </div>
      </div>
    </div>
  )
}
