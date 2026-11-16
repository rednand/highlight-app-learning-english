"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"

const MAX_LENGTH = 5000

function cleanContent(content: string): string {
  const text = content.trim()
  if (!text) throw new Error("A anotação está vazia")
  if (text.length > MAX_LENGTH) throw new Error(`A anotação passa de ${MAX_LENGTH} caracteres`)
  return text
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  return { supabase, user }
}

export async function addLessonNote(lessonId: string, content: string) {
  const text = cleanContent(content)
  const { supabase, user } = await requireUser()

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("user_id", user.id)
    .single()
  if (!lesson) throw new Error("Aula não encontrada")

  const { error } = await supabase
    .from("lesson_notes")
    .insert({ lesson_id: lessonId, user_id: user.id, content: text })
  if (error) throw new Error(error.message)

  revalidatePath(`/lessons/${lessonId}`)
}

export async function updateLessonNote(id: string, lessonId: string, content: string) {
  const text = cleanContent(content)
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from("lesson_notes")
    .update({ content: text, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/lessons/${lessonId}`)
}

export async function deleteLessonNote(id: string, lessonId: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from("lesson_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/lessons/${lessonId}`)
}
