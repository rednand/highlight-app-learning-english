"use server"

async function translateWithMyMemory(q: string): Promise<string | null> {
  const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|pt`)
  if (!res.ok) return null
  const json = await res.json()
  const translated = json?.responseData?.translatedText
  return translated && translated.toLowerCase() !== q.toLowerCase() ? translated : null
}

async function translateWithDeepL(q: string): Promise<string | null> {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) return null

  const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com"
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: [q], source_lang: "EN", target_lang: "PT-BR" }),
  })
  if (!res.ok) return null
  const json = await res.json()
  const translated = json?.translations?.[0]?.text
  return translated && translated.toLowerCase() !== q.toLowerCase() ? translated : null
}

export async function translateTerm(term: string): Promise<string | null> {
  const q = term.trim()
  if (!q) return null

  for (const translate of [translateWithMyMemory, translateWithDeepL]) {
    try {
      const result = await translate(q)
      if (result) return result
    } catch {
    }
  }

  return null
}
