"use server"

export async function fetchExampleSentence(term: string): Promise<{ example: string | null; phonetic: string | null }> {
  const isExpression = term.trim().includes(" ")
  let phonetic: string | null = null
  let example: string | null = null

  if (!isExpression) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term.trim())}`)
      if (res.ok) {
        const json = await res.json()
        phonetic = json?.[0]?.phonetic ?? json?.[0]?.phonetics?.find((p: { text?: string }) => p.text)?.text ?? null
        example = json?.[0]?.meanings
          ?.flatMap((m: { definitions: { example?: string }[] }) => m.definitions)
          ?.find((d: { example?: string }) => d.example)?.example ?? null
        if (example) return { example, phonetic }
      }
    } catch {
    }
  }

  try {
    const res = await fetch(
      `https://tatoeba.org/en/api_v0/search?query=${encodeURIComponent(term.trim())}&from=eng&limit=3`,
      { next: { revalidate: 86400 } }
    )
    if (res.ok) {
      const json = await res.json()
      const sentence = json?.results?.find((r: { text: string }) =>
        r.text.toLowerCase().includes(term.toLowerCase().split(" ")[0])
      )?.text ?? null
      return { example: sentence, phonetic }
    }
  } catch {
  }

  return { example: null, phonetic }
}
