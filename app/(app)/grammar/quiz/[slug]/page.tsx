import { createClient } from "../../../../utils/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import quizData from "../../../../../data/grammar-quiz.json"
import QuizClient from "./quiz-client"

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

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = (quizData as QuizEntry[]).find((q) => q.slug === slug)
  if (!entry) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: prev } = await supabase
    .from("grammar_progress")
    .select("correct, total")
    .eq("user_id", user.id)
    .eq("rule_slug", slug)
    .single()

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <Link
        href="/grammar/quiz"
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Quiz
      </Link>

      <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">QUIZ</p>
      <h1 className="text-2xl font-bold text-white mb-8">{RULE_TITLES[slug] ?? slug}</h1>

      <QuizClient
        slug={slug}
        title={RULE_TITLES[slug] ?? slug}
        questions={entry.questions}
        previousBest={prev ?? null}
      />
    </div>
  )
}
