import grammarRules from "../../../../data/grammar-rules.json"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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

function levelColor(level: string) {
  if (level.startsWith("A")) return "bg-green-400/10 text-green-400 border-green-400/20"
  if (level.startsWith("B")) return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
  return "bg-orange-400/10 text-orange-400 border-orange-400/20"
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">{children}</h3>
  )
}

export default async function GrammarRulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rule = (grammarRules as GrammarRule[]).find((r) => r.slug === slug)
  if (!rule) notFound()

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Link
        href="/grammar"
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Gramática
      </Link>

      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold text-white">{rule.title}</h1>
        <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded border ${levelColor(rule.level)}`}>
          {rule.level}
        </span>
      </div>
      <p className="text-[10px] font-bold tracking-wider text-gray-600 uppercase mb-8">
        {CATEGORY_LABELS[rule.category] ?? rule.category}
      </p>

      {/* Structure */}
      {rule.structure && (
        <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 mb-6">
          <SectionTitle>Estrutura</SectionTitle>
          <p className="text-yellow-400 font-mono text-sm">{rule.structure}</p>
          {rule.negative && (
            <p className="text-gray-400 font-mono text-sm mt-2">
              <span className="text-gray-600 text-xs mr-2">Negativa:</span>{rule.negative}
            </p>
          )}
          {rule.question && (
            <p className="text-gray-400 font-mono text-sm mt-2">
              <span className="text-gray-600 text-xs mr-2">Pergunta:</span>{rule.question}
            </p>
          )}
        </div>
      )}

      {/* Usage */}
      {rule.usage && rule.usage.length > 0 && (
        <div className="mb-6">
          <SectionTitle>Quando usar</SectionTitle>
          <ul className="space-y-1.5">
            {rule.usage.map((u, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-yellow-400 mt-0.5 shrink-0">·</span>
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Examples */}
      {rule.examples && rule.examples.length > 0 && (
        <div className="mb-6">
          <SectionTitle>Exemplos</SectionTitle>
          <div className="space-y-2">
            {rule.examples.map((ex, i) => (
              <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-lg px-4 py-2.5">
                <p className="text-white text-sm italic">{ex}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time expressions */}
      {rule.time_expressions && rule.time_expressions.length > 0 && (
        <div className="mb-6">
          <SectionTitle>Expressões de tempo</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {rule.time_expressions.map((t, i) => (
              <span key={i} className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Special: rules object (articles, prepositions) */}
      {rule.rules && (
        <div className="mb-6">
          <SectionTitle>Regras</SectionTitle>
          <div className="space-y-2">
            {Object.entries(rule.rules).map(([key, val]) => (
              <div key={key} className="bg-[#0f0f0f] border border-white/5 rounded-lg px-4 py-3">
                <span className="text-yellow-400 font-mono text-xs font-bold">{key}</span>
                <p className="text-gray-300 text-sm mt-1">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special: tense changes (reported speech) */}
      {rule.tense_changes && (
        <div className="mb-6">
          <SectionTitle>Mudança de tempo verbal</SectionTitle>
          <div className="space-y-2">
            {Object.entries(rule.tense_changes).map(([change, example]) => {
              const [from, to] = change.split(" → ")
              return (
                <div key={change} className="bg-[#0f0f0f] border border-white/5 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-green-400 text-xs font-bold">{from}</span>
                    <span className="text-gray-600 text-xs">→</span>
                    <span className="text-yellow-400 text-xs font-bold">{to}</span>
                  </div>
                  <p className="text-gray-400 text-xs italic">{example}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Special: modal verbs */}
      {rule.modals && (
        <div className="mb-6">
          <SectionTitle>Modais</SectionTitle>
          <div className="space-y-2">
            {Object.entries(rule.modals).map(([modal, data]) => (
              <div key={modal} className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4">
                <p className="text-yellow-400 font-mono font-bold text-sm mb-2">{modal}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {data.usage.map((u, i) => (
                    <span key={i} className="bg-white/5 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">{u}</span>
                  ))}
                </div>
                {data.examples.map((ex, i) => (
                  <p key={i} className="text-gray-300 text-xs italic">· {ex}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special: forms (used to) */}
      {rule.forms && (
        <div className="mb-6">
          <SectionTitle>Formas</SectionTitle>
          <div className="space-y-3">
            {Object.entries(rule.forms).map(([formKey, data]) => (
              <div key={formKey} className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4">
                <p className="text-yellow-400 font-mono text-xs font-bold mb-1">{data.structure}</p>
                <p className="text-gray-400 text-xs mb-2">{data.usage}</p>
                {data.examples.map((ex, i) => (
                  <p key={i} className="text-gray-300 text-xs italic">· {ex}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special: gerund vs infinitive meaning changes */}
      {rule.both_with_meaning_change && (
        <div className="mb-6">
          <SectionTitle>Verbos com duplo significado</SectionTitle>
          <div className="space-y-3">
            {Object.entries(rule.both_with_meaning_change).map(([verb, data]) => (
              <div key={verb} className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4">
                <p className="text-yellow-400 font-bold text-sm mb-2">{verb}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Gerúndio</p>
                    <p className="text-gray-300 text-xs italic">{data.gerund}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Infinitivo</p>
                    <p className="text-gray-300 text-xs italic">{data.infinitive}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special: phrasal verbs list */}
      {rule.common_phrasal_verbs && (
        <div className="mb-6">
          <SectionTitle>Phrasal Verbs comuns</SectionTitle>
          <div className="space-y-2">
            {rule.common_phrasal_verbs.map((pv, i) => (
              <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-lg px-4 py-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-yellow-400 font-mono font-bold text-sm">{pv.verb}</span>
                  <span className="text-gray-500 text-xs">{pv.meaning}</span>
                </div>
                <p className="text-gray-300 text-xs italic mt-1">{pv.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special: question types */}
      {rule.types && !rule.relative_pronouns && (
        <div className="mb-6">
          <SectionTitle>Tipos</SectionTitle>
          <div className="space-y-4">
            {Object.entries(rule.types).map(([typeKey, data]) => (
              <div key={typeKey} className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4">
                <p className="text-white text-sm font-bold capitalize mb-1">
                  {typeKey.replace(/_/g, " ")}
                </p>
                {data.structure && <p className="text-yellow-400 font-mono text-xs mb-2">{data.structure}</p>}
                {data.description && <p className="text-gray-400 text-xs mb-2">{data.description}</p>}
                {data.examples && data.examples.map((ex, i) => (
                  <p key={i} className="text-gray-300 text-xs italic">· {ex}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special: relative pronouns */}
      {rule.relative_pronouns && (
        <div className="mb-6">
          <SectionTitle>Pronomes relativos</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(rule.relative_pronouns).map(([pronoun, usage]) => (
              <div key={pronoun} className="bg-[#0f0f0f] border border-white/5 rounded-lg px-3 py-2.5">
                <span className="text-yellow-400 font-mono font-bold text-sm">{pronoun}</span>
                <p className="text-gray-500 text-xs mt-0.5">{usage}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common errors */}
      {rule.common_errors && rule.common_errors.length > 0 && (
        <div className="mb-6">
          <SectionTitle>Erros comuns</SectionTitle>
          <div className="space-y-2">
            {rule.common_errors.map((err, i) => {
              const parts = err.split(" → ")
              return (
                <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-lg px-4 py-2.5 flex items-center gap-3 flex-wrap">
                  <span className="text-red-400 text-xs line-through">{parts[0]}</span>
                  {parts[1] && (
                    <>
                      <span className="text-gray-600 text-xs">→</span>
                      <span className="text-green-400 text-xs">{parts[1]}</span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {rule.notes && (
        <div className="bg-yellow-400/5 border border-yellow-400/10 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-1">Nota</p>
          <p className="text-gray-300 text-sm">{rule.notes}</p>
        </div>
      )}
    </div>
  )
}
