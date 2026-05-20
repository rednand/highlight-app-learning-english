"use server"

import { createClient } from "../utils/supabase/server"
import { computeStreak, computeNewDays, todayAndYesterday } from "../lib/streak-utils"

export async function fetchFlashcards(lessonId?: string, skipDueFilter?: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { cards: null }

  let itemIds: string[] | null = null
  if (lessonId) {
    const { data: items } = await supabase
      .from("lesson_items")
      .select("id")
      .eq("lesson_id", lessonId)
    itemIds = (items ?? []).map(i => i.id)
    if (itemIds.length === 0) return { cards: [] }
  }

  let query = supabase
    .from("flashcards")
    .select("id, front, back, ease_factor, interval_days, next_review_at, lesson_items(phonetic, my_sentence, context, lessons(title, tmdb_poster_path, tmdb_type, tmdb_season, source_type, music_thumbnail_url, music_artist))")
    .eq("user_id", user.id)
    .order("next_review_at", { ascending: true })

  if (!skipDueFilter) query = query.lte("next_review_at", new Date().toISOString())
  if (itemIds) query = query.in("lesson_item_id", itemIds)

  const { data, error } = await query
  if (error) return { cards: null }
  return { cards: data ?? [] }
}

export async function updateFlashcard(
  id: string,
  update: { ease_factor: number; interval_days: number; next_review_at: string },
) {
  const supabase = await createClient()
  await supabase.from("flashcards").update(update).eq("id", id)
}

export async function getStreak(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data } = await supabase
    .from("user_streaks")
    .select("days, last_review_date")
    .eq("user_id", user.id)
    .single()

  const { today, yesterday } = todayAndYesterday()
  return computeStreak(data, today, yesterday)
}

export async function updateStreak(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { today, yesterday } = todayAndYesterday()

  const { data: existing } = await supabase
    .from("user_streaks")
    .select("days, last_review_date")
    .eq("user_id", user.id)
    .single()

  const newDays = computeNewDays(existing, today, yesterday)
  if (newDays === null) return existing!.days

  await supabase
    .from("user_streaks")
    .upsert({ user_id: user.id, days: newDays, last_review_date: today, updated_at: new Date().toISOString() })

  return newDays
}
