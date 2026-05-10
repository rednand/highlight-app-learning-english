"use client"

import { fetchFlashcards, updateFlashcard } from "../../actions/review"
import { useState, useEffect, useCallback } from "react"
import { ArrowRight, BookOpen, Play, Zap, CheckCircle, Film, Tv, Music } from "lucide-react"
import Image from "next/image"
import SpeakButton from "../speak-button"

type MediaContext = {
  title: string
  tmdb_poster_path: string | null
  tmdb_type: string | null
  tmdb_season: number | null
  source_type: string | null
  music_thumbnail_url: string | null
  music_artist: string | null
}

type Flashcard = {
  id: string
  front: string
  back: string
  ease_factor: number
  interval_days: number
  next_review_at: string
  lesson_items: {
    phonetic: string | null
    my_sentence: string | null
    context: string | null
    lessons: MediaContext | null
  }[] | null
}

type Lesson = { id: string; title: string; source_type: string | null }

type LessonStat = {
  totalCount: number
  dueCount: number
  minNextReview: string | null
  dominio: number
}

type Grade = 0 | 1 | 2 | 3 | 4 | 5

function sm2(card: Flashcard, grade: Grade): Pick<Flashcard, "ease_factor" | "interval_days" | "next_review_at"> {
  let { ease_factor, interval_days } = card
  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  if (grade < 3) {
    interval_days = 1
  } else {
    interval_days = interval_days === 1 ? 6 : Math.round(interval_days * ease_factor)
  }
  const next = new Date()
  next.setDate(next.getDate() + interval_days)
  return {
    ease_factor: parseFloat(ease_factor.toFixed(2)),
    interval_days,
    next_review_at: next.toISOString(),
  }
}

const GRADES = [
  { grade: 1 as Grade, label: "Não lembro", color: "text-red-400 border-red-400/20 bg-red-400/5 hover:bg-red-400/15 hover:border-red-400/40" },
  { grade: 3 as Grade, label: "Quase", color: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5 hover:bg-yellow-400/15 hover:border-yellow-400/40" },
  { grade: 5 as Grade, label: "Fácil", color: "text-green-400 border-green-400/20 bg-green-400/5 hover:bg-green-400/15 hover:border-green-400/40" },
]

const CINEMA_GRADES = [
  { grade: 1 as Grade, label: "Não lembro", color: "text-red-400 border-red-400/20 bg-red-400/5 hover:bg-red-400/15 hover:border-red-400/40" },
  { grade: 3 as Grade, label: "Quase", color: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5 hover:bg-yellow-400/15 hover:border-yellow-400/40" },
  { grade: 5 as Grade, label: "Lembrei!", color: "text-green-400 border-green-400/20 bg-green-400/5 hover:bg-green-400/15 hover:border-green-400/40" },
]

function formatNextReview(dateStr: string | null): string {
  if (!dateStr) return "—"
  const now = new Date()
  const next = new Date(dateStr)
  if (next <= now) return "Agora"
  const diffMs = next.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 1) return "Amanhã"
  return `Em ${diffDays} dias`
}

function urgencyLabel(stat: LessonStat | undefined): { label: string; color: string } | null {
  if (!stat) return null
  if (stat.dueCount > 0) return { label: "Urgente", color: "bg-red-500/20 text-red-400" }
  if (!stat.minNextReview) return null
  const diffMs = new Date(stat.minNextReview).getTime() - Date.now()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 2) return { label: "Moderado", color: "bg-yellow-500/20 text-yellow-400" }
  return { label: "Tranquilo", color: "bg-green-500/20 text-green-400" }
}

type FilterTab = "todas" | "urgentes" | "concluidas"

export default function ReviewClient({
  lessons,
  totalDue,
  totalFlashcards,
  avgDominio,
  lessonStats,
  cinemaTotal,
}: {
  lessons: Lesson[]
  totalDue: number
  totalFlashcards: number
  avgDominio: number
  lessonStats: Record<string, LessonStat>
  cinemaTotal: number
}) {
  const [step, setStep] = useState<"filter" | "review">("filter")
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [tab, setTab] = useState<FilterTab>("todas")
  const [streak, setStreak] = useState(0)
  const [cardMode, setCardMode] = useState<"standard" | "cinema">("standard")

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem("hl_streak")
        if (raw) {
          const { days, lastDate } = JSON.parse(raw) as { days: number; lastDate: string }
          const today = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86400000).toDateString()
          if (lastDate === today || lastDate === yesterday) setStreak(days)
        }
      } catch {
        //
      }
    }, 0)
    return () => clearTimeout(id)
  }, [])

  function startReview(lessonId: string | null) {
    setCardMode("standard")
    setSelectedLesson(lessonId)
    setLoading(true)
    fetchFlashcards(lessonId ?? undefined).then(({ cards: fetched }) => {
      setCards((fetched ?? []) as unknown as Flashcard[])
      setLoading(false)
      setStep("review")
      setIndex(0)
      setFlipped(false)
      setDone(false)
      setReviewed(0)
    })
  }

  function startCinema() {
    setCardMode("cinema")
    setSelectedLesson(null)
    setLoading(true)
    fetchFlashcards(undefined, true).then(({ cards: fetched }) => {
      const all = (fetched ?? []) as unknown as Flashcard[]
      const filtered = all.filter((c) => {
        const st = c.lesson_items?.[0]?.lessons?.source_type
        return st === "movie" || st === "music"
      })
      setCards(filtered)
      setLoading(false)
      setStep("review")
      setIndex(0)
      setFlipped(false)
      setDone(false)
      setReviewed(0)
    })
  }

  const handleGrade = useCallback(
    async (grade: Grade) => {
      const card = cards[index]
      const update = sm2(card, grade)
      await updateFlashcard(card.id, update)
      setReviewed((r) => r + 1)
      if (index + 1 >= cards.length) {
        setDone(true)
        try {
          const today = new Date().toDateString()
          const raw = localStorage.getItem("hl_streak")
          if (raw) {
            const { days, lastDate } = JSON.parse(raw) as { days: number; lastDate: string }
            const yesterday = new Date(Date.now() - 86400000).toDateString()
            if (lastDate === today) {
              // already counted today
            } else if (lastDate === yesterday) {
              const next = { days: days + 1, lastDate: today }
              localStorage.setItem("hl_streak", JSON.stringify(next))
              setStreak(next.days)
            } else {
              localStorage.setItem("hl_streak", JSON.stringify({ days: 1, lastDate: today }))
              setStreak(1)
            }
          } else {
            localStorage.setItem("hl_streak", JSON.stringify({ days: 1, lastDate: today }))
            setStreak(1)
          }
        } catch {
          //
        }
      } else {
        setFlipped(false)
        setIndex((i) => i + 1)
      }
    },
    [cards, index],
  )

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (step !== "review") return
      if (e.code === "Space") {
        e.preventDefault()
        if (!flipped) setFlipped(true)
      }
      if (flipped) {
        if (e.code === "Digit1") handleGrade(1)
        if (e.code === "Digit2") handleGrade(3)
        if (e.code === "Digit3") handleGrade(5)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [flipped, step, handleGrade])

  if (step === "filter") {
    const lessonsWithCards = lessons.filter((l) => lessonStats[l.id])
    const filteredLessons = lessonsWithCards.filter((l) => {
      const stat = lessonStats[l.id]
      if (tab === "urgentes") return stat?.dueCount > 0
      if (tab === "concluidas") return stat?.dueCount === 0
      return true
    })

    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Zap size={15} className="text-yellow-400" />, value: totalDue, label: "Para revisar" },
            { icon: <BookOpen size={15} className="text-yellow-400" />, value: totalFlashcards, label: "Total flashcards" },
            { icon: <CheckCircle size={15} className="text-green-400" />, value: `${avgDominio}%`, label: "Domínio médio" },
            { icon: <span className="text-base leading-none">🔥</span>, value: streak, label: "Dias seguidos" },
          ].map(({ icon, value, label }) => (
            <div key={label} className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">{icon}</div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {totalDue > 0 && (
          <button
            onClick={() => startReview(null)}
            className="w-full flex items-center justify-between gap-3 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl hover:bg-yellow-400/15 transition-colors mb-6"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                <Play size={16} className="text-black fill-black" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-white text-sm font-semibold">Revisão Rápida</p>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{totalDue} palavras aguardando revisão</p>
              </div>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 bg-yellow-400 text-black text-sm font-bold px-4 py-2 rounded-full shrink-0">
              Começar <ArrowRight size={14} />
            </span>
            <ArrowRight size={18} className="sm:hidden text-yellow-400 shrink-0" />
          </button>
        )}

        {cinemaTotal > 0 && (
          <button
            onClick={startCinema}
            className="w-full flex items-center justify-between gap-3 p-4 bg-[#0f0f0f] border border-white/5 rounded-xl hover:border-white/10 transition-colors mb-6"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Film size={16} className="text-blue-400" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-white text-sm font-semibold">Modo Cinema</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {cinemaTotal} {cinemaTotal === 1 ? "palavra" : "palavras"} de filmes & músicas
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-600 shrink-0" />
          </button>
        )}

        <div className="flex gap-1 mb-4">
          {(["todas", "urgentes", "concluidas"] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors capitalize ${
                tab === t
                  ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                  : "text-gray-500 border-white/10 hover:text-white hover:border-white/20"
              }`}
            >
              {t === "todas" ? "Todas" : t === "urgentes" ? "Urgentes" : "Concluídas"}
            </button>
          ))}
        </div>

        {lessonsWithCards.length > 0 && (
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-3">Por aula</p>
        )}

        <div className="space-y-2">
          {filteredLessons.map((lesson) => {
            const stat = lessonStats[lesson.id]
            const urgency = urgencyLabel(stat)
            const next = formatNextReview(stat?.minNextReview ?? null)
            return (
              <div
                key={lesson.id}
                className="flex items-center gap-3 p-3 sm:p-4 bg-[#0f0f0f] border border-white/5 rounded-xl"
              >
                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-yellow-400/10 items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 min-w-0">
                    <span className="text-white text-sm font-semibold truncate flex-1 min-w-0">{lesson.title}</span>
                    {urgency && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${urgency.color}`}>
                        {urgency.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {stat?.totalCount ?? 0} palavras&nbsp; · &nbsp;Próxima: {next}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-24">
                  <span className="text-xs text-gray-400 font-semibold">{stat?.dominio ?? 0}%</span>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${stat?.dominio ?? 0}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-600">domínio</span>
                </div>
                <button
                  onClick={() => startReview(lesson.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full transition-colors shrink-0"
                >
                  <Play size={11} />
                  Revisar
                </button>
              </div>
            )
          })}
          {filteredLessons.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">
              {tab === "urgentes" ? "Nenhuma aula urgente. Tudo em dia!" : "Nenhuma aula concluída ainda."}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🎉</p>
        <p className="text-white font-semibold text-lg mb-2">Nada para revisar!</p>
        <p className="text-gray-500 text-sm">Todos os flashcards estão em dia.</p>
        <button
          onClick={() => setStep("filter")}
          className="inline-flex items-center gap-2 mt-6 text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
        >
          Voltar ao filtro <ArrowRight size={14} />
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">✅</p>
        <p className="text-white font-semibold text-lg mb-2">Sessão concluída!</p>
        <p className="text-gray-500 text-sm">
          Você revisou <strong className="text-white">{reviewed}</strong> flashcard{reviewed !== 1 ? "s" : ""}.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => startReview(selectedLesson)}
            className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 hover:border-white/20 px-4 py-2 rounded-full"
          >
            Revisar novamente
          </button>
          <button
            onClick={() => setStep("filter")}
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
          >
            Voltar <ArrowRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  const card = cards[index]
  const progress = Math.round((index / cards.length) * 100)
  const phonetic = card.lesson_items?.[0]?.phonetic
  const mySentence = card.lesson_items?.[0]?.my_sentence
  const context = card.lesson_items?.[0]?.context
  const media = card.lesson_items?.[0]?.lessons ?? null
  const isMusic = media?.source_type === "music"
  const activeGrades = cardMode === "cinema" ? CINEMA_GRADES : GRADES

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep("filter")} className="text-xs text-gray-600 hover:text-white transition-colors shrink-0">
          ← filtro
        </button>
        <span className="text-xs text-gray-500 tabular-nums">{index + 1}/{cards.length}</span>
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 mb-4">
        <div className="text-center mb-6">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: cardMode === "cinema" ? "#60a5fa99" : undefined }}>
            {cardMode === "cinema"
              ? (isMusic ? "Em que música você ouviu?" : "Em que filme / série você ouviu?")
              : "inglês"}
          </span>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-3xl font-semibold text-white leading-snug">{card.front}</p>
            <SpeakButton text={card.front} className="text-gray-600 hover:text-yellow-400 transition-colors mt-1" />
          </div>
          {phonetic && <p className="text-gray-600 text-sm mt-1 font-mono">{phonetic}</p>}
          {cardMode === "cinema" && context && (
            <div className="mt-4 bg-white/5 rounded-xl px-4 py-3 text-left">
              <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-1">Exemplo</p>
              <p className="text-gray-300 text-sm italic">&ldquo;{context}&rdquo;</p>
            </div>
          )}
        </div>

        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            className="flex items-center gap-2 mx-auto text-sm text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-full transition-colors"
          >
            Ver resposta
            <kbd className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">espaço</kbd>
          </button>
        ) : cardMode === "cinema" ? (
          <>
            <div className="h-px bg-white/5 my-6" />
            <div className="text-center space-y-4">
              {isMusic ? (
                <>
                  {media?.music_thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.music_thumbnail_url} alt={media.title} className="w-24 h-24 rounded-xl object-cover mx-auto" />
                  ) : (
                    <div className="w-24 h-24 bg-white/5 rounded-xl flex items-center justify-center mx-auto">
                      <Music size={28} className="text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-white text-xl font-semibold">{media?.title}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <Music size={11} className="text-gray-500" />
                      <p className="text-gray-500 text-sm">{media?.music_artist}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {media?.tmdb_poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${media.tmdb_poster_path}`}
                      alt={media?.title ?? ""}
                      width={80}
                      height={120}
                      className="rounded-xl object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-28 bg-white/5 rounded-xl flex items-center justify-center mx-auto">
                      {media?.tmdb_type === "tv"
                        ? <Tv size={24} className="text-gray-600" />
                        : <Film size={24} className="text-gray-600" />}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-xl font-semibold">{media?.title ?? "—"}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      {media?.tmdb_type === "movie"
                        ? <Film size={11} className="text-gray-500" />
                        : <Tv size={11} className="text-gray-500" />}
                      <p className="text-gray-500 text-sm">
                        {media?.tmdb_type === "movie" ? "Filme" : "Série"}
                        {media?.tmdb_season ? ` · T${media.tmdb_season}` : ""}
                      </p>
                    </div>
                  </div>
                </>
              )}
              <div className="mt-2 pt-4 border-t border-white/5">
                <p className="text-gray-600 text-[10px] uppercase font-bold tracking-wider">Tradução</p>
                <p className="text-white text-lg mt-1">{card.back}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="h-px bg-white/5 my-6" />
            <div className="text-center space-y-3">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">português</span>
              <p className="text-2xl font-semibold text-white">{card.back}</p>
              {mySentence && (
                <div className="mt-3 bg-white/5 rounded-xl px-4 py-3 text-left">
                  <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-1">Minha frase</p>
                  <p className="text-gray-300 text-sm italic">&ldquo;{mySentence}&rdquo;</p>
                </div>
              )}
              {media?.tmdb_poster_path && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3">
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${media.tmdb_poster_path}`}
                    alt={media.title}
                    width={24}
                    height={36}
                    className="rounded object-cover shrink-0"
                  />
                  <div className="flex items-center gap-1.5 min-w-0">
                    {media.tmdb_type === "movie"
                      ? <Film size={10} className="text-gray-600 shrink-0" />
                      : <Tv size={10} className="text-gray-600 shrink-0" />}
                    <p className="text-[11px] text-gray-500 truncate">
                      {media.title}
                      {media.tmdb_type === "tv" && media.tmdb_season ? ` T${media.tmdb_season}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-3 gap-3">
          {activeGrades.map(({ grade, label, color }, i) => (
            <button
              key={grade}
              onClick={() => handleGrade(grade)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${color}`}
            >
              {label}
              <kbd className="text-[9px] opacity-40">{i + 1}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
