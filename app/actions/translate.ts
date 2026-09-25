"use server"

export async function translateTerm(term: string): Promise<string | null> {
  const q = term.trim()
  if (!q) return null

  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|pt`)
    if (res.ok) {
      const json = await res.json()
      const translated = json?.responseData?.translatedText
      if (translated && translated.toLowerCase() !== q.toLowerCase()) return translated
    }
  } catch {
  }

  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(q)}`
    )
    if (res.ok) {
      const json = await res.json()
      const translated = json?.[0]?.map((chunk: [string]) => chunk[0]).join("")
      if (translated && translated.toLowerCase() !== q.toLowerCase()) return translated
    }
  } catch {
  }

  return null
}
