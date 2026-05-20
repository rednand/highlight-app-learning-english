import { describe, it, expect } from "vitest"
import { sm2, formatNextReview, urgencyLabel } from "../app/lib/review-utils"
import type { Grade, LessonStat } from "../app/lib/review-utils"

// ─── sm2 ────────────────────────────────────────────────────────────────────

describe("sm2", () => {
  const base = { ease_factor: 2.5, interval_days: 1 }

  it("grade 5: aumenta ease_factor e salta para 6 dias (interval era 1)", () => {
    const result = sm2(base, 5)
    expect(result.ease_factor).toBeGreaterThan(2.5)
    expect(result.interval_days).toBe(6)
  })

  it("grade 5: interval > 1 multiplica pelo ease_factor", () => {
    const result = sm2({ ease_factor: 2.5, interval_days: 6 }, 5)
    expect(result.interval_days).toBe(Math.round(6 * result.ease_factor))
  })

  it("grade 3: mantém ease_factor próximo do original e salta para 6", () => {
    const result = sm2(base, 3)
    expect(result.interval_days).toBe(6)
  })

  it("grade 1: reseta interval para 1 e diminui ease_factor", () => {
    const result = sm2(base, 1)
    expect(result.interval_days).toBe(1)
    expect(result.ease_factor).toBeLessThan(2.5)
  })

  it("grade 0: reseta interval para 1 e diminui ease_factor ao mínimo (1.3)", () => {
    const result = sm2({ ease_factor: 1.3, interval_days: 1 }, 0 as Grade)
    expect(result.interval_days).toBe(1)
    expect(result.ease_factor).toBe(1.3)
  })

  it("ease_factor nunca cai abaixo de 1.3", () => {
    let card = { ease_factor: 1.3, interval_days: 1 }
    for (let i = 0; i < 10; i++) {
      const r = sm2(card, 1)
      card = { ease_factor: r.ease_factor, interval_days: r.interval_days }
    }
    expect(card.ease_factor).toBeGreaterThanOrEqual(1.3)
  })

  it("next_review_at é uma data ISO futura", () => {
    const result = sm2(base, 5)
    expect(new Date(result.next_review_at).getTime()).toBeGreaterThan(Date.now())
  })

  it("ease_factor tem no máximo 2 casas decimais", () => {
    const result = sm2(base, 4 as Grade)
    expect(result.ease_factor.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2)
  })
})

// ─── formatNextReview ────────────────────────────────────────────────────────

describe("formatNextReview", () => {
  it("null retorna '—'", () => {
    expect(formatNextReview(null)).toBe("—")
  })

  it("data no passado retorna 'Agora'", () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(formatNextReview(past)).toBe("Agora")
  })

  it("data de amanhã retorna 'Amanhã'", () => {
    const tomorrow = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString()
    expect(formatNextReview(tomorrow)).toBe("Amanhã")
  })

  it("3 dias no futuro retorna 'Em 3 dias'", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatNextReview(future)).toBe("Em 3 dias")
  })

  it("10 dias no futuro retorna 'Em 10 dias'", () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatNextReview(future)).toBe("Em 10 dias")
  })
})

// ─── urgencyLabel ────────────────────────────────────────────────────────────

describe("urgencyLabel", () => {
  it("undefined retorna null", () => {
    expect(urgencyLabel(undefined)).toBeNull()
  })

  it("dueCount > 0 retorna Urgente", () => {
    const stat: LessonStat = { dueCount: 3, totalCount: 10, minNextReview: null, dominio: 50 }
    expect(urgencyLabel(stat)).toEqual({
      label: "Urgente",
      color: "bg-red-500/20 text-red-400",
    })
  })

  it("dueCount = 0 e minNextReview null retorna null", () => {
    const stat: LessonStat = { dueCount: 0, totalCount: 5, minNextReview: null, dominio: 70 }
    expect(urgencyLabel(stat)).toBeNull()
  })

  it("próxima revisão em 1 dia retorna Moderado", () => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const stat: LessonStat = { dueCount: 0, totalCount: 5, minNextReview: soon, dominio: 70 }
    expect(urgencyLabel(stat)).toEqual({
      label: "Moderado",
      color: "bg-yellow-500/20 text-yellow-400",
    })
  })

  it("próxima revisão em 5 dias retorna Tranquilo", () => {
    const later = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const stat: LessonStat = { dueCount: 0, totalCount: 5, minNextReview: later, dominio: 90 }
    expect(urgencyLabel(stat)).toEqual({
      label: "Tranquilo",
      color: "bg-green-500/20 text-green-400",
    })
  })
})
