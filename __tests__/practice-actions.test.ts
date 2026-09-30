import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { generatePracticeText, savePracticeAttempt, correctPracticeAttempt } from "../app/actions/practice"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { createClient } from "../app/utils/supabase/server"
import { revalidatePath } from "next/cache"

const mockCreateClient = vi.mocked(createClient)
const fetchMock = vi.fn()

function geminiResponse(ok: boolean, text: string, status = ok ? 200 : 503) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text }] } }] }),
  } as Response)
}

function makeBuilder(single: unknown = { data: null }) {
  const b: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(), eq: vi.fn(), insert: vi.fn(), update: vi.fn(),
    single: vi.fn().mockResolvedValue(single),
  }
  for (const k of ["select", "eq", "insert", "update"]) b[k].mockReturnValue(b)
  return b
}

function makeSupabase(user: unknown, builder = makeBuilder()) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(builder),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", fetchMock)
  process.env.GEMINI_API_KEY = "gem-key"
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe("generatePracticeText", () => {
  it("retorna null sem GEMINI_API_KEY", async () => {
    delete process.env.GEMINI_API_KEY
    expect(await generatePracticeText("Past Perfect", "had + pp")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("devolve texto e tradução quando o modelo responde JSON válido", async () => {
    fetchMock.mockReturnValueOnce(geminiResponse(true, '```json\n{"text":"I had eaten.","reference_translation":"Eu tinha comido."}\n```'))
    expect(await generatePracticeText("Past Perfect", "had + pp")).toEqual({
      text: "I had eaten.",
      reference_translation: "Eu tinha comido.",
    })
    expect(fetchMock.mock.calls[0][0]).toContain("gemini-3.8-flash")
  })

  it("tenta o próximo modelo quando o primeiro está sobrecarregado", async () => {
    fetchMock
      .mockReturnValueOnce(geminiResponse(false, ""))
      .mockReturnValueOnce(geminiResponse(true, '{"text":"a","reference_translation":"b"}'))
    expect(await generatePracticeText("Past Perfect", "")).toEqual({ text: "a", reference_translation: "b" })
    expect(fetchMock.mock.calls[1][0]).toContain("gemini-3.5-flash")
  })

  it("retorna null quando o JSON não tem o formato esperado", async () => {
    fetchMock.mockReturnValueOnce(geminiResponse(true, '{"foo":1}'))
    expect(await generatePracticeText("Past Perfect", "")).toBeNull()
  })

  it("retorna null quando todos os modelos falham", async () => {
    fetchMock.mockImplementation(() => geminiResponse(false, ""))
    expect(await generatePracticeText("Past Perfect", "")).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(6)
  }, 10000)
})

describe("savePracticeAttempt", () => {
  const params = {
    ruleSlug: "past-perfect",
    direction: "pt-en" as const,
    sourceText: "Eu tinha comido.",
    referenceTranslation: "I had eaten.",
    myTranslation: "I have eat.",
  }

  it("não grava nada sem usuário", async () => {
    const b = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase(null, b) as never)
    await savePracticeAttempt(params)
    expect(b.insert).not.toHaveBeenCalled()
  })

  it("grava a tentativa com os campos do banco e revalida o histórico", async () => {
    const b = makeBuilder()
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, b) as never)
    await savePracticeAttempt(params)
    expect(b.insert).toHaveBeenCalledWith({
      user_id: "u1",
      rule_slug: "past-perfect",
      direction: "pt-en",
      source_text: "Eu tinha comido.",
      reference_translation: "I had eaten.",
      my_translation: "I have eat.",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/grammar/practice/history")
  })
})

describe("correctPracticeAttempt", () => {
  const attempt = {
    direction: "pt-en",
    source_text: "Eu tinha comido.",
    reference_translation: "I had eaten.",
    my_translation: "I have eat.",
  }
  const feedback = {
    nota: 4,
    resumo: "Tempo verbal errado.",
    erros: [{ trecho: "have eat", correcao: "had eaten", explicacao: "Use o past perfect." }],
  }

  it("retorna null sem usuário", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null) as never)
    expect(await correctPracticeAttempt("a1")).toBeNull()
  })

  it("retorna null quando a tentativa não existe", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, makeBuilder({ data: null })) as never)
    expect(await correctPracticeAttempt("a1")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("salva e devolve a correção da IA", async () => {
    const b = makeBuilder({ data: attempt })
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, b) as never)
    fetchMock.mockReturnValueOnce(geminiResponse(true, JSON.stringify(feedback)))

    expect(await correctPracticeAttempt("a1")).toEqual(feedback)
    expect(b.update).toHaveBeenCalledWith({ ai_feedback: JSON.stringify(feedback) })
    expect(b.eq).toHaveBeenCalledWith("user_id", "u1")
    const prompt = JSON.parse(fetchMock.mock.calls[0][1].body).contents[0].parts[0].text
    expect(prompt).toContain("into English")
    expect(prompt).toContain("I have eat.")
  })

  it("não salva quando a resposta da IA vem em formato inválido", async () => {
    const b = makeBuilder({ data: attempt })
    mockCreateClient.mockResolvedValue(makeSupabase({ id: "u1" }, b) as never)
    fetchMock.mockReturnValueOnce(geminiResponse(true, '{"nota":"dez","resumo":"x","erros":[]}'))

    expect(await correctPracticeAttempt("a1")).toBeNull()
    expect(b.update).not.toHaveBeenCalled()
  })
})
