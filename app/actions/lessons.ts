"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type PendingItem = {
  term: string
  translation: string
  type: string
  context: string
  phonetic: string
  my_sentence: string
}

function isPendingItem(value: unknown): value is PendingItem {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.term === "string" && v.term.trim().length > 0
}

function parsePendingItems(raw: string | null): PendingItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isPendingItem) : []
  } catch {
    return []
  }
}

function formatLessonDate(lesson_date: string): string {
  const date = lesson_date ? new Date(`${lesson_date}T00:00:00`) : new Date()
  return date.toLocaleDateString("pt-BR")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function createLesson(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const rawTitle = formData.get("title") as string
  const lesson_date = formData.get("lesson_date") as string
  const notes = formData.get("notes") as string
  const roadmap_key = formData.get("roadmap_key") as string
  const title = rawTitle.trim() || formatLessonDate(lesson_date)
  const tmdb_id = formData.get("tmdb_id") as string
  const tmdb_type = formData.get("tmdb_type") as string
  const tmdb_poster_path = formData.get("tmdb_poster_path") as string
  const tmdb_season = formData.get("tmdb_season") as string
  const source_type = (formData.get("source_type") as string) || "lesson"
  const music_artist = formData.get("music_artist") as string
  const music_thumbnail_url = formData.get("music_thumbnail_url") as string
  const book_author = formData.get("book_author") as string
  const book_cover_url = formData.get("book_cover_url") as string
  const items = parsePendingItems(formData.get("items") as string)

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      title,
      lesson_date: lesson_date || null,
      notes: notes || null,
      roadmap_key: roadmap_key || null,
      user_id: user.id,
      source_type,
      tmdb_id: tmdb_id ? parseInt(tmdb_id) : null,
      tmdb_type: tmdb_type || null,
      tmdb_poster_path: tmdb_poster_path || null,
      tmdb_season: tmdb_season ? parseInt(tmdb_season) : null,
      music_artist: music_artist || null,
      music_thumbnail_url: music_thumbnail_url || null,
      book_author: book_author || null,
      book_cover_url: book_cover_url || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (items.length > 0) {
    const { data: insertedItems, error: itemsError } = await supabase
      .from("lesson_items")
      .insert(items.map(item => ({
        lesson_id: data.id,
        user_id: user.id,
        term: item.term,
        translation: item.translation || null,
        type: item.type || "word",
        context: item.context || null,
        phonetic: item.phonetic || null,
        my_sentence: item.my_sentence || null,
      })))
      .select()

    if (itemsError) throw new Error(itemsError.message)

    await supabase.from("flashcards").insert(
      insertedItems.map(item => ({
        user_id: user.id,
        lesson_item_id: item.id,
        front: item.term,
        back: item.translation || item.term,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_at: new Date().toISOString(),
      }))
    )
  }

  revalidatePath("/lessons")
  redirect(`/lessons/${data.id}`)
}

export async function updateLesson(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const lesson_date = formData.get("lesson_date") as string
  const notes = formData.get("notes") as string
  const roadmap_key = formData.get("roadmap_key") as string

  const { error } = await supabase
    .from("lessons")
    .update({ title, lesson_date: lesson_date || null, notes: notes || null, roadmap_key: roadmap_key || null })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/lessons/${id}`)
}

export async function deleteLesson(id: string) {
  const supabase = await createClient()
  await supabase.from("lessons").delete().eq("id", id)
  revalidatePath("/lessons")
  redirect("/lessons")
}
