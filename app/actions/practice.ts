"use server"

import { createClient } from "../utils/supabase/server"
import { revalidatePath } from "next/cache"

export type PracticeText = {
  text: string
  reference_translation: string
}

export type PracticeError = {
  trecho: string
  correcao: string
  explicacao: string
}

export type PracticeFeedback = {
  nota: number
  resumo: string
  erros: PracticeError[]
}

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.7-flash"]

async function callGemini(prompt: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  for (let round = 0; round < 2; round++) {
    if (round > 0) await new Promise((resolve) => setTimeout(resolve, 1500))
    for (const model of GEMINI_MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        )
        if (!res.ok) continue

        const json = await res.json()
        const content: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
        const match = content.match(/\{[\s\S]*\}/)
        if (match) return JSON.parse(match[0])
      } catch {
        continue
      }
    }
  }
  return null
}

function isPracticeText(value: unknown): value is PracticeText {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.text === "string" && typeof v.reference_translation === "string"
}

function isPracticeFeedback(value: unknown): value is PracticeFeedback {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.nota === "number" &&
    typeof v.resumo === "string" &&
    Array.isArray(v.erros) &&
    v.erros.every((e: unknown) => {
      if (typeof e !== "object" || e === null) return false
      const err = e as Record<string, unknown>
      return typeof err.trecho === "string" && typeof err.correcao === "string" && typeof err.explicacao === "string"
    })
  )
}

export async function generatePracticeText(ruleTitle: string, ruleStructure: string): Promise<PracticeText | null> {
  const prompt = `Write a short English text (3 to 4 sentences) for a Brazilian student learning English to translate into Portuguese. The text must use the "${ruleTitle}" grammar structure (${ruleStructure}) naturally and repeatedly, at an intermediate level. Also provide a natural Portuguese (Brazil) translation of that exact text.

Respond with ONLY a JSON object, no markdown, in this exact shape:
{"text": "...", "reference_translation": "..."}`

  const parsed = await callGemini(prompt)
  return isPracticeText(parsed) ? parsed : null
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

  revalidatePath("/grammar/practice/history")
}

export async function correctPracticeAttempt(id: string): Promise<PracticeFeedback | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: attempt } = await supabase
    .from("practice_attempts")
    .select("direction, source_text, reference_translation, my_translation")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (!attempt) return null

  const target = attempt.direction === "en-pt" ? "Portuguese (Brazil)" : "English"
  const prompt = `A Brazilian student learning English translated a text into ${target}. Compare the student's translation with the original text and point out every mistake (grammar, vocabulary, verb tense, word order, missing or wrong meaning). Ignore small stylistic differences that are still correct. Write all explanations in Portuguese (Brazil), short and clear.

Original text:
${attempt.source_text}

Reference translation:
${attempt.reference_translation}

Student translation:
${attempt.my_translation}

Respond with ONLY a JSON object, no markdown, in this exact shape:
{"nota": <integer from 0 to 10>, "resumo": "<one sentence overall assessment>", "erros": [{"trecho": "<the wrong part as the student wrote it>", "correcao": "<how it should be>", "explicacao": "<why>"}]}
If there are no mistakes, return an empty "erros" array.`

  const parsed = await callGemini(prompt)
  if (!isPracticeFeedback(parsed)) return null

  await supabase
    .from("practice_attempts")
    .update({ ai_feedback: JSON.stringify(parsed) })
    .eq("id", id)
    .eq("user_id", user.id)

  revalidatePath("/grammar/practice/history")
  return parsed
}
