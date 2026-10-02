"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"
import { translateTerm } from "./translate"

export async function addLessonItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const lesson_id = formData.get("lesson_id") as string
  const term = formData.get("term") as string
  const translation = formData.get("translation") as string
  const type = (formData.get("type") as string) || "word"
  const context = formData.get("context") as string
  const phonetic = formData.get("phonetic") as string
  const my_sentence = formData.get("my_sentence") as string

  const { data: item, error } = await supabase
    .from("lesson_items")
    .insert({
      lesson_id,
      user_id: user.id,
      term,
      translation: translation || null,
      type,
      context: context || null,
      phonetic: phonetic || null,
      my_sentence: my_sentence || null,
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

function parseBulkLine(line: string): { term: string; translation: string } | null {
  const match = line.match(/^(.+?)(?:\s*=\s*|\s+[-–—]\s+|\t+)(.+)$/)
  const term = (match ? match[1] : line).trim()
  const translation = match ? match[2].trim() : ""
  if (!term) return null
  return { term, translation }
}

export async function addLessonItems(lessonId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const parsed = text
    .split(/\r?\n/)
    .map((line) => parseBulkLine(line))
    .filter((row): row is { term: string; translation: string } => row !== null)

  if (parsed.length === 0) throw new Error("Digite pelo menos uma palavra")
  if (parsed.length > 50) throw new Error("Máximo de 50 palavras por vez")

  const rows = await Promise.all(
    parsed.map(async ({ term, translation }) => ({
      term,
      translation: translation || (await translateTerm(term)) || "",
    }))
  )

  const { data: items, error } = await supabase
    .from("lesson_items")
    .insert(
      rows.map(({ term, translation }) => ({
        lesson_id: lessonId,
        user_id: user.id,
        term,
        translation: translation || null,
        type: /\s/.test(term) ? "expression" : "word",
      }))
    )
    .select()

  if (error) throw new Error(error.message)

  const now = new Date().toISOString()
  await supabase.from("flashcards").insert(
    items.map((item) => ({
      user_id: user.id,
      lesson_item_id: item.id,
      front: item.term,
      back: item.translation || item.term,
      ease_factor: 2.5,
      interval_days: 1,
      next_review_at: now,
    }))
  )

  revalidatePath(`/lessons/${lessonId}`)
  return items.length
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
  const phonetic = formData.get("phonetic") as string
  const my_sentence = formData.get("my_sentence") as string

  await supabase
    .from("lesson_items")
    .update({ term, translation: translation || null, type, context: context || null, phonetic: phonetic || null, my_sentence: my_sentence || null })
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
