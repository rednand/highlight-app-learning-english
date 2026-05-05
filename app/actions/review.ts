"use server"

import { createClient } from "../utils/supabase/server"

export async function fetchFlashcards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { cards: null }

  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, ease_factor, interval_days, next_review_at")
    .eq("user_id", user.id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })

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
