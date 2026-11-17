"use server"

import { redirect } from "next/navigation"
import { createClient } from "../utils/supabase/server"
import { createAdminClient } from "../utils/supabase/admin"
import { collectImagePaths, removeStoredImages } from "../lib/note-images-server"

export type DeleteAccountResult = { error: string }

export async function deleteAccount(
  _prev: DeleteAccountResult | null,
  formData: FormData,
): Promise<DeleteAccountResult | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (formData.get("confirmation") !== "EXCLUIR") {
    return { error: "Digite EXCLUIR para confirmar." }
  }

  const admin = createAdminClient()

  const flashcards = await admin.from("flashcards").delete().eq("user_id", user.id)
  if (flashcards.error) return { error: "Não foi possível excluir sua conta. Tente novamente." }

  const notes = await admin.from("lesson_notes").select("image_paths").eq("user_id", user.id)
  if (notes.error) return { error: "Não foi possível excluir sua conta. Tente novamente." }

  const lessons = await admin.from("lessons").delete().eq("user_id", user.id)
  if (lessons.error) return { error: "Não foi possível excluir sua conta. Tente novamente." }

  // Só depois que os dados saíram: se algo falhar antes, as imagens continuam lá.
  await removeStoredImages(admin, collectImagePaths(notes.data as { image_paths: string[] | null }[] | null))

  const removed = await admin.auth.admin.deleteUser(user.id)
  if (removed.error) return { error: "Não foi possível excluir sua conta. Tente novamente." }

  await supabase.auth.signOut()
  redirect("/login")
}
