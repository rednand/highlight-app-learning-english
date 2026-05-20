import { describe, it, expect, vi, afterEach } from "vitest"
import { fetchExampleSentence } from "../app/actions/examples"

function mockResponse(ok: boolean, json: unknown) {
  return Promise.resolve({ ok, json: () => Promise.resolve(json) })
}

afterEach(() => vi.unstubAllGlobals())

describe("fetchExampleSentence", () => {
  describe("palavra simples (single word)", () => {
    it("retorna exemplo e fonética do Dictionary API quando disponíveis", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          phonetic: "/hɛˈloʊ/",
          phonetics: [],
          meanings: [{ definitions: [{ example: "Hello, world!" }] }],
        }],
      }))

      const result = await fetchExampleSentence("hello")
      expect(result.phonetic).toBe("/hɛˈloʊ/")
      expect(result.example).toBe("Hello, world!")
    })

    it("usa phonetics array quando phonetic principal é null", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{
          phonetic: null,
          phonetics: [{ text: "/rʌn/" }],
          meanings: [{ definitions: [{ example: "I run every day." }] }],
        }],
      }))

      const result = await fetchExampleSentence("run")
      expect(result.phonetic).toBe("/rʌn/")
      expect(result.example).toBe("I run every day.")
    })

    it("sem exemplo no dicionário: cai para Tatoeba", async () => {
      let callCount = 0
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return mockResponse(true, [{
            phonetic: "/wɜːrd/",
            phonetics: [],
            meanings: [{ definitions: [{ example: undefined }] }],
          }])
        }
        return mockResponse(true, {
          results: [{ text: "A word to the wise." }],
        })
      }))

      const result = await fetchExampleSentence("word")
      expect(result.phonetic).toBe("/wɜːrd/")
      expect(result.example).toBe("A word to the wise.")
    })

    it("Dictionary API retorna erro: cai para Tatoeba", async () => {
      let callCount = 0
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) return mockResponse(false, null)
        return mockResponse(true, {
          results: [{ text: "Run faster." }],
        })
      }))

      const result = await fetchExampleSentence("run")
      expect(result.example).toBe("Run faster.")
    })

    it("Dictionary API lança exceção: cai para Tatoeba", async () => {
      let callCount = 0
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) return Promise.reject(new Error("network error"))
        return mockResponse(true, {
          results: [{ text: "Jump high." }],
        })
      }))

      const result = await fetchExampleSentence("jump")
      expect(result.example).toBe("Jump high.")
    })
  })

  describe("expressão (múltiplas palavras)", () => {
    it("ignora Dictionary API e vai direto ao Tatoeba", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse(true, {
        results: [{ text: "Break a leg!" }],
      }))
      vi.stubGlobal("fetch", mockFetch)

      const result = await fetchExampleSentence("break a leg")
      expect(result.example).toBe("Break a leg!")
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe("ambas as APIs falham", () => {
    it("retorna { example: null, phonetic: null }", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(false, null)))

      const result = await fetchExampleSentence("hello")
      expect(result).toEqual({ example: null, phonetic: null })
    })

    it("Tatoeba lança exceção: retorna { example: null, phonetic: null }", async () => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() =>
        Promise.reject(new Error("network fail")),
      ))

      const result = await fetchExampleSentence("hello")
      expect(result).toEqual({ example: null, phonetic: null })
    })

    it("Tatoeba não tem resultado compatível: retorna example null", async () => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() =>
        mockResponse(true, { results: [{ text: "Unrelated sentence." }] }),
      ))

      const result = await fetchExampleSentence("xyzqwerty")
      expect(result.example).toBeNull()
    })
  })
})
