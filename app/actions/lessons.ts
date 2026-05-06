"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function createLesson(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const title = formData.get("title") as string
  const lesson_date = formData.get("lesson_date") as string
  const notes = formData.get("notes") as string
  const roadmap_key = formData.get("roadmap_key") as string

  const { data, error } = await supabase
    .from("lessons")
    .insert({ title, lesson_date: lesson_date || null, notes: notes || null, roadmap_key: roadmap_key || null, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

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
