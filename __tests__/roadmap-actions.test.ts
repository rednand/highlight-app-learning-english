import { describe, it, expect, vi, beforeEach } from "vitest"
import { toggleRoadmapSession } from "../app/actions/roadmap"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))

import { createClient } from "../app/utils/supabase/server"

const mockCreateClient = vi.mocked(createClient)

type MockFn = ReturnType<typeof vi.fn>
type Builder = {
  data: null; error: null
  select: MockFn; eq: MockFn; insert: MockFn; delete: MockFn
}

function makeBuilder(): Builder {
  const b: Builder = {
    data: null, error: null,
    select: vi.fn(), eq: vi.fn(), insert: vi.fn(), delete: vi.fn(),
  }
  b.select.mockReturnValue(b); b.eq.mockReturnValue(b)
  b.insert.mockReturnValue(b); b.delete.mockReturnValue(b)
  return b
}

function makeSupabase(user: unknown) {
  const b = makeBuilder()
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(b),
    _builder: b,
  }
}

describe("toggleRoadmapSession", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sem usuário: não faz chamada ao banco", async () => {
    const supa = makeSupabase(null)
    mockCreateClient.mockResolvedValue(supa as never)
    await toggleRoadmapSession("A1||Basic||1", true)
    expect(supa.from).not.toHaveBeenCalled()
  })

  it("markDone=true: insere na tabela roadmap_progress", async () => {
    const supa = makeSupabase({ id: "u1" })
    mockCreateClient.mockResolvedValue(supa as never)
    await toggleRoadmapSession("A1||Basic||1", true)
    expect(supa.from).toHaveBeenCalledWith("roadmap_progress")
    expect(supa._builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", session_key: "A1||Basic||1" }),
    )
  })

  it("markDone=false: deleta da tabela roadmap_progress", async () => {
    const supa = makeSupabase({ id: "u1" })
    mockCreateClient.mockResolvedValue(supa as never)
    await toggleRoadmapSession("A1||Basic||1", false)
    expect(supa.from).toHaveBeenCalledWith("roadmap_progress")
    expect(supa._builder.delete).toHaveBeenCalled()
    expect(supa._builder.eq).toHaveBeenCalledWith("user_id", "u1")
    expect(supa._builder.eq).toHaveBeenCalledWith("session_key", "A1||Basic||1")
  })
})
