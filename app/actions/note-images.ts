"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"
import {
  NOTE_IMAGES_BUCKET, MAX_IMAGES_PER_NOTE, MAX_IMAGE_BYTES, buildImagePath, isAllowedImageType, isImagePathOf,
} from "../lib/note-images"
import { stripNoteColors } from "../lib/note-format"

async function requireNote(noteId: string, lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  const { data: note } = await supabase
    .from("lesson_notes")
    .select("id, content, image_paths")
    .eq("id", noteId)
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .single()
  if (!note) throw new Error("Anotação não encontrada")
  return { supabase, user, paths: (note.image_paths ?? []) as string[], content: (note.content ?? "") as string }
}

export async function addNoteImage(formData: FormData): Promise<{ path: string }> {
  const noteId = String(formData.get("noteId") ?? "")
  const lessonId = String(formData.get("lessonId") ?? "")
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) throw new Error("Nenhuma imagem enviada")
  if (!isAllowedImageType(file.type)) throw new Error("Formato de imagem não aceito (use JPG, PNG ou WebP)")
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Imagem grande demais")

  const { supabase, user, paths } = await requireNote(noteId, lessonId)
  if (paths.length >= MAX_IMAGES_PER_NOTE) throw new Error(`Cada anotação pode ter até ${MAX_IMAGES_PER_NOTE} imagens`)

  const path = buildImagePath(user.id, noteId, crypto.randomUUID(), file.type)
  const { error: uploadError } = await supabase.storage
    .from(NOTE_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw new Error("Não foi possível enviar a imagem")

  const { error } = await supabase
    .from("lesson_notes")
    .update({ image_paths: [...paths, path] })
    .eq("id", noteId)
    .eq("user_id", user.id)
  if (error) {
    await supabase.storage.from(NOTE_IMAGES_BUCKET).remove([path])
    throw new Error(error.message)
  }

  revalidatePath(`/lessons/${lessonId}`)
  return { path }
}

export async function removeNoteImage(noteId: string, lessonId: string, path: string): Promise<void> {
  const { supabase, user, paths, content } = await requireNote(noteId, lessonId)
  if (!isImagePathOf(path, user.id, noteId) || !paths.includes(path)) throw new Error("Imagem não encontrada")
  if (paths.length === 1 && !stripNoteColors(content).trim()) {
    throw new Error("Esta anotação só tem essa imagem. Escreva um texto antes ou apague a anotação.")
  }

  const { error } = await supabase
    .from("lesson_notes")
    .update({ image_paths: paths.filter((p) => p !== path) })
    .eq("id", noteId)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)

  await supabase.storage.from(NOTE_IMAGES_BUCKET).remove([path])
  revalidatePath(`/lessons/${lessonId}`)
}
