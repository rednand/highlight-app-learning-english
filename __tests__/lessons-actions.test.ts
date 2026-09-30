import { describe, it, expect, vi, beforeEach } from "vitest"
import { signOut, createLesson, updateLesson, deleteLesson } from "../app/actions/lessons"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error("NEXT_REDIRECT") }),
}))

import { createClient } from "../app/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const mockCreateClient = vi.mocked(createClient)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockRedirect = vi.mocked(redirect)

type MockFn = ReturnType<typeof vi.fn>
type Builder = {
  data: unknown; error: { message: string } | null
  select: MockFn; eq: MockFn; single: MockFn; upsert: MockFn
  update: MockFn; insert: MockFn; delete: MockFn; in: MockFn; lte: MockFn; order: MockFn
}

function makeBuilder(opts: { data?: unknown; error?: { message: string } | null } = {}): Builder {
  const resolved = { data: opts.data ?? null, error: opts.error ?? null }
  const b: Builder = {
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

function makeSupabase(user: unknown, builder?: ReturnType<typeof makeBuilder>) {
  const b = builder ?? makeBuilder()
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnValue(b),
    _builder: b,
  }
}

function fd(fields: Record<string, string>) {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  return form
}

// ─── signOut ──────────────────────────────────────────────────────────────────

describe("signOut", () => {
  beforeEach(() => vi.clearAllMocks())

  it("chama auth.signOut e redireciona para /login", async () => {
    const supa = makeSupabase({ id: "u1" })
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT")
    expect(supa.auth.signOut).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })
})

// ─── createLesson ─────────────────────────────────────────────────────────────

describe("createLesson", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sem usuário: redireciona para /login", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null) as never)
    await expect(createLesson(fd({ title: "Test" }))).rejects.toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("com usuário: insere lição e redireciona", async () => {
    const b = makeBuilder({ data: { id: "lesson-123" }, error: null })
    const supa = makeSupabase({ id: "u1" }, b)
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(createLesson(fd({ title: "Nova aula", source_type: "lesson" }))).rejects.toThrow("NEXT_REDIRECT")
    expect(b.insert).toHaveBeenCalledWith(expect.objectContaining({ title: "Nova aula", user_id: "u1" }))
    expect(mockRedirect).toHaveBeenCalledWith("/lessons/lesson-123")
  })

  it("converte tmdb_id para inteiro quando fornecido", async () => {
    const b = makeBuilder({ data: { id: "lesson-456" }, error: null })
    const supa = makeSupabase({ id: "u1" }, b)
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(createLesson(fd({ title: "Filme", tmdb_id: "99", tmdb_type: "movie" }))).rejects.toThrow("NEXT_REDIRECT")
    expect(b.insert).toHaveBeenCalledWith(expect.objectContaining({ tmdb_id: 99 }))
  })

  it("erro no banco: lança erro", async () => {
    const b = makeBuilder({ data: null, error: { message: "insert error" } })
    const supa = makeSupabase({ id: "u1" }, b)
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(createLesson(fd({ title: "Fail" }))).rejects.toThrow("insert error")
  })
})

// ─── updateLesson ─────────────────────────────────────────────────────────────

describe("updateLesson", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sem usuário: redireciona para /login", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null) as never)
    await expect(updateLesson(fd({ id: "l1", title: "x" }))).rejects.toThrow("NEXT_REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("com usuário: atualiza a lição e revalida o path", async () => {
    const supa = makeSupabase({ id: "u1" })
    mockCreateClient.mockResolvedValue(supa as never)
    await updateLesson(fd({ id: "lesson-1", title: "Atualizada" }))
    expect(supa._builder.update).toHaveBeenCalledWith(expect.objectContaining({ title: "Atualizada" }))
    expect(mockRevalidatePath).toHaveBeenCalledWith("/lessons/lesson-1")
  })

  it("erro no banco: lança erro", async () => {
    const b = makeBuilder({ data: null, error: { message: "update error" } })
    const supa = makeSupabase({ id: "u1" }, b)
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(updateLesson(fd({ id: "l1", title: "x" }))).rejects.toThrow("update error")
  })
})

// ─── deleteLesson ─────────────────────────────────────────────────────────────

describe("deleteLesson", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deleta, revalida o path e redireciona", async () => {
    const supa = makeSupabase({ id: "u1" })
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(deleteLesson("lesson-1")).rejects.toThrow("NEXT_REDIRECT")
    expect(supa._builder.delete).toHaveBeenCalled()
    expect(mockRevalidatePath).toHaveBeenCalledWith("/lessons")
    expect(mockRedirect).toHaveBeenCalledWith("/lessons")
  })
})

// ─── createLesson: título automático e palavras ──────────────────────────────

describe("createLesson com palavras", () => {
  beforeEach(() => vi.clearAllMocks())

  function makeMultiTable(itemsResult: { data: unknown; error: { message: string } | null }) {
    const lessonsB = makeBuilder({ data: { id: "lesson-1" }, error: null })
    const itemsSelect = vi.fn().mockResolvedValue(itemsResult)
    const itemsB = { insert: vi.fn().mockReturnValue({ select: itemsSelect }) }
    const cardsB = { insert: vi.fn().mockResolvedValue({ error: null }) }
    const supa = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn((table: string) => (table === "lessons" ? lessonsB : table === "lesson_items" ? itemsB : cardsB)),
    }
    return { supa, lessonsB, itemsB, cardsB }
  }

  it("usa a data da aula como título quando ele vem vazio", async () => {
    const { supa, lessonsB } = makeMultiTable({ data: [], error: null })
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(createLesson(fd({ title: "  ", lesson_date: "2026-09-25" }))).rejects.toThrow("NEXT_REDIRECT")
    expect(lessonsB.insert).toHaveBeenCalledWith(expect.objectContaining({ title: "25/09/2026" }))
  })

  it("insere as palavras válidas e cria um flashcard para cada uma", async () => {
    const { supa, itemsB, cardsB } = makeMultiTable({
      data: [{ id: "i1", term: "sullen", translation: "mal-humorado" }],
      error: null,
    })
    mockCreateClient.mockResolvedValue(supa as never)
    const items = JSON.stringify([
      { term: "sullen", translation: "mal-humorado", type: "word", context: "", phonetic: "", my_sentence: "" },
      { term: "   " },
      "lixo",
    ])
    await expect(createLesson(fd({ title: "Aula", items }))).rejects.toThrow("NEXT_REDIRECT")

    const inserted = itemsB.insert.mock.calls[0][0]
    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toEqual(expect.objectContaining({ lesson_id: "lesson-1", user_id: "u1", term: "sullen", context: null }))
    expect(cardsB.insert).toHaveBeenCalledWith([
      expect.objectContaining({ lesson_item_id: "i1", front: "sullen", back: "mal-humorado", user_id: "u1" }),
    ])
    expect(mockRedirect).toHaveBeenCalledWith("/lessons/lesson-1")
  })

  it("ignora a lista de palavras quando o JSON é inválido", async () => {
    const { supa, itemsB } = makeMultiTable({ data: [], error: null })
    mockCreateClient.mockResolvedValue(supa as never)
    await expect(createLesson(fd({ title: "Aula", items: "{quebrado" }))).rejects.toThrow("NEXT_REDIRECT")
    expect(itemsB.insert).not.toHaveBeenCalled()
  })

  it("lança erro quando falha ao inserir as palavras", async () => {
    const { supa } = makeMultiTable({ data: null, error: { message: "items error" } })
    mockCreateClient.mockResolvedValue(supa as never)
    const items = JSON.stringify([{ term: "sullen" }])
    await expect(createLesson(fd({ title: "Aula", items }))).rejects.toThrow("items error")
  })
})
