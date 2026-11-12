import { describe, it, expect } from "vitest"
import { extractUncommonWords, splitSentences } from "../app/lib/extract-words"
import { splitByTerm, contextLabel } from "../app/lib/context-utils"

describe("splitSentences", () => {
  it("separa por pontuação final e por quebra de linha", () => {
    expect(splitSentences("I'm sullen. Are you okay?\nWe're drifting apart")).toEqual([
      "I'm sullen.",
      "Are you okay?",
      "We're drifting apart",
    ])
  })

  it("ignora linhas vazias e normaliza espaços", () => {
    expect(splitSentences("  first   line \n\n\n second line ")).toEqual(["first line", "second line"])
  })
})

describe("extractUncommonWords", () => {
  it("guarda a primeira frase em que cada palavra aparece", () => {
    const result = extractUncommonWords("The night is sullen.\nShe stayed sullen and drifting.")
    expect(result).toContainEqual({ term: "sullen", sentence: "The night is sullen." })
    expect(result).toContainEqual({ term: "drifting", sentence: "She stayed sullen and drifting." })
  })

  it("não repete palavras e ignora palavras curtas", () => {
    const terms = extractUncommonWords("Gloomy gloomy GLOOMY day, cat.").map((w) => w.term)
    expect(terms).toEqual(["gloomy"])
  })

  it("trata apóstrofo tipográfico como apóstrofo comum", () => {
    const [first] = extractUncommonWords("She’s wandering")
    expect(first.sentence).toBe("She's wandering")
  })

  it("encurta frases muito longas", () => {
    const long = `${"word ".repeat(60)}serendipity`
    const [first] = extractUncommonWords(long)
    expect(first.sentence.length).toBeLessThanOrEqual(200)
    expect(first.sentence.endsWith("…")).toBe(true)
  })

  it("retorna lista vazia para texto sem palavras", () => {
    expect(extractUncommonWords("123 !!! ...")).toEqual([])
  })
})

describe("splitByTerm", () => {
  it("marca as ocorrências do termo sem diferenciar maiúsculas", () => {
    expect(splitByTerm("Sullen skies, so sullen", "sullen")).toEqual([
      { text: "Sullen", match: true },
      { text: " skies, so ", match: false },
      { text: "sullen", match: true },
    ])
  })

  it("não destaca o termo dentro de outra palavra", () => {
    expect(splitByTerm("Training in the rain", "rain")).toEqual([
      { text: "Training in the ", match: false },
      { text: "rain", match: true },
    ])
  })

  it("aceita apóstrofo tipográfico na frase", () => {
    expect(splitByTerm("I don’t know", "don't")).toEqual([
      { text: "I ", match: false },
      { text: "don’t", match: true },
      { text: " know", match: false },
    ])
  })

  it("devolve a frase inteira quando o termo não aparece", () => {
    expect(splitByTerm("Hello there", "gloomy")).toEqual([{ text: "Hello there", match: false }])
  })

  it("escapa caracteres especiais do termo", () => {
    expect(splitByTerm("What? (really)", "(really)")).toEqual([
      { text: "What? ", match: false },
      { text: "(really)", match: true },
    ])
  })

  it("devolve a frase inteira quando o termo é vazio", () => {
    expect(splitByTerm("Hello there", "  ")).toEqual([{ text: "Hello there", match: false }])
  })
})

describe("contextLabel", () => {
  it("usa um rótulo por tipo de mídia", () => {
    expect(contextLabel("movie")).toBe("Na cena")
    expect(contextLabel("music")).toBe("Na música")
    expect(contextLabel("book")).toBe("No livro")
  })

  it("usa 'Exemplo' para aulas e tipo desconhecido", () => {
    expect(contextLabel("lesson")).toBe("Exemplo")
    expect(contextLabel(null)).toBe("Exemplo")
  })
})
