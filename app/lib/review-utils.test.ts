import { describe, it, expect } from "vitest"
import { buildMultipleChoiceOptions } from "./review-utils"

describe("buildMultipleChoiceOptions", () => {
  const pool = ["gato", "cachorro", "pássaro", "peixe", "cavalo", "coelho"]

  it("returns exactly 4 options", () => {
    const result = buildMultipleChoiceOptions("casa", pool)
    expect(result).toHaveLength(4)
  })

  it("has exactly one correct option", () => {
    const result = buildMultipleChoiceOptions("casa", pool)
    const correct = result.filter((o) => o.isCorrect)
    expect(correct).toHaveLength(1)
    expect(correct[0].text).toBe("casa")
  })

  it("all texts are distinct", () => {
    const result = buildMultipleChoiceOptions("casa", pool)
    const texts = result.map((o) => o.text)
    expect(new Set(texts).size).toBe(4)
  })

  it("assigns labels A, B, C, D in order", () => {
    const result = buildMultipleChoiceOptions("casa", pool)
    expect(result.map((o) => o.label)).toEqual(["A", "B", "C", "D"])
  })

  it("correct answer position varies across multiple calls (shuffle check)", () => {
    const positions = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const result = buildMultipleChoiceOptions("casa", pool)
      const correctOpt = result.find((o) => o.isCorrect)!
      positions.add(correctOpt.label)
    }
    expect(positions.size).toBeGreaterThan(1)
  })

  it("works when pool has exactly 3 items", () => {
    const tinyPool = ["a", "b", "c"]
    const result = buildMultipleChoiceOptions("correto", tinyPool)
    expect(result).toHaveLength(4)
    expect(result.filter((o) => o.isCorrect)).toHaveLength(1)
    const texts = result.map((o) => o.text)
    expect(new Set(texts).size).toBe(4)
  })

  it("excludes the correct answer from distractors", () => {
    const poolWithCorrect = ["casa", "gato", "cachorro", "pássaro"]
    const result = buildMultipleChoiceOptions("casa", poolWithCorrect)
    const wrongOptions = result.filter((o) => !o.isCorrect)
    wrongOptions.forEach((o) => expect(o.text).not.toBe("casa"))
  })

  it("distractors are selected from pool", () => {
    const result = buildMultipleChoiceOptions("casa", pool)
    const wrongTexts = result.filter((o) => !o.isCorrect).map((o) => o.text)
    wrongTexts.forEach((text) => expect(pool).toContain(text))
  })
})
