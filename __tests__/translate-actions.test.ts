import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { translateTerm } from "../app/actions/translate"

function jsonResponse(ok: boolean, body: unknown) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response)
}

const myMemory = (translatedText: string) => ({ responseData: { translatedText } })
const deepl = (text: string) => ({ translations: [{ text }] })

describe("translateTerm", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    delete process.env.DEEPL_API_KEY
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it("retorna null para termo vazio sem chamar a API", async () => {
    expect(await translateTerm("   ")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("usa a tradução do MyMemory quando ela existe", async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(true, myMemory("mal-humorado")))
    expect(await translateTerm("sullen")).toBe("mal-humorado")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("cai para o DeepL free quando o MyMemory devolve o próprio termo", async () => {
    process.env.DEEPL_API_KEY = "abc:fx"
    fetchMock
      .mockReturnValueOnce(jsonResponse(true, myMemory("sussed")))
      .mockReturnValueOnce(jsonResponse(true, deepl("sacado")))
    expect(await translateTerm("sussed")).toBe("sacado")
    expect(fetchMock.mock.calls[1][0]).toBe("https://api-free.deepl.com/v2/translate")
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("DeepL-Auth-Key abc:fx")
  })

  it("usa o endpoint pago do DeepL para chaves sem sufixo :fx", async () => {
    process.env.DEEPL_API_KEY = "paid-key"
    fetchMock
      .mockReturnValueOnce(jsonResponse(false, {}))
      .mockReturnValueOnce(jsonResponse(true, deepl("sacado")))
    expect(await translateTerm("sussed")).toBe("sacado")
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.deepl.com/v2/translate")
  })

  it("retorna null quando o MyMemory falha e não há chave do DeepL", async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(true, myMemory("sussed")))
    expect(await translateTerm("sussed")).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retorna null quando o DeepL também devolve o próprio termo", async () => {
    process.env.DEEPL_API_KEY = "abc:fx"
    fetchMock
      .mockReturnValueOnce(jsonResponse(true, myMemory("sussed")))
      .mockReturnValueOnce(jsonResponse(true, deepl("Sussed")))
    expect(await translateTerm("sussed")).toBeNull()
  })

  it("ignora erros de rede e tenta o próximo serviço", async () => {
    process.env.DEEPL_API_KEY = "abc:fx"
    fetchMock
      .mockRejectedValueOnce(new Error("network"))
      .mockReturnValueOnce(jsonResponse(true, deepl("sacado")))
    expect(await translateTerm("sussed")).toBe("sacado")
  })
})
