import { describe, it, expect, vi, beforeEach } from "vitest"
import { deleteAccount } from "../app/actions/account"

vi.mock("../app/utils/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("../app/utils/supabase/admin", () => ({ createAdminClient: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))

import { createClient } from "../app/utils/supabase/server"
import { createAdminClient } from "../app/utils/supabase/admin"

const mockCreateClient = vi.mocked(createClient)
const mockCreateAdmin = vi.mocked(createAdminClient)

function makeForm(value: string) {
  const form = new FormData()
  form.set("confirmation", value)
  return form
}

function makeServer(user: unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  }
}

function makeAdmin(options: { tableError?: boolean; userError?: boolean } = {}) {
  const deleteBuilder = {
    eq: vi.fn().mockResolvedValue({ error: options.tableError ? { message: "x" } : null }),
  }
  return {
    from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnValue(deleteBuilder) }),
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: options.userError ? { message: "x" } : null }),
      },
    },
  }
}

describe("deleteAccount", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sem usuario: redireciona para login", async () => {
    mockCreateClient.mockResolvedValue(makeServer(null) as never)
    await expect(deleteAccount(null, makeForm("EXCLUIR"))).rejects.toThrow("REDIRECT:/login")
  })

  it("confirmacao incorreta: nao apaga nada", async () => {
    mockCreateClient.mockResolvedValue(makeServer({ id: "u1" }) as never)
    const result = await deleteAccount(null, makeForm("excluir"))
    expect(result?.error).toBeTruthy()
    expect(mockCreateAdmin).not.toHaveBeenCalled()
  })

  it("sucesso: apaga dados, remove usuario e redireciona", async () => {
    const server = makeServer({ id: "u1" })
    const admin = makeAdmin()
    mockCreateClient.mockResolvedValue(server as never)
    mockCreateAdmin.mockReturnValue(admin as never)

    await expect(deleteAccount(null, makeForm("EXCLUIR"))).rejects.toThrow("REDIRECT:/login")
    expect(admin.from).toHaveBeenCalledWith("flashcards")
    expect(admin.from).toHaveBeenCalledWith("lessons")
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith("u1")
    expect(server.auth.signOut).toHaveBeenCalled()
  })

  it("erro ao apagar tabela: retorna erro e nao remove o usuario", async () => {
    const admin = makeAdmin({ tableError: true })
    mockCreateClient.mockResolvedValue(makeServer({ id: "u1" }) as never)
    mockCreateAdmin.mockReturnValue(admin as never)

    const result = await deleteAccount(null, makeForm("EXCLUIR"))
    expect(result?.error).toBeTruthy()
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled()
  })

  it("erro ao remover usuario: retorna erro", async () => {
    mockCreateClient.mockResolvedValue(makeServer({ id: "u1" }) as never)
    mockCreateAdmin.mockReturnValue(makeAdmin({ userError: true }) as never)

    const result = await deleteAccount(null, makeForm("EXCLUIR"))
    expect(result?.error).toBeTruthy()
  })
})
