export interface StreakRecord {
  days: number
  last_review_date: string
}

export function computeStreak(
  data: StreakRecord | null,
  today: string,
  yesterday: string,
): number {
  if (!data) return 0
  if (data.last_review_date === today || data.last_review_date === yesterday) {
    return data.days
  }
  return 0
}

export function computeNewDays(
  existing: StreakRecord | null,
  today: string,
  yesterday: string,
): number | null {
  if (existing?.last_review_date === today) return null
  if (existing?.last_review_date === yesterday) return existing.days + 1
  return 1
}

export function todayAndYesterday(): { today: string; yesterday: string } {
  return {
    today: new Date().toISOString().slice(0, 10),
    yesterday: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
  }
}
