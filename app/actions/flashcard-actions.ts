"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "../utils/supabase/server"

export async function createVocabularyWithFlashcard(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const word = formData.get("word") as string
  const translation = formData.get("translation") as string
  const lesson_id = formData.get("lesson_id") as string

  const { data: vocab, error } = await supabase
    .from("vocabulary")
    .insert({ user_id: user.id, lesson_id, word, translation })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from("flashcards").insert({
    user_id: user.id,
    vocabulary_id: vocab.id,
    front: word,        
    back: translation, 
    ease_factor: 2.5,
    interval_days: 1,
    next_review_at: new Date().toISOString(),
  })

  revalidatePath("/lessons")
  revalidatePath("/flashcards")
  revalidatePath(`/dashboard/lessons/${lesson_id}`)
}

export async function createFlashcardManual(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const front = formData.get("front") as string
  const back = formData.get("back") as string

  if (!front || !back) throw new Error("Preencha frente e verso")

  await supabase.from("flashcards").insert({
    user_id: user.id,
    vocabulary_id: null,
    front,
    back,
    ease_factor: 2.5,
    interval_days: 1,
    next_review_at: new Date().toISOString(),
  })

  revalidatePath("/flashcards")
}