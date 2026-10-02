"use client"

import { useSyncExternalStore } from "react"
import { Play, Square } from "lucide-react"
import {
  endWatchSession,
  getWatchSessionLessonId,
  startWatchSession,
  subscribeWatchSession,
} from "../app/lib/watch-session"

export default function WatchSessionToggle({ lessonId }: { lessonId: string }) {
  const activeId = useSyncExternalStore(subscribeWatchSession, getWatchSessionLessonId, () => null)
  const isActive = activeId === lessonId

  if (isActive) {
    return (
      <button
        onClick={endWatchSession}
        className="flex items-center gap-2 w-full justify-center bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold py-2.5 rounded-full transition-colors hover:bg-yellow-400/20"
      >
        <Square size={12} />
        Sessão ativa — encerrar
      </button>
    )
  }

  return (
    <button
      onClick={() => startWatchSession(lessonId)}
      className="flex items-center gap-2 w-full justify-center bg-[#151515] border border-[#292929] text-gray-400 hover:text-white text-xs font-bold py-2.5 rounded-full transition-colors"
    >
      <Play size={12} />
      Iniciar sessão (reabrir o app direto aqui)
    </button>
  )
}
