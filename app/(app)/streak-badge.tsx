"use client"

import { useEffect, useState } from "react"

export default function StreakBadge() {
  const [streak, setStreak] = useState<number | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem("hl_streak")
        if (raw) {
          const { days, lastDate } = JSON.parse(raw) as { days: number; lastDate: string }
          const today = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86400000).toDateString()
          if (lastDate === today || lastDate === yesterday) {
            setStreak(days)
            return
          }
        }
      } catch {
        //
      }
      setStreak(0)
    }, 0)
    return () => clearTimeout(id)
  }, [])

  if (streak === null || streak === 0) return null

  return (
    <div className="mx-3 mb-2 px-3 py-2.5 bg-yellow-400/5 border border-yellow-400/10 rounded-xl">
      <p className="text-[10px] text-gray-500 mb-0.5">Sequência</p>
      <p className="text-sm font-bold text-yellow-400">🔥 {streak} {streak === 1 ? "dia" : "dias"}</p>
    </div>
  )
}
