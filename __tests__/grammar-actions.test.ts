import { describe, it, expect, vi, beforeEach } from "vitest"
import { saveQuizResult } from "../app/actions/grammar"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { createClient } from "../app/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const mockCreateClient = vi.mocked(createClient)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockRedirect = vi.mocked(redirect)

function makeSupabase(user: unknown) {
  const builder = {
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    eq: vi.fn(),
    select: vi.fn(),
  }
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(builder),
    _builder: builder,
  }
}

describe("saveQuizResult", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sem usuário: redireciona para /login", async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null) as never)
    await saveQuizResult("simple-present", 4, 5).catch(() => {})
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("com usuário: faz upsert com os dados corretos", async () => {
    const supa = makeSupabase({ id: "user-1" })
    mockCreateClient.mockResolvedValue(supa as never)

    await saveQuizResult("simple-past", 3, 5)

    expect(supa._builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        rule_slug: "simple-past",
        correct: 3,
        total: 5,
      }),
      { onConflict: "user_id,rule_slug" },
    )
  })

  it("com usuário: revalida o path do quiz", async () => {
    const supa = makeSupabase({ id: "user-1" })
    mockCreateClient.mockResolvedValue(supa as never)

    await saveQuizResult("modal-verbs", 5, 5)

    expect(mockRevalidatePath).toHaveBeenCalledWith("/grammar/quiz")
  })

  it("resultado perfeito (5/5) é salvo corretamente", async () => {
    const supa = makeSupabase({ id: "user-2" })
    mockCreateClient.mockResolvedValue(supa as never)

    await saveQuizResult("articles", 5, 5)

    expect(supa._builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ correct: 5, total: 5 }),
      expect.anything(),
    )
  })

  it("resultado zero (0/5) é salvo corretamente", async () => {
    const supa = makeSupabase({ id: "user-3" })
    mockCreateClient.mockResolvedValue(supa as never)

    await saveQuizResult("wish-if-only", 0, 5)

    expect(supa._builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ correct: 0, total: 5 }),
      expect.anything(),
    )
  })
})
