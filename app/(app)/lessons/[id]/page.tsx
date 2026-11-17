import { createClient } from "../../../utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Film, Tv, Music, BookMarked, RotateCcw } from "lucide-react"
import AddItemForm from "./add-item-form"
import TranscriptExtractor from "./transcript-extractor"
import EditLessonForm from "./edit-lesson-form"
import ItemCard from "./edit-item-form"
import { DeleteLessonButton } from "./delete-buttons"
import WatchSessionToggle from "../../../../components/watch-session-toggle"
import { reviewStateOf } from "../../../lib/words-utils"
import { temaDisplayName } from "../../roadmap/roadmap-data"
import LessonNotes, { type LessonNote } from "./lesson-notes"
import { collectImagePaths, signImageUrls } from "../../../lib/note-images-server"


function reviewLabel(sourceType: string | null, tmdbType: string | null): string {
  if (sourceType === "movie") return tmdbType === "tv" ? "Revisar palavras desta série" : "Revisar palavras deste filme"
  if (sourceType === "music") return "Revisar palavras desta música"
  if (sourceType === "book") return "Revisar palavras deste livro"
  return "Revisar palavras desta aula"
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

  const [{ data: items }, { data: notesData }] = await Promise.all([
    supabase
      .from("lesson_items")
      .select("*, flashcards(discarded_at)")
      .eq("lesson_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("lesson_notes")
      .select("id, content, created_at, updated_at, image_paths")
      .eq("lesson_id", id)
      .order("created_at", { ascending: true }),
  ])
  type NoteRow = Omit<LessonNote, "images"> & { image_paths: string[] | null }
  const noteRows = (notesData ?? []) as NoteRow[]
  const imageUrls = await signImageUrls(supabase, collectImagePaths(noteRows))
  const notes: LessonNote[] = noteRows.map(({ image_paths, ...note }) => ({
    ...note,
    images: (image_paths ?? []).filter((path) => imageUrls[path]).map((path) => ({ path, url: imageUrls[path] })),
  }))

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
          className="flex items-center gap-2 text-fg-subtle hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          {lesson.source_type === "movie" ? "Filmes & Séries" : lesson.source_type === "music" ? "Música" : lesson.source_type === "book" ? "Livros" : "Aulas"}
        </Link>
        <div className="flex items-center gap-3">
          <DeleteLessonButton lessonId={id} />
        </div>
      </div>

      <EditLessonForm lesson={{ id, title: lesson.title, lesson_date: lesson.lesson_date, roadmap_key: lesson.roadmap_key }} />

      {lesson.source_type === "music" && lesson.music_artist && (
        <div className="flex items-center gap-4 p-3 bg-surface border border-line rounded-[18px] mb-6">
          {lesson.music_thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lesson.music_thumbnail_url} alt={lesson.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <Music size={18} className="text-fg-dim" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{lesson.title}</p>
            <p className="text-fg-subtle text-xs mt-0.5 truncate">{lesson.music_artist}</p>
          </div>
        </div>
      )}

      {lesson.source_type === "book" && lesson.book_author && (
        <div className="flex items-center gap-4 p-3 bg-surface border border-line rounded-[18px] mb-6">
          {lesson.book_cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lesson.book_cover_url} alt={lesson.title} className="w-10 h-14 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-14 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <BookMarked size={18} className="text-fg-dim" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{lesson.title}</p>
            <p className="text-fg-subtle text-xs mt-0.5 truncate">{lesson.book_author}</p>
          </div>
        </div>
      )}

      {lesson.tmdb_poster_path && (
        <div className="flex items-center gap-4 p-3 bg-surface border border-line rounded-[18px] mb-6">
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
                ? <Film size={11} className="text-fg-subtle" />
                : <Tv size={11} className="text-fg-subtle" />}
              <p className="text-fg-subtle text-xs">
                {lesson.tmdb_type === "movie" ? "Filme" : "Série"}
                {lesson.tmdb_season ? ` · Temporada ${lesson.tmdb_season}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        {lessonDate && (
          <p className="text-[10px] font-bold tracking-[0.3em] text-brand-strong mb-2 uppercase">
            {lessonDate}
          </p>
        )}
        <h1 className="text-3xl font-bold text-white mb-3">{lesson.title}</h1>
        {lesson.roadmap_key && (() => {
          const [level, tema, session] = lesson.roadmap_key.split("||")
          return (
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
                {level} › {temaDisplayName(level, tema)} › {session}
              </span>
            </div>
          )
        })()}
      </div>

      <LessonNotes lessonId={id} notes={notes} />

      <div className="border-t border-white/5 pt-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold tracking-[0.2em] text-fg-subtle uppercase">
            Palavras & Expressões
            {items && items.length > 0 && (
              <span className="ml-2 text-fg-dim font-normal tracking-normal normal-case">
                ({items.length})
              </span>
            )}
          </h2>
        </div>

        {items && items.some((item) => reviewStateOf(item.flashcards) === "active") && (
          <Link
            href={`/review?lesson=${id}`}
            className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-strong text-black text-sm font-bold py-2.5 rounded-full transition-colors mb-4"
          >
            <RotateCcw size={15} />
            {reviewLabel(lesson.source_type, lesson.tmdb_type)}
          </Link>
        )}

        {items && items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={{ id: item.id, lesson_id: id, term: item.term, translation: item.translation, type: item.type, context: item.context, phonetic: item.phonetic ?? null, my_sentence: item.my_sentence ?? null }}
                reviewState={reviewStateOf(item.flashcards)}
              />
            ))}
          </div>
        )}

        <div className="space-y-2">
          {lesson.source_type === "movie" && <WatchSessionToggle lessonId={id} />}
          <AddItemForm lessonId={id} sourceType={lesson.source_type} />
          <TranscriptExtractor lessonId={id} sourceType={lesson.source_type} />
        </div>
      </div>
    </div>
  )
}
