"use server"

export async function fetchExampleSentence(term: string): Promise<string | null> {
  const isExpression = term.trim().includes(" ")

  if (!isExpression) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term.trim())}`)
      if (res.ok) {
        const json = await res.json()
        const example = json?.[0]?.meanings
          ?.flatMap((m: { definitions: { example?: string }[] }) => m.definitions)
          ?.find((d: { example?: string }) => d.example)?.example
        if (example) return example
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
      )?.text
      if (sentence) return sentence
    }
  } catch {
  }

  return null
}
