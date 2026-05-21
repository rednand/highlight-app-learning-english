"use client"

import {
  fetchFlashcards,
  fetchDistractorPool,
  fetchFallbackDistractors,
  updateFlashcard,
  updateStreak,
} from "../../actions/review"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, Play, Zap, CheckCircle, Film, Tv, Music, SkipForward } from "lucide-react"
import Image from "next/image"
import SpeakButton from "../speak-button"
import { sm2, buildMultipleChoiceOptions, formatNextReview, urgencyLabel } from "../../lib/review-utils"
import type { Grade, LessonStat, ChoiceOption, SelectionState } from "../../lib/review-utils"
import MultipleChoiceOptions from "../../../components/review/multiple-choice-options"

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
  } | null
}

type MultipleChoiceCard = Flashcard & {
  options: ChoiceOption[]
}

type Lesson = { id: string; title: string; source_type: string | null }

type FilterTab = "todas" | "urgentes" | "concluidas"

const ADVANCE_DELAY_MS = 1500

export default function ReviewClient({
  lessons,
  totalDue,
  totalFlashcards,
  avgDominio,
  lessonStats,
  cinemaTotal,
  initialStreak,
}: {
  lessons: Lesson[]
  totalDue: number
  totalFlashcards: number
  avgDominio: number
  lessonStats: Record<string, LessonStat>
  cinemaTotal: number
  initialStreak: number
}) {
  const router = useRouter()
  const [step, setStep] = useState<"filter" | "review">("filter")
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [cards, setCards] = useState<MultipleChoiceCard[]>([])
  const [index, setIndex] = useState(0)
  const [selection, setSelection] = useState<SelectionState>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [tab, setTab] = useState<FilterTab>("todas")
  const [streak, setStreak] = useState(initialStreak)
  const [cardMode, setCardMode] = useState<"standard" | "cinema">("standard")
  const [insufficientPool, setInsufficientPool] = useState(false)
  const skipMapRef = useRef<Map<string, number>>(new Map())
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function buildCards(fetched: Flashcard[]): Promise<MultipleChoiceCard[]> {
    let pool = await fetchDistractorPool()
    if (pool.length < 3) {
      const fallback = await fetchFallbackDistractors()
      pool = [...new Set([...pool, ...fallback])]
    }
    if (pool.length < 3) {
      setInsufficientPool(true)
      return []
    }
    return fetched.map((card) => ({
      ...card,
      options: buildMultipleChoiceOptions(card.back, pool.filter((t) => t !== card.back)),
    }))
  }

  function resetReviewState() {
    setIndex(0)
    setSelection(null)
    setDone(false)
    setReviewed(0)
    skipMapRef.current = new Map()
  }

  function startReview(lessonId: string | null) {
    setCardMode("standard")
    setSelectedLesson(lessonId)
    setLoading(true)
    fetchFlashcards(lessonId ?? undefined).then(async ({ cards: fetched }) => {
      const built = await buildCards((fetched ?? []) as unknown as Flashcard[])
      setCards(built)
      setLoading(false)
      setStep("review")
      resetReviewState()
    })
  }

  function startCinema() {
    setCardMode("cinema")
    setSelectedLesson(null)
    setLoading(true)
    fetchFlashcards(undefined).then(async ({ cards: fetched }) => {
      const all = (fetched ?? []) as unknown as Flashcard[]
      const filtered = all.filter((c) => {
        const st = c.lesson_items?.lessons?.source_type
        return st === "movie" || st === "music"
      })
      const built = await buildCards(filtered)
      setCards(built)
      setLoading(false)
      setStep("review")
      resetReviewState()
    })
  }

  const advance = useCallback(
    async (card: MultipleChoiceCard, isCorrect: boolean, currentIndex: number, currentCards: MultipleChoiceCard[]) => {
      const grade: Grade = isCorrect ? 5 : 1
      await updateFlashcard(card.id, sm2(card, grade))
      setReviewed((r) => r + 1)
      if (currentIndex + 1 >= currentCards.length) {
        setDone(true)
        const newStreak = await updateStreak()
        setStreak(newStreak)
      } else {
        setSelection(null)
        setIndex((i) => i + 1)
      }
    },
    [],
  )

  const handleSelect = useCallback(
    (label: "A" | "B" | "C" | "D") => {
      const card = cards[index]
      const chosen = card.options.find((o) => o.label === label)
      if (!chosen) return
      const sel: SelectionState = { selectedLabel: label, isCorrect: chosen.isCorrect }
      setSelection(sel)
      advanceTimerRef.current = setTimeout(() => {
        advance(card, chosen.isCorrect, index, cards)
      }, ADVANCE_DELAY_MS)
    },
    [cards, index, advance],
  )

  const handleSkip = useCallback(() => {
    if (advanceTimerRef.current) return
    const card = cards[index]
    const skipCount = skipMapRef.current.get(card.id) ?? 0
    if (skipCount >= 1) {
      if (index + 1 >= cards.length) {
        setDone(true)
        updateStreak().then(setStreak)
      } else {
        setIndex((i) => i + 1)
      }
      return
    }
    skipMapRef.current.set(card.id, 1)
    setCards((prev) => [...prev, card])
    setIndex((i) => i + 1)
  }, [cards, index])

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (step !== "review" || done) return
      if (selection !== null) return
      if (e.code === "Digit1") { e.preventDefault(); handleSelect("A") }
      if (e.code === "Digit2") { e.preventDefault(); handleSelect("B") }
      if (e.code === "Digit3") { e.preventDefault(); handleSelect("C") }
      if (e.code === "Digit4") { e.preventDefault(); handleSelect("D") }
      if (e.code === "Space") { e.preventDefault(); handleSkip() }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [step, done, selection, handleSelect, handleSkip])

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

  if (insufficientPool) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">📚</p>
        <p className="text-white font-semibold text-lg mb-2">Vocabulário insuficiente</p>
        <p className="text-gray-500 text-sm">
          Adicione mais palavras ao seu vocabulário para ativar a revisão.
        </p>
        <button
          onClick={() => { setInsufficientPool(false); setStep("filter") }}
          className="inline-flex items-center gap-2 mt-6 text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
        >
          Voltar ao filtro <ArrowRight size={14} />
        </button>
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
          onClick={() => { router.refresh(); setStep("filter") }}
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
            onClick={() => { router.refresh(); setStep("filter") }}
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
  const phonetic = card.lesson_items?.phonetic
  const mySentence = card.lesson_items?.my_sentence
  const context = card.lesson_items?.context
  const media = card.lesson_items?.lessons ?? null
  const isMusic = media?.source_type === "music"

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { router.refresh(); setStep("filter") }}
          className="text-xs text-gray-600 hover:text-white transition-colors shrink-0"
        >
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

      <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 mb-3">
        <div className="text-center mb-5">
          <span
            className={`text-[10px] font-bold tracking-[0.2em] uppercase ${cardMode === "cinema" ? "text-blue-400/60" : ""}`}
          >
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

        <div className="h-px bg-white/5 mb-4" />

        <MultipleChoiceOptions options={card.options} selection={selection} onSelect={handleSelect} />

        {selection !== null && cardMode === "standard" && (mySentence || media?.tmdb_poster_path) && (
          <div className="mt-4 pt-4 border-t border-white/5">
            {mySentence && (
              <div className="bg-white/5 rounded-xl px-4 py-3 text-left mb-3">
                <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-1">Minha frase</p>
                <p className="text-gray-300 text-sm italic">&ldquo;{mySentence}&rdquo;</p>
              </div>
            )}
            {media?.tmdb_poster_path && (
              <div className="flex items-center gap-3">
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
        )}

        {selection !== null && cardMode === "cinema" && (
          <div className="mt-4 pt-4 border-t border-white/5 text-center space-y-3">
            {isMusic ? (
              <>
                {media?.music_thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.music_thumbnail_url}
                    alt={media.title}
                    className="w-20 h-20 rounded-xl object-cover mx-auto"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center mx-auto">
                    <Music size={24} className="text-gray-600" />
                  </div>
                )}
                <div>
                  <p className="text-white text-lg font-semibold">{media?.title}</p>
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
                    width={72}
                    height={108}
                    className="rounded-xl object-cover mx-auto"
                  />
                ) : (
                  <div className="w-18 h-24 bg-white/5 rounded-xl flex items-center justify-center mx-auto">
                    {media?.tmdb_type === "tv"
                      ? <Tv size={22} className="text-gray-600" />
                      : <Film size={22} className="text-gray-600" />}
                  </div>
                )}
                <div>
                  <p className="text-white text-lg font-semibold">{media?.title ?? "—"}</p>
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
          </div>
        )}
      </div>

      <button
        onClick={handleSkip}
        disabled={selection !== null}
        className="flex items-center gap-1.5 mx-auto text-xs text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-0 disabled:pointer-events-none"
      >
        <SkipForward size={12} />
        Pular
        <kbd className="text-[9px] bg-white/5 border border-white/10 px-1 py-0.5 rounded">espaço</kbd>
      </button>
    </div>
  )
}
