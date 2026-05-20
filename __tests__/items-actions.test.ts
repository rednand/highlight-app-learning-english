import { describe, it, expect, vi, beforeEach } from "vitest"
import { addLessonItem, updateLessonItem, deleteLessonItem } from "../app/actions/items"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { createClient } from "../app/utils/supabase/server"
import { revalidatePath } from "next/cache"

const mockCreateClient = vi.mocked(createClient)
const mockRevalidatePath = vi.mocked(revalidatePath)

type MockFn = ReturnType<typeof vi.fn>
type Builder = {
  data: unknown; error: { message: string } | null
  select: MockFn; eq: MockFn; single: MockFn
  update: MockFn; insert: MockFn; delete: MockFn; in: MockFn; lte: MockFn; order: MockFn
}

function makeBuilder(opts: { data?: unknown; error?: { message: string } | null } = {}): Builder {
  const resolved = { data: opts.data ?? null, error: opts.error ?? null }
  const b: Builder = {
    data: opts.data ?? null,
    error: opts.error ?? null,
    select: vi.fn(), eq: vi.fn(),
    single: vi.fn().mockResolvedValue(resolved),
    update: vi.fn(), insert: vi.fn(), delete: vi.fn(), in: vi.fn(), lte: vi.fn(), order: vi.fn(),
  }
  b.select.mockReturnValue(b); b.eq.mockReturnValue(b); b.in.mockReturnValue(b)
  b.lte.mockReturnValue(b); b.order.mockReturnValue(b); b.update.mockReturnValue(b)
  b.insert.mockReturnValue(b); b.delete.mockReturnValue(b)
  return b
}

function makeSupabase(user: unknown, builderOrFactory?: ReturnType<typeof makeBuilder> | ((table: string) => ReturnType<typeof makeBuilder>)) {
  const fromFn = typeof builderOrFactory === "function"
    ? vi.fn().mockImplementation(builderOrFactory)
    : vi.fn().mockReturnValue(builderOrFactory ?? makeBuilder())
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: fromFn,
  }
}

function fd(fields: Record<string, string>) {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  return form
}

// ─── addLessonItem ────────────────────────────────────────────────────────────

describe("addLessonItem", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sem usuário: lança 'Não autenticado'", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null) as never)
    await expect(addLessonItem(fd({ lesson_id: "l1", term: "hello" }))).rejects.toThrow("Não autenticado")
  })

  it("com usuário: insere lesson_item e flashcard", async () => {
    const itemBuilder = makeBuilder({ data: { id: "item-1" }, error: null })
    const flashcardBuilder = makeBuilder()
    const supa = makeSupabase({ id: "u1" }, (table: string) =>
      table === "lesson_items" ? itemBuilder : flashcardBuilder,
    )
    mockCreateClient.mockResolvedValue(supa as never)

    await addLessonItem(fd({ lesson_id: "l1", term: "hello", translation: "olá" }))

    expect(itemBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ term: "hello", translation: "olá", user_id: "u1", lesson_id: "l1" }),
    )
    expect(flashcardBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ front: "hello", back: "olá", user_id: "u1", lesson_item_id: "item-1" }),
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith("/lessons/l1")
  })

  it("sem tradução: usa o próprio termo no flashcard", async () => {
    const itemBuilder = makeBuilder({ data: { id: "item-2" }, error: null })
    const flashcardBuilder = makeBuilder()
    const supa = makeSupabase({ id: "u1" }, (table: string) =>
      table === "lesson_items" ? itemBuilder : flashcardBuilder,
    )
    mockCreateClient.mockResolvedValue(supa as never)

    await addLessonItem(fd({ lesson_id: "l1", term: "run" }))

    expect(flashcardBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ front: "run", back: "run" }),
    )
  })

  it("erro no banco ao inserir: lança erro", async () => {
    const b = makeBuilder({ data: null, error: { message: "insert fail" } })
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, b) as never)
    await expect(addLessonItem(fd({ lesson_id: "l1", term: "word" }))).rejects.toThrow("insert fail")
  })
})

// ─── updateLessonItem ─────────────────────────────────────────────────────────

describe("updateLessonItem", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sem usuário: lança 'Não autenticado'", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null) as never)
    await expect(updateLessonItem(fd({ id: "i1", lesson_id: "l1", term: "x" }))).rejects.toThrow("Não autenticado")
  })

  it("com usuário: atualiza lesson_item e flashcard", async () => {
    const itemBuilder = makeBuilder()
    const flashcardBuilder = makeBuilder()
    const supa = makeSupabase({ id: "u1" }, (table: string) =>
      table === "lesson_items" ? itemBuilder : flashcardBuilder,
    )
    mockCreateClient.mockResolvedValue(supa as never)

    await updateLessonItem(fd({ id: "item-1", lesson_id: "l1", term: "run", translation: "correr" }))

    expect(itemBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ term: "run", translation: "correr" }),
    )
    expect(flashcardBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ front: "run", back: "correr" }),
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith("/lessons/l1")
  })
})

// ─── deleteLessonItem ─────────────────────────────────────────────────────────

describe("deleteLessonItem", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deleta o item e revalida o path da lição", async () => {
    const b = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, b) as never)
    await deleteLessonItem("item-1", "lesson-1")
    expect(b.delete).toHaveBeenCalled()
    expect(mockRevalidatePath).toHaveBeenCalledWith("/lessons/lesson-1")
  })
})
