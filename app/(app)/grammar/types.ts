export type GrammarRule = {
  id: string
  slug: string
  title: string
  category: string
  level: string
  structure?: string
  negative?: string
  question?: string
  usage?: string[]
  examples?: string[]
  common_errors?: string[]
  time_expressions?: string[]
  notes?: string
  rules?: Record<string, string>
  tense_changes?: Record<string, string>
  modals?: Record<string, { usage: string[]; examples: string[] }>
  types?: Record<string, { description?: string; examples?: string[]; structure?: string }>
  forms?: Record<string, { structure: string; usage: string; examples: string[] }>
  common_phrasal_verbs?: { verb: string; meaning: string; example: string }[]
  both_with_meaning_change?: Record<string, { gerund: string; infinitive: string }>
  relative_pronouns?: Record<string, string>
  quantifiers?: { countable_only?: string[]; uncountable_only?: string[]; both?: string[] }
  countable?: { description: string; examples: string[] }
  uncountable?: { description: string; examples: string[] }
  irregular?: Record<string, { comparative: string; superlative: string }>
}
