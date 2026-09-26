"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Sparkles, Eye, RefreshCw, Shuffle, Save } from "lucide-react"
import { generatePracticeText, savePracticeAttempt, type PracticeText } from "../../../actions/practice"
import type { GrammarRule } from "../types"

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

type Direction = "en-pt" | "pt-en"

export default function PracticeClient({ rules }: { rules: GrammarRule[] }) {
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
  const [direction, setDirection] = useState<Direction>("en-pt")
  const [activeRule, setActiveRule] = useState<GrammarRule | null>(null)
  const [practice, setPractice] = useState<PracticeText | null>(null)
  const [myTranslation, setMyTranslation] = useState("")
  const [showReference, setShowReference] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  const promptText = practice ? (direction === "en-pt" ? practice.text : practice.reference_translation) : ""
  const referenceText = practice ? (direction === "en-pt" ? practice.reference_translation : practice.text) : ""
  const promptLabel = direction === "en-pt" ? "Texto em inglês" : "Texto em português"
  const targetLanguage = direction === "en-pt" ? "português" : "inglês"

  const categories = Array.from(new Set(rules.map((r) => r.category)))
  const selectedRules = rules.filter((r) => selectedSlugs.has(r.slug))

  function toggleRule(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  function toggleCategory(category: string, allSelected: boolean) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      const slugsInCategory = rules.filter((r) => r.category === category).map((r) => r.slug)
      slugsInCategory.forEach((slug) => allSelected ? next.delete(slug) : next.add(slug))
      return next
    })
  }

  async function handleGenerate() {
    if (selectedRules.length === 0) return
    const rule = selectedRules[Math.floor(Math.random() * selectedRules.length)]
    if (!rule) return

    setActiveRule(rule)
    setIsGenerating(true)
    setError(false)
    setShowReference(false)
    setSaved(false)
    setMyTranslation("")
    try {
      const result = await generatePracticeText(rule.title, rule.structure ?? "")
      if (result) setPractice(result)
      else setError(true)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!practice || !activeRule || !myTranslation.trim()) return
    setIsSaving(true)
    try {
      await savePracticeAttempt({
        ruleSlug: activeRule.slug,
        direction,
        sourceText: promptText,
        referenceTranslation: referenceText,
        myTranslation,
      })
      setSaved(true)
      toast("Tradução salva!")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pt-4 px-[18px] pb-6 md:p-8 max-w-2xl mx-auto">
      <Link href="/grammar" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mb-4">
        <ArrowLeft size={12} />
        Voltar
      </Link>

      <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">HIGHLIGHT</p>
      <h1 className="text-2xl font-bold text-white mb-1">Praticar com IA</h1>
      <p className="text-gray-500 text-sm mb-6">
        Escolha um tema de gramática e a direção da tradução, e receba um texto curto gerado por IA.
      </p>

      <div className="bg-[#151515] border border-[#292929] rounded-[18px] p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Temas ({selectedRules.length} selecionados)
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedSlugs(new Set(rules.map((r) => r.slug)))}
              className="text-[10px] font-bold text-gray-500 hover:text-yellow-400 transition-colors"
            >
              Selecionar todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedSlugs(new Set())}
              className="text-[10px] font-bold text-gray-500 hover:text-red-400 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto border border-white/10 rounded-lg p-3 mb-4 space-y-3">
          {categories.map((category) => {
            const rulesInCategory = rules.filter((r) => r.category === category)
            const allSelected = rulesInCategory.every((r) => selectedSlugs.has(r.slug))
            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category, allSelected)}
                  className="text-[10px] font-bold tracking-wider uppercase text-gray-500 hover:text-yellow-400 transition-colors mb-1.5"
                >
                  {CATEGORY_LABELS[category] ?? category}
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {rulesInCategory.map((r) => (
                    <label
                      key={r.slug}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                        selectedSlugs.has(r.slug)
                          ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                          : "bg-transparent border-white/10 text-gray-500 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSlugs.has(r.slug)}
                        onChange={() => toggleRule(r.slug)}
                        className="sr-only"
                      />
                      {r.title}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Direção da tradução
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setDirection("en-pt")}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-colors border ${
              direction === "en-pt"
                ? "bg-yellow-400 text-black border-yellow-400"
                : "bg-transparent text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            Inglês → Português
          </button>
          <button
            type="button"
            onClick={() => setDirection("pt-en")}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-colors border ${
              direction === "pt-en"
                ? "bg-yellow-400 text-black border-yellow-400"
                : "bg-transparent text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            Português → Inglês
          </button>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedRules.length === 0}
          className="flex items-center justify-center gap-2 w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-sm font-bold py-3 rounded-full transition-colors"
        >
          {isGenerating ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : selectedRules.length > 1 ? (
            <Shuffle size={15} />
          ) : (
            <Sparkles size={15} />
          )}
          {practice ? "Gerar outro texto" : "Gerar texto"}
        </button>

        {selectedRules.length === 0 && (
          <p className="text-xs text-gray-500 mt-3">Selecione ao menos um tema.</p>
        )}

        {error && (
          <p className="text-xs text-red-400 mt-3">
            Não foi possível gerar o texto agora. Tente novamente em instantes.
          </p>
        )}
      </div>

      {practice && activeRule && (
        <div className="bg-[#151515] border border-[#292929] rounded-[18px] p-5 space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{promptLabel}</p>
              <span className="text-[10px] font-bold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">
                {activeRule.title}
              </span>
            </div>
            <p className="text-white text-base leading-relaxed">{promptText}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Sua tradução
            </label>
            <textarea
              value={myTranslation}
              onChange={(e) => { setMyTranslation(e.target.value); setSaved(false) }}
              rows={4}
              placeholder={`Traduza o texto acima para o ${targetLanguage}...`}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || saved || !myTranslation.trim()}
            className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-full transition-colors"
          >
            <Save size={14} />
            {saved ? "Salvo!" : isSaving ? "Salvando..." : "Salvar minha tradução"}
          </button>

          {showReference ? (
            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4">
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">Tradução de referência</p>
              <p className="text-gray-300 text-sm leading-relaxed">{referenceText}</p>
            </div>
          ) : (
            <button
              onClick={() => setShowReference(true)}
              className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              <Eye size={14} />
              Ver tradução de referência
            </button>
          )}
        </div>
      )}
    </div>
  )
}
