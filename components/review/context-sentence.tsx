import { splitByTerm } from "../../app/lib/context-utils"

export default function ContextSentence({ label, sentence, term }: { label: string; sentence: string; term: string }) {
  return (
    <div className="bg-white/5 rounded-xl px-4 py-3 text-left">
      <p className="text-[10px] text-fg-subtle uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className="text-fg-soft text-sm italic">
        &ldquo;
        {splitByTerm(sentence, term).map((part, i) =>
          part.match
            ? <strong key={i} className="text-brand not-italic font-semibold">{part.text}</strong>
            : <span key={i}>{part.text}</span>,
        )}
        &rdquo;
      </p>
    </div>
  )
}
