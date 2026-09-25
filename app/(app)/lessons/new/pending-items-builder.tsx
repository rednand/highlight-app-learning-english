"use client"

import { useState } from "react"
import { Plus, Wand2, Trash2 } from "lucide-react"
import { translateTerm } from "../../../actions/translate"
import { fetchExampleSentence } from "../../../actions/examples"

type PendingItem = {
  term: string
  translation: string
  type: string
  context: string
  phonetic: string
  my_sentence: string
}

const TYPE_LABEL: Record<string, string> = {
  word: "Palavra",
  expression: "Expressão",
  phrase: "Frase",
}

export default function PendingItemsBuilder() {
  const [items, setItems] = useState<PendingItem[]>([])
  const [term, setTerm] = useState("")
  const [translation, setTranslation] = useState("")
  const [type, setType] = useState("word")
  const [context, setContext] = useState("")
  const [phonetic, setPhonetic] = useState("")
  const [mySentence, setMySentence] = useState("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isFetchingExample, setIsFetchingExample] = useState(false)

  const inputClass = "w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors"

  async function suggestTranslation() {
    if (!term.trim()) return
    setTranslation("")
    setIsSuggesting(true)
    try {
      const suggested = await translateTerm(term)
      if (suggested) setTranslation(suggested)
    } finally {
      setIsSuggesting(false)
    }
  }

  async function fetchExample() {
    if (!term.trim()) return
    setContext("")
    setIsFetchingExample(true)
    try {
      const { example, phonetic: ipa } = await fetchExampleSentence(term)
      if (example) setContext(example)
      if (ipa) setPhonetic(ipa)
    } finally {
      setIsFetchingExample(false)
    }
  }

  function addItem() {
    if (!term.trim()) return
    setItems(prev => [...prev, { term, translation, type, context, phonetic, my_sentence: mySentence }])
    setTerm("")
    setTranslation("")
    setType("word")
    setContext("")
    setPhonetic("")
    setMySentence("")
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        Palavras / expressões{" "}
        <span className="text-gray-700 normal-case font-normal tracking-normal">(opcional)</span>
      </label>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-3 p-3 bg-[#0f0f0f] border border-white/5 rounded-xl">
              <div className="min-w-0">
                <p className="text-white text-sm truncate">
                  {item.term}
                  {item.translation && <span className="text-gray-400"> — {item.translation}</span>}
                </p>
                <span className="text-[10px] text-gray-600">{TYPE_LABEL[item.type] ?? item.type}</span>
              </div>
              <button type="button" onClick={() => removeItem(i)} className="shrink-0 text-gray-700 hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="p-4 bg-[#0f0f0f] border border-dashed border-white/10 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Palavra / expressão"
            className={inputClass}
          />
          <div className="relative">
            <input
              value={translation}
              onChange={e => setTranslation(e.target.value)}
              placeholder="Tradução"
              className={`${inputClass} pr-9`}
            />
            <button
              type="button"
              onClick={suggestTranslation}
              disabled={isSuggesting || !term.trim()}
              title="Sugerir tradução"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400 disabled:opacity-30 transition-colors"
            >
              <Wand2 size={14} className={isSuggesting ? "animate-pulse" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-yellow-400/50 transition-colors"
          >
            <option value="word">Palavra</option>
            <option value="expression">Expressão</option>
            <option value="phrase">Frase</option>
          </select>
          <div className="relative">
            <input
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Exemplo de uso"
              className={`${inputClass} pr-9`}
            />
            <button
              type="button"
              onClick={fetchExample}
              disabled={isFetchingExample || !term.trim()}
              title="Buscar exemplo de uso"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400 disabled:opacity-30 transition-colors"
            >
              <Wand2 size={14} className={isFetchingExample ? "animate-pulse" : ""} />
            </button>
          </div>
        </div>

        {phonetic && <p className="text-xs font-mono text-gray-500">{phonetic}</p>}

        <textarea
          value={mySentence}
          onChange={e => setMySentence(e.target.value)}
          rows={2}
          placeholder="Minha frase (opcional)"
          className={`${inputClass} resize-none`}
        />

        <button
          type="button"
          onClick={addItem}
          disabled={!term.trim()}
          className="flex items-center gap-2 w-full py-2.5 border border-yellow-400/30 hover:border-yellow-400/60 disabled:opacity-40 disabled:hover:border-yellow-400/30 text-yellow-400 text-sm font-bold rounded-lg transition-colors justify-center"
        >
          <Plus size={14} />
          Adicionar à lista
        </button>
      </div>
    </div>
  )
}
