import { createClient } from "../../utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, BookOpen } from "lucide-react"
import LessonsClient from "./lessons-client"

export default async function LessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, lesson_date, created_at")
    .eq("user_id", user.id)
    .or("source_type.eq.lesson,source_type.is.null")
    .order("lesson_date", { ascending: false, nullsFirst: false })

  const lessonIds = (lessons ?? []).map((l) => l.id)

  let countMap: Record<string, number> = {}
  if (lessonIds.length > 0) {
    const { data: counts } = await supabase
      .from("lesson_items")
      .select("lesson_id")
      .in("lesson_id", lessonIds)
    countMap = (counts ?? []).reduce(
      (acc, item) => {
        acc[item.lesson_id] = (acc[item.lesson_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }

  const { count: totalWords } = await supabase
    .from("lesson_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const lessonsWithCounts = (lessons ?? []).map((l) => ({
    ...l,
    itemCount: countMap[l.id] ?? 0,
  }))

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">HIGHLIGHT</p>
          <h1 className="text-2xl font-bold text-white">Minhas Aulas</h1>
        </div>
        <Link
          href="/lessons/new"
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-4 py-2 rounded-full transition-colors"
        >
          <Plus size={15} />
          Nova Aula
        </Link>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        {lessonsWithCounts.length} aulas&nbsp; · &nbsp;{totalWords ?? 0} palavras no total
      </p>

      {lessonsWithCounts.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={36} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium mb-1">Nenhuma aula ainda</p>
          <p className="text-gray-600 text-sm mb-6">Comece registrando sua primeira aula.</p>
          <Link
            href="/lessons/new"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
          >
            <Plus size={15} />
            Nova Aula
          </Link>
        </div>
      ) : (
        <LessonsClient lessons={lessonsWithCounts} />
      )}
    </div>
  )
}
