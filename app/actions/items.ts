"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function addLessonItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const lesson_id = formData.get("lesson_id") as string
  const term = formData.get("term") as string
  const translation = formData.get("translation") as string
  const type = (formData.get("type") as string) || "word"
  const context = formData.get("context") as string

  const { data: item, error } = await supabase
    .from("lesson_items")
    .insert({
      lesson_id,
      user_id: user.id,
      term,
      translation: translation || null,
      type,
      context: context || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from("flashcards").insert({
    user_id: user.id,
    lesson_item_id: item.id,
    front: term,
    back: translation || term,
    ease_factor: 2.5,
    interval_days: 1,
    next_review_at: new Date().toISOString(),
  })

  revalidatePath(`/lessons/${lesson_id}`)
}

export async function updateLessonItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const id = formData.get("id") as string
  const lesson_id = formData.get("lesson_id") as string
  const term = formData.get("term") as string
  const translation = formData.get("translation") as string
  const type = (formData.get("type") as string) || "word"
  const context = formData.get("context") as string

  await supabase
    .from("lesson_items")
    .update({ term, translation: translation || null, type, context: context || null })
    .eq("id", id)
    .eq("user_id", user.id)

  await supabase
    .from("flashcards")
    .update({ front: term, back: translation || term })
    .eq("lesson_item_id", id)

  revalidatePath(`/lessons/${lesson_id}`)
}

export async function deleteLessonItem(id: string, lessonId: string) {
  const supabase = await createClient()
  await supabase.from("lesson_items").delete().eq("id", id)
  revalidatePath(`/lessons/${lessonId}`)
}
