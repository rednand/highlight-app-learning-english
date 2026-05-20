"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function saveQuizResult(ruleSlug: string, correct: number, total: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .from("grammar_progress")
    .upsert(
      { user_id: user.id, rule_slug: ruleSlug, correct, total, completed_at: new Date().toISOString() },
      { onConflict: "user_id,rule_slug" },
    )

  revalidatePath("/grammar/quiz")
}
