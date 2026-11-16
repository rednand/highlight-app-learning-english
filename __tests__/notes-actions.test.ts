import { describe, it, expect, vi, beforeEach } from "vitest"
import { addLessonNote, updateLessonNote, deleteLessonNote } from "../app/actions/notes"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { createClient } from "../app/utils/supabase/server"
import { revalidatePath } from "next/cache"

const mockCreateClient = vi.mocked(createClient)
type MockFn = ReturnType<typeof vi.fn>

function makeBuilder(opts: { single?: unknown; error?: { message: string } | null; rows?: unknown[] } = {}) {
  // single: o que .single() devolve (padrão: uma anotação sem imagens)
  const b: Record<string, MockFn | unknown> & { error: { message: string } | null; data: unknown[] } = {
    error: opts.error ?? null,
    data: opts.rows ?? [{ id: "n1" }],
  }
  for (const m of ["select", "eq", "insert", "update", "delete"]) b[m] = vi.fn().mockReturnValue(b)
  const single = "single" in opts ? opts.single : { id: "n1", image_paths: [] }
  b.single = vi.fn().mockResolvedValue({ data: opts.error ? null : single, error: opts.error ?? null })
  b.maybeSingle = b.single
  return b as typeof b & Record<"select" | "eq" | "insert" | "update" | "delete" | "single" | "maybeSingle", MockFn>
}

function makeSupabase(user: unknown, builders: Record<string, ReturnType<typeof makeBuilder>>) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockImplementation((table: string) => builders[table] ?? makeBuilder()),
  }
}

beforeEach(() => vi.clearAllMocks())

describe("addLessonNote", () => {
  it("recusa anotação vazia sem tocar no banco", async () => {
    await expect(addLessonNote("l1", "   ")).rejects.toThrow("vazia")
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it("recusa anotação longa demais", async () => {
    await expect(addLessonNote("l1", "a".repeat(5001))).rejects.toThrow("5000")
  })

  it("exige usuário autenticado", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null, {}) as never)
    await expect(addLessonNote("l1", "oi")).rejects.toThrow("Não autenticado")
  })

  it("as marcações de cor não contam no limite de tamanho", async () => {
    const lessons = makeBuilder({ single: { id: "l1" } })
    const notes = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lessons, lesson_notes: notes }) as never)
    const text = `[verde]${"a".repeat(4990)}[/verde]`
    await addLessonNote("l1", text)
    expect(notes.insert).toHaveBeenCalledWith({ lesson_id: "l1", user_id: "u1", content: text })
  })

  it("recusa anotação que só tem marcações vazias", async () => {
    await expect(addLessonNote("l1", "[azul][/azul]")).rejects.toThrow("vazia")
  })

  it("recusa aula que não é do usuário", async () => {
    const lessons = makeBuilder({ single: null })
    const notes = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lessons, lesson_notes: notes }) as never)
    await expect(addLessonNote("l1", "oi")).rejects.toThrow("Aula não encontrada")
    expect(lessons.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(notes.insert).not.toHaveBeenCalled()
  })

  it("insere a anotação sem espaços nas pontas e revalida a aula", async () => {
    const lessons = makeBuilder({ single: { id: "l1" } })
    const notes = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lessons, lesson_notes: notes }) as never)
    await addLessonNote("l1", "  lembrar do phrasal verb  ")
    expect(notes.insert).toHaveBeenCalledWith({ lesson_id: "l1", user_id: "u1", content: "lembrar do phrasal verb" })
    expect(revalidatePath).toHaveBeenCalledWith("/lessons/l1")
  })

  it("propaga erro do banco", async () => {
    const lessons = makeBuilder({ single: { id: "l1" } })
    const notes = makeBuilder({ error: { message: "falhou" } })
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lessons, lesson_notes: notes }) as never)
    await expect(addLessonNote("l1", "oi")).rejects.toThrow("falhou")
  })
})

describe("updateLessonNote", () => {
  it("atualiza conteúdo e data de edição, filtrando pelo dono", async () => {
    const notes = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: notes }) as never)
    await updateLessonNote("n1", "l1", " novo texto ")
    expect(notes.update).toHaveBeenCalledWith({ content: "novo texto", updated_at: expect.any(String) })
    expect(notes.eq).toHaveBeenCalledWith("id", "n1")
    expect(notes.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(revalidatePath).toHaveBeenCalledWith("/lessons/l1")
  })

  it("recusa texto vazio quando a anotação não tem imagens", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: makeBuilder() }) as never)
    await expect(updateLessonNote("n1", "l1", "")).rejects.toThrow("vazia")
  })

  it("aceita texto vazio quando a anotação tem ou vai ganhar imagens", async () => {
    const notes = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: notes }) as never)
    await updateLessonNote("n1", "l1", "  ", true)
    expect(notes.update).toHaveBeenCalledWith({ content: "", updated_at: expect.any(String) })
  })

  it("propaga erro do banco", async () => {
    const notes = makeBuilder({ error: { message: "falhou" } })
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: notes }) as never)
    await expect(updateLessonNote("n1", "l1", "oi")).rejects.toThrow("falhou")
  })
})

describe("deleteLessonNote", () => {
  it("apaga filtrando pelo dono e revalida a aula", async () => {
    const notes = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: notes }) as never)
    await deleteLessonNote("n1", "l1")
    expect(notes.delete).toHaveBeenCalled()
    expect(notes.eq).toHaveBeenCalledWith("id", "n1")
    expect(notes.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(revalidatePath).toHaveBeenCalledWith("/lessons/l1")
  })

  it("exige usuário e propaga erro do banco", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null, {}) as never)
    await expect(deleteLessonNote("n1", "l1")).rejects.toThrow("Não autenticado")
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: makeBuilder({ error: { message: "falhou" } }) }) as never)
    await expect(deleteLessonNote("n1", "l1")).rejects.toThrow("falhou")
  })
})

describe("anotação que não existe mais", () => {
  it("editar avisa em vez de fingir que salvou", async () => {
    const notes = makeBuilder({ rows: [] })
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: notes }) as never)
    await expect(updateLessonNote("n1", "l1", "texto")).rejects.toThrow("não encontrada")
    expect(notes.eq).toHaveBeenCalledWith("lesson_id", "l1")
  })

  it("apagar avisa quando nada foi apagado", async () => {
    const notes = makeBuilder({ rows: [] })
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: notes }) as never)
    await expect(deleteLessonNote("n1", "l1")).rejects.toThrow("não encontrada")
  })

  it("revalida também a lista de aulas", async () => {
    const notes = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, { lesson_notes: notes }) as never)
    await deleteLessonNote("n1", "l1")
    expect(revalidatePath).toHaveBeenCalledWith("/lessons")
  })
})
