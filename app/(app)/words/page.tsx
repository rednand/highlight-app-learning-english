import { createClient } from "../../utils/supabase/server"
import { redirect } from "next/navigation"
import { reviewStateOf, buildSearchText, countDuplicates, termKey, type CardState, type WordItem } from "../../lib/words-utils"
import WordsClient from "./words-client"

type Row = {
  id: string
  lesson_id: string
  term: string
  translation: string | null
  lessons: { title: string; source_type: string | null } | null
  flashcards: CardState | CardState[] | null
}

const PAGE_SIZE = 1000

export default async function WordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const rows: Row[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("lesson_items")
      .select("id, lesson_id, term, translation, lessons(title, source_type), flashcards(discarded_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Não foi possível carregar as palavras: ${error.message}`)
    rows.push(...((data ?? []) as unknown as Row[]))
    if (!data || data.length < PAGE_SIZE) break
  }

  const duplicates = countDuplicates(rows.map((row) => row.term))

  const words: WordItem[] = rows.map((row) => ({
    id: row.id,
    lessonId: row.lesson_id,
    term: row.term,
    translation: row.translation,
    sourceTitle: row.lessons?.title ?? null,
    sourceType: row.lessons?.source_type ?? null,
    reviewState: reviewStateOf(row.flashcards),
    searchText: buildSearchText([row.term, row.translation, row.lessons?.title]),
    duplicates: duplicates.get(termKey(row.term)) ?? 1,
  }))

  return (
    <div className="pt-4 px-[18px] pb-6 md:p-8 max-w-3xl">
      <div className="mb-5">
        <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">VOCABULÁRIO</p>
        <h1 className="text-2xl font-bold text-white">Palavras</h1>
        <p className="text-gray-500 text-sm mt-1">
          Toque no olho para tirar uma palavra da revisão ou trazer de volta.
        </p>
      </div>
      <WordsClient words={words} />
    </div>
  )
}
