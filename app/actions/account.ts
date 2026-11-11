"use server"

import { redirect } from "next/navigation"
import { createClient } from "../utils/supabase/server"
import { createAdminClient } from "../utils/supabase/admin"

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

  const lessons = await admin.from("lessons").delete().eq("user_id", user.id)
  if (lessons.error) return { error: "Não foi possível excluir sua conta. Tente novamente." }

  const removed = await admin.auth.admin.deleteUser(user.id)
  if (removed.error) return { error: "Não foi possível excluir sua conta. Tente novamente." }

  await supabase.auth.signOut()
  redirect("/login")
}
