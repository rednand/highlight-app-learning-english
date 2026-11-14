"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Sparkles, Eye, RefreshCw, Shuffle, Save, History } from "lucide-react"
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
      <div className="flex items-center justify-between mb-4">
        <Link href="/grammar" className="inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-white transition-colors">
          <ArrowLeft size={12} />
          Voltar
        </Link>
        <Link
          href="/grammar/practice/history"
          className="inline-flex items-center gap-1.5 bg-raised hover:bg-raised-strong border border-line text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
        >
          <History size={13} className="text-brand" />
          Histórico
        </Link>
      </div>

      <p className="text-[10px] font-bold tracking-[0.3em] text-brand-strong mb-1">HIGHLIGHT</p>
      <h1 className="text-2xl font-bold text-white mb-1">Praticar com IA</h1>
      <p className="text-fg-subtle text-sm mb-6">
        Escolha um tema de gramática e a direção da tradução, e receba um texto curto gerado por IA.
      </p>

      <div className="bg-surface border border-line rounded-[18px] p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-fg-subtle uppercase tracking-wider">
            Temas ({selectedRules.length} selecionados)
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedSlugs(new Set(rules.map((r) => r.slug)))}
              className="text-[10px] font-bold text-fg-subtle hover:text-brand transition-colors"
            >
              Selecionar todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedSlugs(new Set())}
              className="text-[10px] font-bold text-fg-subtle hover:text-red-400 transition-colors"
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
                  className="text-[10px] font-bold tracking-wider uppercase text-fg-subtle hover:text-brand transition-colors mb-1.5"
                >
                  {CATEGORY_LABELS[category] ?? category}
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {rulesInCategory.map((r) => (
                    <label
                      key={r.slug}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                        selectedSlugs.has(r.slug)
                          ? "bg-brand/10 border-brand/30 text-brand"
                          : "bg-transparent border-white/10 text-fg-subtle hover:border-white/20"
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

        <label className="block text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">
          Direção da tradução
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setDirection("en-pt")}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-colors border ${
              direction === "en-pt"
                ? "bg-brand text-black border-brand"
                : "bg-transparent text-fg-muted border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            Inglês → Português
          </button>
          <button
            type="button"
            onClick={() => setDirection("pt-en")}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-colors border ${
              direction === "pt-en"
                ? "bg-brand text-black border-brand"
                : "bg-transparent text-fg-muted border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            Português → Inglês
          </button>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedRules.length === 0}
          className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-strong disabled:opacity-50 text-black text-sm font-bold py-3 rounded-full transition-colors"
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
          <p className="text-xs text-fg-subtle mt-3">Selecione ao menos um tema.</p>
        )}

        {error && (
          <p className="text-xs text-red-400 mt-3">
            Não foi possível gerar o texto agora. Tente novamente em instantes.
          </p>
        )}
      </div>

      {practice && activeRule && (
        <div className="bg-surface border border-line rounded-[18px] p-5 space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-xs font-bold text-fg-subtle uppercase tracking-wider">{promptLabel}</p>
              <span className="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                {activeRule.title}
              </span>
            </div>
            <p className="text-white text-base leading-relaxed">{promptText}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">
              Sua tradução
            </label>
            <textarea
              value={myTranslation}
              onChange={(e) => { setMyTranslation(e.target.value); setSaved(false) }}
              rows={4}
              placeholder={`Traduza o texto acima para o ${targetLanguage}...`}
              className="w-full bg-page border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-fg-faint outline-none focus:border-brand/50 transition-colors resize-none"
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
            <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
              <p className="text-xs font-bold text-brand uppercase tracking-wider mb-2">Tradução de referência</p>
              <p className="text-fg-soft text-sm leading-relaxed">{referenceText}</p>
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
