import { createClient } from "../../utils/supabase/server"
import ReviewClient from "./review-client"

type RawCard = {
  ease_factor: number
  next_review_at: string
  lesson_items: { lesson_id: string } | null
}

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date().toISOString()

  const [{ data: lessons }, { count: totalDue }, { data: allCards }, { count: totalFlashcards }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, title, source_type")
        .eq("user_id", user!.id)
        .order("lesson_date", { ascending: false, nullsFirst: false }),
      supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .lte("next_review_at", now),
      supabase
        .from("flashcards")
        .select("ease_factor, next_review_at, lesson_items(lesson_id)")
        .eq("user_id", user!.id),
      supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id),
    ])

  const lessonEaseFactors: Record<string, number[]> = {}
  const lessonMeta: Record<string, { dueCount: number; totalCount: number; minNextReview: string | null }> = {}

  let globalEaseSum = 0
  let globalEaseCount = 0

  for (const card of (allCards as RawCard[] | null) ?? []) {
    const lessonId = card.lesson_items?.lesson_id
    globalEaseSum += card.ease_factor
    globalEaseCount++

    if (!lessonId) continue

    if (!lessonEaseFactors[lessonId]) lessonEaseFactors[lessonId] = []
    if (!lessonMeta[lessonId]) lessonMeta[lessonId] = { dueCount: 0, totalCount: 0, minNextReview: null }

    lessonEaseFactors[lessonId].push(card.ease_factor)
    lessonMeta[lessonId].totalCount++

    if (card.next_review_at <= now) lessonMeta[lessonId].dueCount++

    if (!lessonMeta[lessonId].minNextReview || card.next_review_at < lessonMeta[lessonId].minNextReview!) {
      lessonMeta[lessonId].minNextReview = card.next_review_at
    }
  }

  const lessonStats: Record<string, { totalCount: number; dueCount: number; minNextReview: string | null; dominio: number }> = {}
  for (const [lessonId, factors] of Object.entries(lessonEaseFactors)) {
    const avg = factors.reduce((s, f) => s + f, 0) / factors.length
    const dominio = Math.round(Math.max(0, Math.min(100, ((avg - 1.3) / (2.5 - 1.3)) * 100)))
    lessonStats[lessonId] = { ...lessonMeta[lessonId], dominio }
  }

  const avgDominio =
    globalEaseCount > 0
      ? Math.round(Math.max(0, Math.min(100, ((globalEaseSum / globalEaseCount - 1.3) / (2.5 - 1.3)) * 100)))
      : 0

  const cinemaTotal = (lessons ?? [])
    .filter((l) => l.source_type === "movie" || l.source_type === "music")
    .reduce((sum, l) => sum + (lessonStats[l.id]?.dueCount ?? 0), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">REVISÃO</p>
        <h1 className="text-2xl font-bold text-white">Flashcards</h1>
        <p className="text-gray-500 text-sm mt-1">Revise suas palavras usando repetição espaçada.</p>
      </div>
      <ReviewClient
        lessons={lessons ?? []}
        totalDue={totalDue ?? 0}
        totalFlashcards={totalFlashcards ?? 0}
        avgDominio={avgDominio}
        lessonStats={lessonStats}
        cinemaTotal={cinemaTotal}
      />
    </div>
  )
}
