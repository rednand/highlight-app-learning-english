import { getStreak } from "../actions/review"

export default async function StreakBadge() {
  const streak = await getStreak()

  if (streak === 0) return null

  return (
    <div className="mx-3 mb-2 px-3 py-2.5 bg-yellow-400/5 border border-yellow-400/10 rounded-xl">
      <p className="text-[10px] text-gray-500 mb-0.5">Sequência</p>
      <p className="text-sm font-bold text-yellow-400">🔥 {streak} {streak === 1 ? "dia" : "dias"}</p>
    </div>
  )
}
