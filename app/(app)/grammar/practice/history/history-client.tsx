"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, Sparkles, RefreshCw, CheckCircle } from "lucide-react"
import { correctPracticeAttempt, type PracticeFeedback } from "../../../../actions/practice"
import { wordDiff } from "../../../../lib/word-diff"

export type HistoryAttempt = {
  id: string
  rule_slug: string
  rule_title: string
  direction: string
  source_text: string
  reference_translation: string
  my_translation: string
  ai_feedback: string | null
  created_at: string
}

function parseFeedback(raw: string | null): PracticeFeedback | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    const v = parsed as Record<string, unknown>
    if (typeof v.nota !== "number" || typeof v.resumo !== "string" || !Array.isArray(v.erros)) return null
    return parsed as PracticeFeedback
  } catch {
    return null
  }
}

function scoreColor(nota: number) {
  if (nota >= 8) return "text-green-400"
  if (nota >= 5) return "text-[#FDC700]"
  return "text-red-400"
}

export default function HistoryClient({ attempts }: { attempts: HistoryAttempt[] }) {
  const [openId, setOpenId] = useState<string | null>(attempts[0]?.id ?? null)
  const [feedback, setFeedback] = useState<Record<string, PracticeFeedback | null>>(() =>
    Object.fromEntries(attempts.map((a) => [a.id, parseFeedback(a.ai_feedback)])),
  )
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)

  async function handleCorrect(id: string) {
    setLoadingId(id)
    setErrorId(null)
    try {
      const result = await correctPracticeAttempt(id)
      if (result) setFeedback((prev) => ({ ...prev, [id]: result }))
      else setErrorId(id)
    } catch {
      setErrorId(id)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="pt-4 px-[18px] pb-6 md:p-8 max-w-3xl mx-auto">
      <Link href="/grammar/practice" className="inline-flex items-center gap-1.5 text-xs text-[#8B8B98] hover:text-white transition-colors mb-4">
        <ArrowLeft size={12} />
        Voltar
      </Link>

      <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">PRATICAR COM IA</p>
      <h1 className="text-2xl font-bold text-white mb-1">Histórico</h1>
      <p className="text-[#8B8B98] text-sm mb-6">Suas traduções salvas. Compare com a referência e peça uma correção.</p>

      {attempts.length === 0 ? (
        <div className="bg-[#151515] border border-[#292929] rounded-[18px] p-6 text-center">
          <p className="text-sm text-[#8B8B98] mb-4">Você ainda não salvou nenhuma tradução.</p>
          <Link
            href="/grammar/practice"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
          >
            <Sparkles size={14} />
            Praticar agora
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const isOpen = openId === attempt.id
            const fb = feedback[attempt.id]
            const date = new Date(attempt.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
            const diff = isOpen ? wordDiff(attempt.my_translation, attempt.reference_translation) : null

            return (
              <div key={attempt.id} className="bg-[#151515] border border-[#292929] rounded-[18px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : attempt.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-yellow-400/10 text-[#FDC700] px-2 py-0.5 rounded-full">
                        {attempt.rule_title}
                      </span>
                      <span className="text-[10px] font-bold text-[#8B8B98] uppercase tracking-wider">
                        {attempt.direction === "en-pt" ? "Inglês → Português" : "Português → Inglês"}
                      </span>
                    </div>
                    <p className="text-sm text-white truncate">{attempt.source_text}</p>
                    <p className="text-xs text-[#8B8B98] mt-0.5">{date}</p>
                  </div>
                  {fb && <span className={`text-sm font-bold shrink-0 ${scoreColor(fb.nota)}`}>{fb.nota}/10</span>}
                  <ChevronDown size={16} className={`text-[#8B8B98] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && diff && (
                  <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#8B8B98] uppercase tracking-wider mb-1.5">Texto original</p>
                      <p className="text-sm text-white leading-relaxed">{attempt.source_text}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-[#0C0C0C] rounded-xl p-3">
                        <p className="text-[10px] font-bold text-[#8B8B98] uppercase tracking-wider mb-1.5">Sua tradução</p>
                        <p className="text-sm leading-relaxed">
                          {diff.mine.map((t, i) => (
                            <span key={i} className={t.match ? "text-gray-300" : "text-red-300 bg-red-400/10 rounded px-0.5"}>
                              {t.text}{" "}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="bg-[#0C0C0C] rounded-xl p-3">
                        <p className="text-[10px] font-bold text-[#8B8B98] uppercase tracking-wider mb-1.5">Referência</p>
                        <p className="text-sm leading-relaxed">
                          {diff.reference.map((t, i) => (
                            <span key={i} className={t.match ? "text-gray-300" : "text-green-300 bg-green-400/10 rounded px-0.5"}>
                              {t.text}{" "}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#8B8B98] -mt-2">
                      Em vermelho: palavras suas que não estão na referência. Em verde: palavras da referência que faltaram. Nem toda diferença é erro.
                    </p>

                    {fb ? (
                      <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold text-[#FDC700] uppercase tracking-wider">Correção da IA</p>
                          <span className={`text-sm font-bold ${scoreColor(fb.nota)}`}>{fb.nota}/10</span>
                        </div>
                        <p className="text-sm text-gray-300">{fb.resumo}</p>
                        {fb.erros.length === 0 ? (
                          <p className="flex items-center gap-2 text-sm text-green-400">
                            <CheckCircle size={14} />
                            Nenhum erro encontrado.
                          </p>
                        ) : (
                          <ul className="space-y-2.5">
                            {fb.erros.map((err, i) => (
                              <li key={i} className="text-sm">
                                <p>
                                  <span className="text-red-300 line-through">{err.trecho}</span>
                                  <span className="text-[#8B8B98]"> → </span>
                                  <span className="text-green-300 font-semibold">{err.correcao}</span>
                                </p>
                                <p className="text-xs text-[#8B8B98] mt-0.5">{err.explicacao}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCorrect(attempt.id)}
                        disabled={loadingId === attempt.id}
                        className="flex items-center justify-center gap-2 w-full bg-[#171717] hover:bg-[#1f1f1f] border border-[#2D2D2D] disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-full transition-colors"
                      >
                        {loadingId === attempt.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} className="text-yellow-400" />
                        )}
                        {loadingId === attempt.id ? "Corrigindo..." : "Corrigir com IA"}
                      </button>
                    )}

                    {errorId === attempt.id && (
                      <p className="text-xs text-red-400">Não foi possível corrigir agora. Tente novamente em instantes.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
