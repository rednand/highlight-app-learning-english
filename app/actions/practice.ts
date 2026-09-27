"use server"

import { createClient } from "../utils/supabase/server"

export type PracticeText = {
  text: string
  reference_translation: string
}

export async function generatePracticeText(ruleTitle: string, ruleStructure: string): Promise<PracticeText | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const prompt = `Write a short English text (3 to 4 sentences) for a Brazilian student learning English to translate into Portuguese. The text must use the "${ruleTitle}" grammar structure (${ruleStructure}) naturally and repeatedly, at an intermediate level. Also provide a natural Portuguese (Brazil) translation of that exact text.

Respond with ONLY a JSON object, no markdown, in this exact shape:
{"text": "...", "reference_translation": "..."}`

  try {
    let res: Response | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      )
      if (res.ok || res.status !== 503) break
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
    }
    if (!res || !res.ok) return null

    const json = await res.json()
    const content: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return null

    const parsed: unknown = JSON.parse(match[0])
    if (
      typeof parsed !== "object" || parsed === null ||
      typeof (parsed as Record<string, unknown>).text !== "string" ||
      typeof (parsed as Record<string, unknown>).reference_translation !== "string"
    ) return null

    return parsed as PracticeText
  } catch {
    return null
  }
}

export async function savePracticeAttempt(params: {
  ruleSlug: string
  direction: "en-pt" | "pt-en"
  sourceText: string
  referenceTranslation: string
  myTranslation: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("practice_attempts").insert({
    user_id: user.id,
    rule_slug: params.ruleSlug,
    direction: params.direction,
    source_text: params.sourceText,
    reference_translation: params.referenceTranslation,
    my_translation: params.myTranslation,
  })
}
