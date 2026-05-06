import { createClient } from "../../utils/supabase/server"
import Link from "next/link"
import { Plus, BookOpen } from "lucide-react"

export default async function LessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, lesson_date, created_at")
    .eq("user_id", user!.id)
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

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
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

      {!lessons || lessons.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => {
            const date = lesson.lesson_date
              ? new Date(lesson.lesson_date + "T12:00:00").toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : new Date(lesson.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
            const count = countMap[lesson.id] || 0

            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="block p-5 bg-[#0f0f0f] border border-white/5 rounded-xl hover:border-yellow-400/20 hover:bg-white/[0.02] transition-all group"
              >
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-2">
                  {date}
                </p>
                <h2 className="text-white font-semibold text-base mb-3 group-hover:text-yellow-400 transition-colors line-clamp-2">
                  {lesson.title}
                </h2>
                <p className="text-gray-600 text-xs">
                  {count} {count === 1 ? "item" : "itens"}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
