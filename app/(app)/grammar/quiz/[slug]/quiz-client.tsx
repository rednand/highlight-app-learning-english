"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, ArrowRight, Trophy } from "lucide-react"
import { saveQuizResult } from "../../../../actions/grammar"

type Question = {
  q: string
  options: string[]
  answer: number
  tip: string
}

export default function QuizClient({
  slug,
  title,
  questions,
  previousBest,
}: {
  slug: string
  title: string
  questions: Question[]
  previousBest: { correct: number; total: number } | null
}) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [saving, setSaving] = useState(false)

  const question = questions[current]
  const isAnswered = selected !== null
  const isCorrect = selected === question.answer
  const isFinished = answers.length === questions.length

  const correctCount = answers.filter(Boolean).length

  async function handleFinish(finalAnswers: boolean[]) {
    setSaving(true)
    await saveQuizResult(slug, finalAnswers.filter(Boolean).length, questions.length)
    setSaving(false)
  }

  function handleSelect(idx: number) {
    if (isAnswered) return
    setSelected(idx)
  }

  function handleNext() {
    const newAnswers = [...answers, selected === question.answer]
    setAnswers(newAnswers)
    setSelected(null)

    if (newAnswers.length === questions.length) {
      handleFinish(newAnswers)
    } else {
      setCurrent((c) => c + 1)
    }
  }

  if (isFinished) {
    const score = correctCount
    const pct = Math.round((score / questions.length) * 100)
    const perfect = score === questions.length

    return (
      <div className="text-center py-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${perfect ? "bg-yellow-400/20" : "bg-white/5"}`}>
          <Trophy size={28} className={perfect ? "text-yellow-400" : "text-gray-500"} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {score}/{questions.length} corretas
        </h2>
        <p className="text-gray-500 text-sm mb-2">{pct}% de aproveitamento</p>
        {previousBest && (
          <p className="text-gray-600 text-xs mb-6">
            Melhor anterior: {previousBest.correct}/{previousBest.total}
          </p>
        )}
        {perfect ? (
          <p className="text-yellow-400 text-sm font-bold mb-8">Perfeito! Você domina esse tópico.</p>
        ) : pct >= 66 ? (
          <p className="text-green-400 text-sm mb-8">Bom resultado! Revise os erros para fixar.</p>
        ) : (
          <p className="text-orange-400 text-sm mb-8">Vale revisar a regra e tentar novamente.</p>
        )}

        <div className="space-y-2 text-left mb-8">
          {questions.map((q, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border ${answers[i] ? "bg-green-400/5 border-green-400/10" : "bg-red-400/5 border-red-400/10"}`}
            >
              {answers[i]
                ? <CheckCircle size={15} className="text-green-400 shrink-0 mt-0.5" />
                : <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />}
              <div>
                <p className="text-white text-xs font-semibold">{q.q}</p>
                {!answers[i] && (
                  <p className="text-green-400 text-xs mt-0.5">✓ {q.options[q.answer]}</p>
                )}
                <p className="text-gray-600 text-[10px] mt-0.5 italic">{q.tip}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrent(0)
              setSelected(null)
              setAnswers([])
            }}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm font-bold py-3 rounded-full transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => router.push("/grammar/quiz")}
            disabled={saving}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold py-3 rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Voltar ao quiz"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">
          Questão {current + 1} de {questions.length}
        </p>
        <p className="text-xs text-gray-500">{title}</p>
      </div>

      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${((current) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 mb-4">
        <p className="text-white font-semibold text-base">{question.q}</p>
      </div>

      <div className="space-y-2 mb-6">
        {question.options.map((opt, idx) => {
          let style = "bg-[#0f0f0f] border-white/10 text-gray-300 hover:border-yellow-400/30 hover:text-white"
          if (isAnswered) {
            if (idx === question.answer) {
              style = "bg-green-400/10 border-green-400/30 text-green-400"
            } else if (idx === selected) {
              style = "bg-red-400/10 border-red-400/30 text-red-400"
            } else {
              style = "bg-[#0f0f0f] border-white/5 text-gray-600"
            }
          } else if (idx === selected) {
            style = "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${style}`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {isAnswered && (
        <div className={`flex items-start gap-3 p-4 rounded-xl mb-4 ${isCorrect ? "bg-green-400/10 border border-green-400/20" : "bg-red-400/10 border border-red-400/20"}`}>
          {isCorrect
            ? <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
            : <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />}
          <div>
            <p className={`text-sm font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
              {isCorrect ? "Correto!" : "Errado!"}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">{question.tip}</p>
          </div>
        </div>
      )}

      {isAnswered && (
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-full transition-colors text-sm"
        >
          {current + 1 === questions.length ? "Ver resultado" : "Próxima"}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  )
}
