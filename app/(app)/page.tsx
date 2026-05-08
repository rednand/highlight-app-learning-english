import { createClient } from "../utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, RotateCcw, Plus, ArrowRight, FileText, Target, Clock } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [lessonsResult, dueFlashcardsResult, recentItemsResult, totalLessonsResult, totalWordsResult, todayWordsResult] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, title, lesson_date, created_at")
        .eq("user_id", user.id)
        .order("lesson_date", { ascending: false, nullsFirst: false })
        .limit(4),
      supabase
        .from("flashcards")
        .select("id, front, back", { count: "exact" })
        .eq("user_id", user.id)
        .lte("next_review_at", new Date().toISOString())
        .limit(2),
      supabase
        .from("lesson_items")
        .select("id, term, translation, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("lessons").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("lesson_items").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("lesson_items").select("id", { count: "exact" }).eq("user_id", user.id).gte("created_at", today.toISOString()),
    ])

  const lessons = lessonsResult.data ?? []
  const dueCount = dueFlashcardsResult.count ?? 0
  const dueCards = dueFlashcardsResult.data ?? []
  const recentItems = recentItemsResult.data ?? []
  const totalLessons = totalLessonsResult.count ?? 0
  const totalWords = totalWordsResult.count ?? 0
  const todayWords = todayWordsResult.count ?? 0

  const lessonIds = lessons.map((l) => l.id)
  let lessonItemCounts: Record<string, number> = {}
  if (lessonIds.length > 0) {
    const { data: counts } = await supabase
      .from("lesson_items")
      .select("lesson_id")
      .in("lesson_id", lessonIds)
    lessonItemCounts = (counts ?? []).reduce(
      (acc, item) => { acc[item.lesson_id] = (acc[item.lesson_id] || 0) + 1; return acc },
      {} as Record<string, number>,
    )
  }

  const DAILY_GOAL = 10
  const goalPct = Math.min(100, Math.round((todayWords / DAILY_GOAL) * 100))

  const rawName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0].match(/^[a-zA-Z]+/)?.[0] ??
    "você"
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">DASHBOARD</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Olá, {firstName}!</h1>
        </div>
        <Link
          href="/lessons/new"
          className="flex items-center gap-1.5 sm:gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-full transition-colors shrink-0"
        >
          <Plus size={14} />
          <span className="hidden xs:inline">Nova </span>Aula
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-3 sm:p-5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center mb-2 sm:mb-4">
            <BookOpen size={13} className="text-yellow-400" />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 mb-1 leading-tight">Aulas registradas</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{totalLessons}</p>
        </div>
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-3 sm:p-5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center mb-2 sm:mb-4">
            <FileText size={13} className="text-yellow-400" />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 mb-1 leading-tight">Palavras anotadas</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{totalWords}</p>
        </div>
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-3 sm:p-5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center mb-2 sm:mb-4">
            <RotateCcw size={13} className={dueCount > 0 ? "text-red-400" : "text-yellow-400"} />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 mb-1 leading-tight">Para revisar hoje</p>
          <p className={`text-2xl sm:text-3xl font-bold ${dueCount > 0 ? "text-yellow-400" : "text-white"}`}>{dueCount}</p>
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Target size={15} className="text-yellow-400" />
            Meta diária
          </h2>
          <span className="text-xs text-gray-500">{todayWords}/{DAILY_GOAL} palavras</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {todayWords >= DAILY_GOAL
            ? "Meta concluída! Ótimo trabalho."
            : `Continue assim! Faltam ${DAILY_GOAL - todayWords} palavras para completar sua meta de hoje.`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
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
            <p className="text-sm text-gray-500">Nenhum flashcard para revisar hoje.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {dueCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-[#0a0a0a] border border-white/5 rounded-lg px-3 py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-white text-sm font-medium">{card.front}</span>
                      {card.back && (
                        <span className="text-gray-500 text-xs ml-2">— {card.back}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock size={10} />
                      <span className="text-[10px]">Agora</span>
                    </div>
                  </div>
                ))}
                {dueCount > 2 && (
                  <p className="text-xs text-gray-600 pl-1">+ {dueCount - 2} outras palavras</p>
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

        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
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
            <p className="text-sm text-gray-500">Nenhuma aula ainda.</p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => {
                const date = lesson.lesson_date
                  ? new Date(lesson.lesson_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                  : new Date(lesson.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                const count = lessonItemCounts[lesson.id] ?? 0
                return (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    className="flex items-center gap-3 bg-[#0a0a0a] border border-white/5 rounded-lg px-3 py-2.5 hover:border-white/10 transition-all group"
                  >
                    <BookOpen size={12} className="text-yellow-400/50 shrink-0" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate flex-1">
                      {lesson.title}
                    </span>
                    <span className="text-[10px] text-gray-600 shrink-0">
                      {date} · {count} {count === 1 ? "item" : "itens"}
                    </span>
                  </Link>
                )
              })}
              <Link
                href="/lessons"
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-400 transition-colors mt-1 pl-1"
              >
                Ver todas
                <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText size={15} className="text-yellow-400" />
            Últimas palavras anotadas
          </h2>
          <span className="text-xs text-gray-500">Esta semana</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {recentItems.map((item) => (
            <div key={item.id} className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3">
              <p className="text-white text-sm font-medium truncate">{item.term}</p>
              {item.translation && (
                <p className="text-gray-500 text-xs mt-0.5 truncate">{item.translation}</p>
              )}
            </div>
          ))}
          <Link
            href="/lessons"
            className="bg-[#0a0a0a] border border-dashed border-white/5 rounded-lg p-3 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-400 hover:border-white/10 transition-all"
          >
            <Plus size={13} />
            <span className="text-xs">Adicionar palavra</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
