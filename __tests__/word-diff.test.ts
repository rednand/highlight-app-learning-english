import { describe, it, expect } from "vitest"
import { wordDiff } from "../app/lib/word-diff"

describe("wordDiff", () => {
  it("marks every word as matching when texts are equal ignoring case, accents and punctuation", () => {
    const result = wordDiff("Ele já tinha saído.", "ele ja tinha saido")
    expect(result.mine.every((t) => t.match)).toBe(true)
    expect(result.reference.every((t) => t.match)).toBe(true)
  })

  it("flags wrong words on both sides", () => {
    const result = wordDiff("Ele tinha comido o bolo", "Ele já tinha comido a torta")
    expect(result.mine.filter((t) => !t.match).map((t) => t.text)).toEqual(["o", "bolo"])
    expect(result.reference.filter((t) => !t.match).map((t) => t.text)).toEqual(["já", "a", "torta"])
  })

  it("keeps original spelling in the output tokens", () => {
    const result = wordDiff("Olá, Mundo!", "olá mundo")
    expect(result.mine.map((t) => t.text)).toEqual(["Olá,", "Mundo!"])
  })

  it("handles empty input", () => {
    const result = wordDiff("", "algum texto")
    expect(result.mine).toEqual([])
    expect(result.reference.every((t) => !t.match)).toBe(true)
  })
})
