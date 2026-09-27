import { createClient } from "../utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronRight, Plus, Sparkles, Film, Tv, Music, BookMarked } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [lessonsResult, dueFlashcardsResult, recentItemsResult, totalLessonsResult, totalWordsResult, todayWordsResult, todayReviewsResult, recentMediaResult] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, title, lesson_date, created_at")
        .eq("user_id", user.id)
        .eq("source_type", "lesson")
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
        .select("id, term, translation, created_at, flashcards(next_review_at)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase.from("lessons").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("lesson_items").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("lesson_items").select("id", { count: "exact" }).eq("user_id", user.id).gte("created_at", today.toISOString()),
      supabase.from("flashcards").select("id", { count: "exact" }).eq("user_id", user.id).gte("last_reviewed_at", today.toISOString()),
      supabase
        .from("lessons")
        .select("id, title, source_type, tmdb_poster_path, tmdb_type, music_thumbnail_url, book_cover_url, created_at")
        .eq("user_id", user.id)
        .in("source_type", ["movie", "music", "book"])
        .order("created_at", { ascending: false })
        .limit(3),
    ])

  const lessons = lessonsResult.data ?? []
  const dueCount = dueFlashcardsResult.count ?? 0
  type DueCard = { id: string; front: string; back: string | null }
  const dueCards = (dueFlashcardsResult.data ?? []) as unknown as DueCard[]
  type RecentItem = { id: string; term: string; translation: string | null; created_at: string; flashcards: { next_review_at: string } | { next_review_at: string }[] | null }
  const recentItems = (recentItemsResult.data ?? []) as unknown as RecentItem[]
  const now = new Date().toISOString()
  function isItemDue(item: RecentItem): boolean {
    const rel = item.flashcards
    const nextReview = Array.isArray(rel) ? rel[0]?.next_review_at : rel?.next_review_at
    return !!nextReview && nextReview <= now
  }
  const totalLessons = totalLessonsResult.count ?? 0
  const totalWords = totalWordsResult.count ?? 0
  const todayWords = todayWordsResult.count ?? 0
  const todayReviews = todayReviewsResult.count ?? 0
  const recentMedia = recentMediaResult.data ?? []

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
  const todayProgress = todayWords + todayReviews
  const goalPct = Math.min(100, Math.round((todayProgress / DAILY_GOAL) * 100))

  const rawName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0].match(/^[a-zA-Z]+/)?.[0] ??
    "você"
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()

  return (
    <div className="pt-4 px-[18px] pb-6 md:p-8">
      <div className="mb-6">
        <div className="md:hidden">
          <Image src="/highlight-logo.png" alt="Highlight" width={100} height={29} className="h-7 w-auto mb-2" />
          <h1 className="text-lg font-bold text-white">Olá, {firstName}! 👋</h1>
          <p className="text-sm text-[#8B8B98] mt-0.5">O que vamos aprender hoje?</p>

          <div className="flex flex-col gap-2 mt-4">
            <Link
              href="/lessons/new"
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              <Plus size={15} />
              Nova Aula
            </Link>
            <Link
              href="/grammar/practice"
              className="w-full flex items-center justify-center gap-2 bg-[#171717] hover:bg-[#1f1f1f] border border-[#2D2D2D] text-white text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              <Sparkles size={15} className="text-yellow-400" />
              Aprender com IA
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4 mt-5 text-xs text-[#8B8B98]">
            <span><span className="text-white font-bold">{totalLessons}</span> aulas</span>
            <span><span className="text-white font-bold">{totalWords}</span> palavras</span>
            <span><span className="font-bold text-[#FDC700]">{dueCount}</span> revisões</span>
          </div>
        </div>

        <div className="hidden md:flex md:items-start md:justify-between md:gap-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">DASHBOARD</p>
            <h1 className="text-2xl font-bold text-white">Olá, {firstName}! 👋</h1>
            <p className="text-sm text-[#8B8B98] mt-1">Continue de onde parou.</p>
            <Link
              href="/grammar/practice"
              className="inline-flex items-center gap-2 bg-[#171717] hover:bg-[#1f1f1f] border border-[#2D2D2D] text-white text-sm font-bold px-4 py-2 rounded-full transition-colors mt-4"
            >
              <Sparkles size={14} className="text-yellow-400" />
              Aprender com IA
            </Link>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center bg-[#121212] border border-[#242424] rounded-[14px] px-5 py-3 min-w-[88px]">
              <p className="text-2xl font-bold text-white leading-none">{totalLessons}</p>
              <p className="text-[10px] font-bold text-[#8B8B98] uppercase tracking-wider mt-1.5">Aulas</p>
            </div>
            <div className="text-center bg-[#121212] border border-[#242424] rounded-[14px] px-5 py-3 min-w-[88px]">
              <p className="text-2xl font-bold text-white leading-none">{totalWords}</p>
              <p className="text-[10px] font-bold text-[#8B8B98] uppercase tracking-wider mt-1.5">Palavras</p>
            </div>
            <div className="text-center bg-[#121212] border border-[#242424] rounded-[14px] px-5 py-3 min-w-[88px]">
              <p className="text-2xl font-bold text-[#FDC700] leading-none">{dueCount}</p>
              <p className="text-[10px] font-bold text-[#8B8B98] uppercase tracking-wider mt-1.5">Revisões</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-[#151515] border border-[#292929] rounded-[18px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-[#8B8B98] uppercase mb-1">Seu próximo passo</p>
                <h2 className="text-base font-bold text-white">Sessão de revisão</h2>
              </div>
              {dueCount > 0 && (
                <span className="text-[10px] font-bold bg-[#FDC700]/10 text-[#FDC700] px-2.5 py-1 rounded-full shrink-0">
                  {dueCount} pendentes
                </span>
              )}
            </div>

            {dueCount === 0 ? (
              <p className="text-sm text-[#8B8B98] py-2">Nenhum flashcard para revisar hoje.</p>
            ) : (
              <>
                <div className="divide-y divide-white/5 my-3">
                  {dueCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between gap-3 py-2.5">
                      <p className="text-white text-sm font-semibold truncate">{card.front}</p>
                      {card.back && <p className="text-[#FDC700] text-xs italic truncate shrink-0">{card.back}</p>}
                    </div>
                  ))}
                </div>
                <Link
                  href="/review"
                  className="flex items-center justify-center gap-2 w-full bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold py-2.5 rounded-full transition-colors"
                >
                  Continuar revisão
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>

          <div className="bg-[#151515] border border-[#292929] rounded-[18px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Meta diária</h2>
              <span className="text-sm font-bold text-white">{todayProgress}<span className="text-[#8B8B98] font-normal">/{DAILY_GOAL}</span></span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#FDC700] rounded-full transition-all duration-500"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <p className="text-xs text-[#8B8B98]">
              {todayProgress >= DAILY_GOAL
                ? "Meta concluída! Ótimo trabalho."
                : `Faltam ${DAILY_GOAL - todayProgress} palavras para completar sua meta hoje.`}
            </p>
          </div>

          <div className="bg-[#151515] border border-[#292929] rounded-[18px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Aulas recentes</h2>
              <Link href="/lessons" className="flex items-center gap-1 text-xs text-[#8B8B98] hover:text-[#FDC700] transition-colors">
                Ver todas
                <ArrowRight size={12} />
              </Link>
            </div>

            {lessons.length === 0 ? (
              <p className="text-sm text-[#8B8B98]">Nenhuma aula ainda.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {lessons.map((lesson) => {
                  const date = lesson.lesson_date
                    ? new Date(lesson.lesson_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
                    : new Date(lesson.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
                  const count = lessonItemCounts[lesson.id] ?? 0
                  return (
                    <Link
                      key={lesson.id}
                      href={`/lessons/${lesson.id}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-white/[0.02] transition-colors group -mx-1 px-1 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm group-hover:text-[#FDC700] transition-colors truncate">
                          {lesson.title}
                        </p>
                        <p className="text-[#8B8B98] text-xs mt-0.5">
                          {date} · {count} {count === 1 ? "item" : "itens"}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-[#8B8B98] shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-[#151515] border border-[#292929] rounded-[18px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Últimas palavras</h2>
              <Link href="/lessons" className="flex items-center gap-1 text-xs text-[#8B8B98] hover:text-[#FDC700] transition-colors">
                Ver todas
                <ArrowRight size={12} />
              </Link>
            </div>

            {recentItems.length === 0 ? (
              <p className="text-sm text-[#8B8B98]">Nenhuma palavra ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentItems.map((item) => (
                  <div key={item.id} className="relative min-w-0 bg-[#0C0C0C] rounded-xl p-3">
                    {isItemDue(item) && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#FDC700]" title="Pendente de revisão" />
                    )}
                    <p className="text-white text-sm font-semibold truncate pr-3">{item.term}</p>
                    {item.translation && (
                      <p className="text-[#8B8B98] text-xs mt-0.5 truncate">{item.translation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#151515] border border-[#292929] rounded-[18px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Mídias recentes</h2>
              <Link href="/media" className="flex items-center gap-1 text-xs text-[#8B8B98] hover:text-[#FDC700] transition-colors">
                Ver todas
                <ArrowRight size={12} />
              </Link>
            </div>

            {recentMedia.length === 0 ? (
              <p className="text-sm text-[#8B8B98]">Nenhuma mídia ainda.</p>
            ) : (
              <div className="space-y-1">
                {recentMedia.map((item) => {
                  const thumbnail =
                    item.source_type === "movie" && item.tmdb_poster_path
                      ? `https://image.tmdb.org/t/p/w92${item.tmdb_poster_path}`
                      : item.source_type === "music" && item.music_thumbnail_url
                        ? item.music_thumbnail_url
                        : item.source_type === "book" && item.book_cover_url
                          ? item.book_cover_url
                          : null
                  const TypeIcon =
                    item.source_type === "music"
                      ? Music
                      : item.source_type === "book"
                        ? BookMarked
                        : item.tmdb_type === "tv"
                          ? Tv
                          : Film
                  return (
                    <Link
                      key={item.id}
                      href={`/lessons/${item.id}`}
                      className="flex items-center gap-3 py-2 hover:bg-white/[0.02] transition-colors group -mx-1 px-1 rounded-lg"
                    >
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbnail} alt={item.title} className="w-7 h-9 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-9 rounded bg-white/5 flex items-center justify-center shrink-0">
                          <TypeIcon size={12} className="text-[#FDC700]/50" />
                        </div>
                      )}
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate flex-1">
                        {item.title}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
