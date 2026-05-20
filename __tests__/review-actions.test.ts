import { describe, it, expect, vi, beforeEach } from "vitest"
import { getStreak, updateStreak, fetchFlashcards, updateFlashcard } from "../app/actions/review"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { createClient } from "../app/utils/supabase/server"
const mockCreateClient = vi.mocked(createClient)

function makeBuilder(overrides: Record<string, unknown> = {}) {
  const b: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
    in: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
  }
  b.select.mockReturnValue(b)
  b.eq.mockReturnValue(b)
  b.in.mockReturnValue(b)
  b.lte.mockReturnValue(b)
  b.order.mockReturnValue(b)
  b.update.mockReturnValue(b)
  return { ...b, ...overrides }
}

function makeSupabase(user: unknown, builderOverrides = {}) {
  const builder = makeBuilder(builderOverrides)
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(builder),
    _builder: builder,
  }
}

const TODAY = new Date().toISOString().slice(0, 10)
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const OLDER = "2020-01-01"

// ─── getStreak ───────────────────────────────────────────────────────────────

describe("getStreak", () => {
  it("sem usuário retorna 0", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null) as never)
    expect(await getStreak()).toBe(0)
  })

  it("sem registro no banco retorna 0", async () => {
    const supa = makeSupabase({ id: "u1" })
    supa._builder.single.mockResolvedValue({ data: null, error: null })
    mockCreateClient.mockResolvedValue(supa as never)
    expect(await getStreak()).toBe(0)
  })

  it("last_review_date é hoje: retorna days", async () => {
    const supa = makeSupabase({ id: "u1" })
    supa._builder.single.mockResolvedValue({ data: { days: 5, last_review_date: TODAY } })
    mockCreateClient.mockResolvedValue(supa as never)
    expect(await getStreak()).toBe(5)
  })

  it("last_review_date é ontem: retorna days", async () => {
    const supa = makeSupabase({ id: "u1" })
    supa._builder.single.mockResolvedValue({ data: { days: 3, last_review_date: YESTERDAY } })
    mockCreateClient.mockResolvedValue(supa as never)
    expect(await getStreak()).toBe(3)
  })

  it("last_review_date é antigo: retorna 0", async () => {
    const supa = makeSupabase({ id: "u1" })
    supa._builder.single.mockResolvedValue({ data: { days: 99, last_review_date: OLDER } })
    mockCreateClient.mockResolvedValue(supa as never)
    expect(await getStreak()).toBe(0)
  })
})

// ─── updateStreak ────────────────────────────────────────────────────────────

describe("updateStreak", () => {
  it("sem usuário retorna 0", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null) as never)
    expect(await updateStreak()).toBe(0)
  })

  it("já revisou hoje: retorna days existente sem upsert", async () => {
    const supa = makeSupabase({ id: "u1" })
    supa._builder.single.mockResolvedValue({ data: { days: 7, last_review_date: TODAY } })
    mockCreateClient.mockResolvedValue(supa as never)
    const result = await updateStreak()
    expect(result).toBe(7)
    expect(supa._builder.upsert).not.toHaveBeenCalled()
  })

  it("revisou ontem: incrementa e faz upsert", async () => {
    const supa = makeSupabase({ id: "u1" })
    supa._builder.single.mockResolvedValue({ data: { days: 4, last_review_date: YESTERDAY } })
    mockCreateClient.mockResolvedValue(supa as never)
    const result = await updateStreak()
    expect(result).toBe(5)
    expect(supa._builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ days: 5, last_review_date: TODAY }),
    )
  })

  it("sem registro anterior: começa em 1", async () => {
    const supa = makeSupabase({ id: "u1" })
    supa._builder.single.mockResolvedValue({ data: null, error: null })
    mockCreateClient.mockResolvedValue(supa as never)
    const result = await updateStreak()
    expect(result).toBe(1)
    expect(supa._builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ days: 1, last_review_date: TODAY }),
    )
  })

  it("streak quebrada (data antiga): reseta para 1", async () => {
    const supa = makeSupabase({ id: "u1" })
    supa._builder.single.mockResolvedValue({ data: { days: 30, last_review_date: OLDER } })
    mockCreateClient.mockResolvedValue(supa as never)
    const result = await updateStreak()
    expect(result).toBe(1)
  })
})

// ─── Helpers para testes com encadeamento await ───────────────────────────────

type MockFn = ReturnType<typeof vi.fn>
type ChainBuilder = {
  data: unknown; error: { message: string } | null
  select: MockFn; eq: MockFn; single: MockFn; upsert: MockFn
  update: MockFn; insert: MockFn; delete: MockFn; in: MockFn; lte: MockFn; order: MockFn
}

function makeChainBuilder(opts: { data?: unknown; error?: { message: string } | null } = {}): ChainBuilder {
  const resolved = { data: opts.data ?? null, error: opts.error ?? null }
  const b: ChainBuilder = {
    data: opts.data ?? null,
    error: opts.error ?? null,
    select: vi.fn(), eq: vi.fn(),
    single: vi.fn().mockResolvedValue(resolved),
    upsert: vi.fn().mockResolvedValue({ data: null, error: opts.error ?? null }),
    update: vi.fn(), insert: vi.fn(), delete: vi.fn(), in: vi.fn(), lte: vi.fn(), order: vi.fn(),
  }
  b.select.mockReturnValue(b); b.eq.mockReturnValue(b); b.in.mockReturnValue(b)
  b.lte.mockReturnValue(b); b.order.mockReturnValue(b); b.update.mockReturnValue(b)
  b.insert.mockReturnValue(b); b.delete.mockReturnValue(b); b.upsert.mockReturnValue(b)
  return b
}

// ─── fetchFlashcards ──────────────────────────────────────────────────────────

describe("fetchFlashcards", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sem usuário retorna { cards: null }", async () => {
    const supa = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    }
    mockCreateClient.mockResolvedValue(supa as never)
    expect(await fetchFlashcards()).toEqual({ cards: null })
  })

  it("sem lessonId retorna cards devidos", async () => {
    const mockCard = { id: "c1", front: "hi", back: "oi", ease_factor: 2.5, interval_days: 1, next_review_at: new Date().toISOString() }
    const b = makeChainBuilder({ data: [mockCard], error: null })
    const supa = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue(b),
    }
    mockCreateClient.mockResolvedValue(supa as never)
    const result = await fetchFlashcards()
    expect(result.cards).toEqual([mockCard])
  })

  it("com lessonId sem itens retorna { cards: [] }", async () => {
    const b = makeChainBuilder({ data: [], error: null })
    const supa = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue(b),
    }
    mockCreateClient.mockResolvedValue(supa as never)
    const result = await fetchFlashcards("lesson-1")
    expect(result).toEqual({ cards: [] })
  })

  it("com lessonId com itens filtra os cards", async () => {
    const mockCard = { id: "c1", front: "hi", back: "oi", ease_factor: 2.5, interval_days: 1, next_review_at: new Date().toISOString() }
    const itemsBuilder = makeChainBuilder({ data: [{ id: "item1" }], error: null })
    const cardsBuilder = makeChainBuilder({ data: [mockCard], error: null })
    const supa = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockImplementation((table: string) =>
        table === "lesson_items" ? itemsBuilder : cardsBuilder,
      ),
    }
    mockCreateClient.mockResolvedValue(supa as never)
    const result = await fetchFlashcards("lesson-1")
    expect(result.cards).toEqual([mockCard])
  })

  it("com skipDueFilter não aplica filtro lte", async () => {
    const b = makeChainBuilder({ data: [], error: null })
    const supa = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue(b),
    }
    mockCreateClient.mockResolvedValue(supa as never)
    await fetchFlashcards(undefined, true)
    expect(b.lte).not.toHaveBeenCalled()
  })

  it("erro no banco retorna { cards: null }", async () => {
    const b = makeChainBuilder({ data: null, error: { message: "DB error" } })
    const supa = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue(b),
    }
    mockCreateClient.mockResolvedValue(supa as never)
    const result = await fetchFlashcards()
    expect(result).toEqual({ cards: null })
  })
})

// ─── updateFlashcard ──────────────────────────────────────────────────────────

describe("updateFlashcard", () => {
  beforeEach(() => vi.clearAllMocks())

  it("chama update com os dados corretos", async () => {
    const b = makeChainBuilder()
    const supa = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue(b),
    }
    mockCreateClient.mockResolvedValue(supa as never)
    const update = { ease_factor: 2.6, interval_days: 6, next_review_at: new Date().toISOString() }
    await updateFlashcard("card-1", update)
    expect(b.update).toHaveBeenCalledWith(update)
    expect(b.eq).toHaveBeenCalledWith("id", "card-1")
  })
})
