export type Grade = 0 | 1 | 2 | 3 | 4 | 5

export interface FlashcardSM2 {
  ease_factor: number
  interval_days: number
}

export interface LessonStat {
  totalCount: number
  dueCount: number
  minNextReview: string | null
  dominio: number
}

export function sm2(
  card: FlashcardSM2,
  grade: Grade,
): { ease_factor: number; interval_days: number; next_review_at: string } {
  let { ease_factor, interval_days } = card
  ease_factor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02),
  )
  if (grade < 3) {
    interval_days = 1
  } else {
    interval_days = interval_days === 1 ? 6 : Math.round(interval_days * ease_factor)
  }
  const next = new Date()
  next.setDate(next.getDate() + interval_days)
  return {
    ease_factor: parseFloat(ease_factor.toFixed(2)),
    interval_days,
    next_review_at: next.toISOString(),
  }
}

export function formatNextReview(dateStr: string | null): string {
  if (!dateStr) return "—"
  const now = new Date()
  const next = new Date(dateStr)
  if (next <= now) return "Agora"
  const diffMs = next.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 1) return "Amanhã"
  return `Em ${diffDays} dias`
}

export function urgencyLabel(
  stat: LessonStat | undefined,
): { label: string; color: string } | null {
  if (!stat) return null
  if (stat.dueCount > 0) return { label: "Urgente", color: "bg-red-500/20 text-red-400" }
  if (!stat.minNextReview) return null
  const diffMs = new Date(stat.minNextReview).getTime() - Date.now()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 2) return { label: "Moderado", color: "bg-yellow-500/20 text-yellow-400" }
  return { label: "Tranquilo", color: "bg-green-500/20 text-green-400" }
}
