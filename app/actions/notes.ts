"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"
import { stripNoteColors } from "../lib/note-format"
import { collectImagePaths, removeStoredImages } from "../lib/note-images-server"

const MAX_LENGTH = 5000
// As marcações de cor não contam no limite, mas o texto bruto também tem teto.
const MAX_RAW_LENGTH = 20000

function cleanContent(content: string, allowEmpty = false): string {
  const text = content.trim()
  const visible = stripNoteColors(text).trim()
  if (!visible && !allowEmpty) throw new Error("A anotação está vazia")
  if (!visible) return ""
  if (visible.length > MAX_LENGTH || text.length > MAX_RAW_LENGTH) {
    throw new Error(`A anotação passa de ${MAX_LENGTH} caracteres`)
  }
  return text
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  return { supabase, user }
}

function revalidateLesson(lessonId: string) {
  revalidatePath(`/lessons/${lessonId}`)
  revalidatePath("/lessons")
}

/**
 * Cria uma anotação e devolve o id. Com withImages = true o texto pode ficar
 * vazio (anotação só com imagens, que são enviadas logo depois).
 */
export async function addLessonNote(lessonId: string, content: string, withImages = false): Promise<{ id: string }> {
  const text = cleanContent(content, withImages)
  const { supabase, user } = await requireUser()

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("user_id", user.id)
    .single()
  if (!lesson) throw new Error("Aula não encontrada")

  const { data, error } = await supabase
    .from("lesson_notes")
    .insert({ lesson_id: lessonId, user_id: user.id, content: text })
    .select("id")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Não foi possível salvar a anotação")

  revalidateLesson(lessonId)
  return { id: data.id as string }
}

export async function updateLessonNote(id: string, lessonId: string, content: string) {
  const { supabase, user } = await requireUser()

  const { data: current, error: readError } = await supabase
    .from("lesson_notes")
    .select("image_paths")
    .eq("id", id)
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (readError) throw new Error(readError.message)
  if (!current) throw new Error("Anotação não encontrada. Ela pode ter sido apagada.")
  // Anotação com imagens pode ficar sem texto.
  const text = cleanContent(content, ((current.image_paths ?? []) as string[]).length > 0)

  const { data, error } = await supabase
    .from("lesson_notes")
    .update({ content: text, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .select("id")
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error("Anotação não encontrada. Ela pode ter sido apagada.")

  revalidateLesson(lessonId)
}

export async function deleteLessonNote(id: string, lessonId: string) {
  const { supabase, user } = await requireUser()

  const { data, error } = await supabase
    .from("lesson_notes")
    .delete()
    .eq("id", id)
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .select("id, image_paths")
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error("Anotação não encontrada. Ela pode ter sido apagada.")

  await removeStoredImages(supabase, collectImagePaths(data as { image_paths: string[] | null }[]))
  revalidateLesson(lessonId)
}
