"use client"

import { fetchFlashcards, updateFlashcard } from "../../actions/review"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import SpeakButton from "../speak-button"

type Flashcard = {
  id: string
  front: string
  back: string
  ease_factor: number
  interval_days: number
  next_review_at: string
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

export default function ReviewClient() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  useEffect(() => {
    fetchFlashcards().then(({ cards }) => {
      setCards(cards ?? [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
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
  }, [flipped, index])

  const handleGrade = useCallback(
    async (grade: Grade) => {
      const card = cards[index]
      const update = sm2(card, grade)
      await updateFlashcard(card.id, update)
      setReviewed((r) => r + 1)
      if (index + 1 >= cards.length) {
        setDone(true)
      } else {
        setFlipped(false)
        setIndex((i) => i + 1)
      }
    },
    [cards, index],
  )

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
        <p className="text-white font-semibold text-lg mb-2">Nada para revisar hoje!</p>
        <p className="text-gray-500 text-sm">Você está em dia com todos os flashcards.</p>
        <Link href="/" className="inline-flex items-center gap-2 mt-6 text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
          Voltar ao início <ArrowRight size={14} />
        </Link>
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
            onClick={() => { setDone(false); setIndex(0); setFlipped(false); setReviewed(0) }}
            className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 hover:border-white/20 px-4 py-2 rounded-full"
          >
            Revisar novamente
          </button>
          <Link href="/" className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
            Início <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const card = cards[index]
  const progress = Math.round((index / cards.length) * 100)

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-gray-500 tabular-nums">{index + 1}/{cards.length}</span>
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-2xl p-8 mb-4">
        <div className="text-center mb-6">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">inglês</span>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-3xl font-semibold text-white leading-snug">{card.front}</p>
            <SpeakButton text={card.front} className="text-gray-600 hover:text-yellow-400 transition-colors mt-1" />
          </div>
        </div>

        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            className="flex items-center gap-2 mx-auto text-sm text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-full transition-colors"
          >
            Ver tradução
            <kbd className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">espaço</kbd>
          </button>
        ) : (
          <>
            <div className="h-px bg-white/5 my-6" />
            <div className="text-center">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">português</span>
              <p className="text-2xl font-semibold text-white mt-2">{card.back}</p>
            </div>
          </>
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-3 gap-3">
          {GRADES.map(({ grade, label, color }, i) => {
            return (
              <button
                key={grade}
                onClick={() => handleGrade(grade)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${color}`}
              >
                {label}
                <kbd className="text-[9px] opacity-40">{i + 1}</kbd>
              </button>
            )
          })}
        </div>
      )}

    </div>
  )
}
