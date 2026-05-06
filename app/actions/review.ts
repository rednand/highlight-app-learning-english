"use server"

import { createClient } from "../utils/supabase/server"

export async function fetchFlashcards(lessonId?: string) {
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
    .select("id, front, back, ease_factor, interval_days, next_review_at, lesson_items(phonetic, my_sentence)")
    .eq("user_id", user.id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })

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
