"use client"

import { useState } from "react"
import Link from "next/link"
import type { GrammarRule } from "./types"

const CATEGORY_LABELS: Record<string, string> = {
  tenses: "Tempos Verbais",
  conditionals: "Condicionais",
  "passive-voice": "Voz Passiva",
  "reported-speech": "Discurso Indireto",
  modals: "Verbos Modais",
  articles: "Artigos",
  prepositions: "Preposições",
  "gerund-infinitive": "Gerúndio & Infinitivo",
  "relative-clauses": "Orações Relativas",
  adjectives: "Adjetivos",
  questions: "Perguntas",
  nouns: "Substantivos",
  "phrasal-verbs": "Phrasal Verbs",
  "grammar-basics": "Básico",
}

function levelColor(level: string) {
  if (level.startsWith("A")) return "bg-green-400/10 text-green-400 border-green-400/20"
  if (level.startsWith("B")) return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
  return "bg-orange-400/10 text-orange-400 border-orange-400/20"
}

export default function GrammarList({ rules }: { rules: GrammarRule[] }) {
  const categories = ["all", ...Array.from(new Set(rules.map((r) => r.category)))]
  const [active, setActive] = useState("all")

  const filtered = active === "all" ? rules : rules.filter((r) => r.category === active)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">HIGHLIGHT</p>
          <h1 className="text-2xl font-bold text-white">Gramática</h1>
          <p className="text-gray-500 text-sm mt-1">{rules.length} regras · clique para ver detalhes</p>
        </div>
        <Link
          href="/grammar/quiz"
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-4 py-2 rounded-full transition-colors shrink-0"
        >
          Fazer Quiz
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
              active === cat
                ? "bg-yellow-400 text-black border-yellow-400"
                : "bg-transparent text-gray-500 border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            {cat === "all" ? "Todos" : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((rule) => (
          <Link
            key={rule.slug}
            href={`/grammar/${rule.slug}`}
            className="group bg-[#0f0f0f] border border-white/5 rounded-xl p-4 hover:border-yellow-400/20 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors leading-snug">
                {rule.title}
              </h2>
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${levelColor(rule.level)}`}>
                {rule.level}
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-wider text-gray-600 uppercase mb-2">
              {CATEGORY_LABELS[rule.category] ?? rule.category}
            </p>
            {rule.structure && (
              <p className="text-xs text-gray-500 font-mono truncate">{rule.structure}</p>
            )}
            {rule.usage && rule.usage.length > 0 && (
              <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{rule.usage[0]}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
