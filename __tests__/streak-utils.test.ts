import { describe, it, expect } from "vitest"
import { computeStreak, computeNewDays, todayAndYesterday } from "../app/lib/streak-utils"

const TODAY = "2026-05-20"
const YESTERDAY = "2026-05-19"
const OLDER = "2026-05-10"

// ─── computeStreak ───────────────────────────────────────────────────────────

describe("computeStreak", () => {
  it("data null retorna 0", () => {
    expect(computeStreak(null, TODAY, YESTERDAY)).toBe(0)
  })

  it("last_review_date é hoje: retorna os dias acumulados", () => {
    expect(computeStreak({ days: 7, last_review_date: TODAY }, TODAY, YESTERDAY)).toBe(7)
  })

  it("last_review_date é ontem: retorna os dias acumulados", () => {
    expect(computeStreak({ days: 3, last_review_date: YESTERDAY }, TODAY, YESTERDAY)).toBe(3)
  })

  it("last_review_date é mais antigo: retorna 0 (streak quebrada)", () => {
    expect(computeStreak({ days: 10, last_review_date: OLDER }, TODAY, YESTERDAY)).toBe(0)
  })

  it("streak de 1 dia (hoje) retorna 1", () => {
    expect(computeStreak({ days: 1, last_review_date: TODAY }, TODAY, YESTERDAY)).toBe(1)
  })
})

// ─── computeNewDays ──────────────────────────────────────────────────────────

describe("computeNewDays", () => {
  it("existing null: começa nova streak com 1", () => {
    expect(computeNewDays(null, TODAY, YESTERDAY)).toBe(1)
  })

  it("last_review_date é hoje: retorna null (já contado)", () => {
    expect(computeNewDays({ days: 5, last_review_date: TODAY }, TODAY, YESTERDAY)).toBeNull()
  })

  it("last_review_date é ontem: incrementa +1", () => {
    expect(computeNewDays({ days: 4, last_review_date: YESTERDAY }, TODAY, YESTERDAY)).toBe(5)
  })

  it("last_review_date é mais antigo: reseta para 1", () => {
    expect(computeNewDays({ days: 20, last_review_date: OLDER }, TODAY, YESTERDAY)).toBe(1)
  })

  it("streak de 1 dia ontem → vira 2", () => {
    expect(computeNewDays({ days: 1, last_review_date: YESTERDAY }, TODAY, YESTERDAY)).toBe(2)
  })
})

// ─── todayAndYesterday ───────────────────────────────────────────────────────

describe("todayAndYesterday", () => {
  it("retorna strings no formato YYYY-MM-DD", () => {
    const { today, yesterday } = todayAndYesterday()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("yesterday é exatamente 1 dia antes de today", () => {
    const { today, yesterday } = todayAndYesterday()
    const diffMs = new Date(today).getTime() - new Date(yesterday).getTime()
    expect(diffMs).toBe(86400000)
  })
})
