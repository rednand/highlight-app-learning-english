import { createClient } from "../../../utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Circle, Trophy } from "lucide-react"
import quizData from "../../../../data/grammar-quiz.json"

type QuizEntry = { slug: string; questions: { q: string; options: string[]; answer: number; tip: string }[] }

const RULE_TITLES: Record<string, string> = {
  "simple-present": "Simple Present",
  "present-continuous": "Present Continuous",
  "simple-past": "Simple Past",
  "past-continuous": "Past Continuous",
  "present-perfect": "Present Perfect",
  "present-perfect-continuous": "Present Perfect Continuous",
  "past-perfect": "Past Perfect",
  "simple-future-will": "Future with Will",
  "future-going-to": "Future with Going To",
  "future-continuous": "Future Continuous",
  "future-perfect": "Future Perfect",
  "zero-conditional": "Zero Conditional",
  "first-conditional": "First Conditional",
  "second-conditional": "Second Conditional",
  "third-conditional": "Third Conditional",
  "mixed-conditional": "Mixed Conditional",
  "passive-voice": "Passive Voice",
  "reported-speech": "Reported Speech",
  "modal-verbs": "Modal Verbs",
  "articles": "Articles",
  "prepositions-time": "Prepositions of Time",
  "prepositions-place": "Prepositions of Place",
  "gerund-vs-infinitive": "Gerund vs Infinitive",
  "relative-clauses": "Relative Clauses",
  "comparatives-superlatives": "Comparatives & Superlatives",
  "question-formation": "Question Formation",
  "countable-uncountable": "Countable & Uncountable",
  "phrasal-verbs": "Phrasal Verbs",
  "subject-verb-agreement": "Subject-Verb Agreement",
  "used-to": "Used To",
  "wish-if-only": "Wish / If Only",
}

export default async function QuizListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: progress } = await supabase
    .from("grammar_progress")
    .select("rule_slug, correct, total")
    .eq("user_id", user.id)

  const progressMap = Object.fromEntries(
    (progress ?? []).map((p) => [p.rule_slug, p])
  )

  const completed = (progress ?? []).filter((p) => p.correct === p.total).length
  const total = (quizData as QuizEntry[]).length

  return (
    <div className="p-4 md:p-8">
      <Link
        href="/grammar"
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Gramática
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">GRAMÁTICA</p>
          <h1 className="text-2xl font-bold text-white">Quiz</h1>
          <p className="text-gray-500 text-sm mt-1">{completed}/{total} tópicos concluídos</p>
        </div>
        {completed === total && total > 0 && (
          <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-3">
            <Trophy size={16} className="text-yellow-400" />
            <span className="text-yellow-400 text-sm font-bold">Tudo concluído!</span>
          </div>
        )}
      </div>

      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${total > 0 ? Math.round((completed / total) * 100) : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(quizData as QuizEntry[]).map((entry) => {
          const p = progressMap[entry.slug]
          const isDone = p && p.correct === p.total
          const isAttempted = !!p

          return (
            <Link
              key={entry.slug}
              href={`/grammar/quiz/${entry.slug}`}
              className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
                isDone
                  ? "bg-yellow-400/5 border-yellow-400/20 hover:border-yellow-400/40"
                  : "bg-[#0f0f0f] border-white/5 hover:border-yellow-400/20"
              }`}
            >
              {isDone ? (
                <CheckCircle size={18} className="text-yellow-400 shrink-0" />
              ) : (
                <Circle size={18} className="text-gray-700 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate transition-colors ${isDone ? "text-yellow-400" : "text-white group-hover:text-yellow-400"}`}>
                  {RULE_TITLES[entry.slug] ?? entry.slug}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {entry.questions.length} {entry.questions.length === 1 ? "questão" : "questões"}
                  {isAttempted && !isDone && ` · ${p.correct}/${p.total} corretas`}
                  {isDone && " · Concluído ✓"}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
