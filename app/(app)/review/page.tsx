import { createClient } from "../../utils/supabase/server"
import ReviewClient from "./review-client"

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: lessons }, { count: totalDue }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title")
      .eq("user_id", user!.id)
      .order("lesson_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .lte("next_review_at", new Date().toISOString()),
  ])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">REVISÃO</p>
        <h1 className="text-2xl font-bold text-white">Flashcards</h1>
      </div>
      <ReviewClient lessons={lessons ?? []} totalDue={totalDue ?? 0} />
    </div>
  )
}
