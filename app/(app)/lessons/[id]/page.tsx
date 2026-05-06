import { createClient } from "../../../utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import AddItemForm from "./add-item-form"
import TranscriptExtractor from "./transcript-extractor"
import EditLessonForm from "./edit-lesson-form"
import ItemCard from "./edit-item-form"
import { DeleteLessonButton } from "./delete-buttons"


export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !lesson) notFound()

  const { data: items } = await supabase
    .from("lesson_items")
    .select("*")
    .eq("lesson_id", id)
    .order("created_at", { ascending: true })

  const lessonDate = lesson.lesson_date
    ? new Date(lesson.lesson_date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/lessons"
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          Aulas
        </Link>
        <div className="flex items-center gap-3">
          <DeleteLessonButton lessonId={id} />
        </div>
      </div>

      <EditLessonForm lesson={{ id, title: lesson.title, lesson_date: lesson.lesson_date, notes: lesson.notes, roadmap_key: lesson.roadmap_key }} />

      <div className="mb-8">
        {lessonDate && (
          <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-2 uppercase">
            {lessonDate}
          </p>
        )}
        <h1 className="text-3xl font-bold text-white mb-3">{lesson.title}</h1>
        {lesson.roadmap_key && (() => {
          const [level, tema, session] = lesson.roadmap_key.split("||")
          return (
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                {level} › {tema} › {session}
              </span>
            </div>
          )
        })()}
        {lesson.notes && (
          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap bg-[#0f0f0f] border border-white/5 rounded-xl px-4 py-3">
            {lesson.notes}
          </p>
        )}
      </div>

      <div className="border-t border-white/5 pt-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">
            Palavras & Expressões
            {items && items.length > 0 && (
              <span className="ml-2 text-gray-700 font-normal tracking-normal normal-case">
                ({items.length})
              </span>
            )}
          </h2>
        </div>

        {items && items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={{ id: item.id, lesson_id: id, term: item.term, translation: item.translation, type: item.type, context: item.context, phonetic: item.phonetic ?? null, my_sentence: item.my_sentence ?? null }}
              />
            ))}
          </div>
        )}

        <div className="space-y-2">
          <AddItemForm lessonId={id} />
          <TranscriptExtractor lessonId={id} />
        </div>
      </div>
    </div>
  )
}
