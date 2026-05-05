import { createClient } from "../utils/supabase/server"
import Link from "next/link"
import { BookOpen, RotateCcw, Plus, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [lessonsResult, flashcardsResult, recentItemsResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, lesson_date, created_at")
      .eq("user_id", user!.id)
      .order("lesson_date", { ascending: false, nullsFirst: false })
      .limit(4),
    supabase
      .from("flashcards")
      .select("id", { count: "exact" })
      .eq("user_id", user!.id)
      .lte("next_review_at", new Date().toISOString()),
    supabase
      .from("lesson_items")
      .select("id, term, translation, type, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const lessons = lessonsResult.data ?? []
  const dueCount = flashcardsResult.count ?? 0
  const recentItems = recentItemsResult.data ?? []

  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("id", { count: "exact" })
    .eq("user_id", user!.id)

  const { count: totalWords } = await supabase
    .from("lesson_items")
    .select("id", { count: "exact" })
    .eq("user_id", user!.id)

  const firstName = user!.email?.split("@")[0] ?? "você"

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-400 mb-1">DASHBOARD</p>
        <h1 className="text-2xl font-bold text-white">Olá, {firstName}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{totalLessons ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Aulas registradas</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{totalWords ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Palavras anotadas</p>
        </div>
        <div className={`border rounded-xl p-4 ${dueCount > 0 ? "bg-yellow-400/5 border-yellow-400/20" : "bg-[#111] border-white/5"}`}>
          <p className={`text-2xl font-bold ${dueCount > 0 ? "text-yellow-400" : "text-white"}`}>{dueCount}</p>
          <p className="text-xs text-gray-500 mt-1">Para revisar hoje</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Review card */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw size={15} className="text-yellow-400" />
              Revisão de hoje
            </h2>
            {dueCount > 0 && (
              <span className="text-[10px] font-bold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">
                {dueCount} pendentes
              </span>
            )}
          </div>

          {dueCount === 0 ? (
            <p className="text-sm text-gray-600">Nenhum flashcard para revisar hoje. Volte amanhã!</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {recentItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{item.term}</span>
                    {item.translation && (
                      <span className="text-gray-600 text-xs">— {item.translation}</span>
                    )}
                  </div>
                ))}
                {dueCount > 3 && (
                  <p className="text-xs text-gray-600">+ {dueCount - 3} outros</p>
                )}
              </div>
              <Link
                href="/review"
                className="flex items-center justify-center gap-2 w-full bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold py-2.5 rounded-full transition-colors"
              >
                Revisar agora
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>

        {/* Recent lessons */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen size={15} className="text-yellow-400" />
              Últimas aulas
            </h2>
            <Link href="/lessons/new" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              <Plus size={16} />
            </Link>
          </div>

          {lessons.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma aula ainda.</p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => {
                const date = lesson.lesson_date
                  ? new Date(lesson.lesson_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                  : new Date(lesson.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                return (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    className="flex items-center gap-3 py-1.5 group"
                  >
                    <span className="text-[10px] text-gray-600 w-14 shrink-0">{date}</span>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                      {lesson.title}
                    </span>
                  </Link>
                )
              })}
              <Link
                href="/lessons"
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-yellow-400 transition-colors mt-2"
              >
                Ver todas
                <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Last added words */}
      {recentItems.length > 0 && (
        <div className="mt-6 bg-[#111] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Últimas palavras anotadas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {recentItems.map((item) => (
              <div key={item.id} className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3">
                <p className="text-white text-sm font-medium truncate">{item.term}</p>
                {item.translation && (
                  <p className="text-gray-600 text-xs mt-0.5 truncate">{item.translation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
