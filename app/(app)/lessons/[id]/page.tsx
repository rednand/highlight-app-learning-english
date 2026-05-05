import { createClient } from "../../../utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import AddItemForm from "./add-item-form"
import { DeleteLessonButton, DeleteItemButton } from "./delete-buttons"

const TYPE_LABEL: Record<string, string> = {
  word: "Palavra",
  expression: "Expressão",
  phrase: "Frase",
}

const TYPE_COLOR: Record<string, string> = {
  word: "text-blue-400 bg-blue-400/10",
  expression: "text-purple-400 bg-purple-400/10",
  phrase: "text-green-400 bg-green-400/10",
}

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
        <DeleteLessonButton lessonId={id} />
      </div>

      <div className="mb-8">
        {lessonDate && (
          <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-400 mb-2 uppercase">
            {lessonDate}
          </p>
        )}
        <h1 className="text-3xl font-bold text-white mb-3">{lesson.title}</h1>
        {lesson.notes && (
          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap bg-[#111] border border-white/5 rounded-xl px-4 py-3">
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
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 bg-[#111] border border-white/5 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{item.term}</p>
                  {item.translation && (
                    <p className="text-gray-500 text-xs mt-0.5">{item.translation}</p>
                  )}
                  {item.context && (
                    <p className="text-gray-600 text-xs mt-1.5 italic">&ldquo;{item.context}&rdquo;</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      TYPE_COLOR[item.type] ?? TYPE_COLOR.word
                    }`}
                  >
                    {TYPE_LABEL[item.type] ?? item.type}
                  </span>
                  <DeleteItemButton itemId={item.id} lessonId={id} />
                </div>
              </div>
            ))}
          </div>
        )}

        <AddItemForm lessonId={id} />
      </div>
    </div>
  )
}
