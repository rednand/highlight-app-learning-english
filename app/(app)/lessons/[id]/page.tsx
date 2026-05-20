import { createClient } from "../../../utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Film, Tv, Music, BookMarked } from "lucide-react"
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
          href={lesson.source_type === "movie" ? "/movies" : lesson.source_type === "music" ? "/music" : lesson.source_type === "book" ? "/books" : "/lessons"}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          {lesson.source_type === "movie" ? "Filmes & Séries" : lesson.source_type === "music" ? "Música" : lesson.source_type === "book" ? "Livros" : "Aulas"}
        </Link>
        <div className="flex items-center gap-3">
          <DeleteLessonButton lessonId={id} />
        </div>
      </div>

      <EditLessonForm lesson={{ id, title: lesson.title, lesson_date: lesson.lesson_date, notes: lesson.notes, roadmap_key: lesson.roadmap_key }} />

      {lesson.source_type === "music" && lesson.music_artist && (
        <div className="flex items-center gap-4 p-3 bg-[#0f0f0f] border border-white/5 rounded-xl mb-6">
          {lesson.music_thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lesson.music_thumbnail_url} alt={lesson.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <Music size={18} className="text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{lesson.title}</p>
            <p className="text-gray-500 text-xs mt-0.5 truncate">{lesson.music_artist}</p>
          </div>
        </div>
      )}

      {lesson.source_type === "book" && lesson.book_author && (
        <div className="flex items-center gap-4 p-3 bg-[#0f0f0f] border border-white/5 rounded-xl mb-6">
          {lesson.book_cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lesson.book_cover_url} alt={lesson.title} className="w-10 h-14 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-14 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <BookMarked size={18} className="text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{lesson.title}</p>
            <p className="text-gray-500 text-xs mt-0.5 truncate">{lesson.book_author}</p>
          </div>
        </div>
      )}

      {lesson.tmdb_poster_path && (
        <div className="flex items-center gap-4 p-3 bg-[#0f0f0f] border border-white/5 rounded-xl mb-6">
          <Image
            src={`https://image.tmdb.org/t/p/w92${lesson.tmdb_poster_path}`}
            alt={lesson.title}
            width={40}
            height={60}
            className="rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{lesson.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {lesson.tmdb_type === "movie"
                ? <Film size={11} className="text-gray-500" />
                : <Tv size={11} className="text-gray-500" />}
              <p className="text-gray-500 text-xs">
                {lesson.tmdb_type === "movie" ? "Filme" : "Série"}
                {lesson.tmdb_season ? ` · Temporada ${lesson.tmdb_season}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

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
