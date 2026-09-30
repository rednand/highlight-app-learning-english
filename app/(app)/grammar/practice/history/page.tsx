import { redirect } from "next/navigation"
import { createClient } from "../../../../utils/supabase/server"
import grammarRules from "../../../../../data/grammar-rules.json"
import HistoryClient, { type HistoryAttempt } from "./history-client"

export default async function PracticeHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("practice_attempts")
    .select("id, rule_slug, direction, source_text, reference_translation, my_translation, ai_feedback, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const titles = new Map((grammarRules as { slug: string; title: string }[]).map((r) => [r.slug, r.title]))
  const attempts: HistoryAttempt[] = (data ?? []).map((a) => ({
    ...a,
    rule_title: titles.get(a.rule_slug) ?? a.rule_slug,
  }))

  return <HistoryClient attempts={attempts} />
}
