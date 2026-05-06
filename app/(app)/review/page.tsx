import { createClient } from "../../utils/supabase/server"
import ReviewClient from "./review-client"

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("user_id", user!.id)
    .order("lesson_date", { ascending: false, nullsFirst: false })

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">REVISÃO</p>
        <h1 className="text-2xl font-bold text-white">Flashcards</h1>
      </div>
      <ReviewClient lessons={lessons ?? []} />
    </div>
  )
}
