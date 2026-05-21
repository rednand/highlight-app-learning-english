"use client"

import type { ChoiceOption, SelectionState } from "../../app/lib/review-utils"

type Props = {
  options: ChoiceOption[]
  selection: SelectionState
  onSelect: (label: "A" | "B" | "C" | "D") => void
}

export default function MultipleChoiceOptions({ options, selection, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        let style =
          "flex items-start gap-2 p-3 rounded-xl border text-left text-sm transition-colors w-full"

        if (selection === null) {
          style +=
            " text-gray-300 border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/20 cursor-pointer"
        } else if (option.isCorrect) {
          style += " text-green-300 border-green-500/40 bg-green-500/10 cursor-default"
        } else if (option.label === selection.selectedLabel) {
          style += " text-red-300 border-red-500/40 bg-red-500/10 cursor-default"
        } else {
          style += " text-gray-600 border-white/5 bg-transparent cursor-default opacity-40"
        }

        return (
          <button
            key={option.label}
            onClick={() => selection === null && onSelect(option.label)}
            disabled={selection !== null}
            className={style}
            aria-pressed={selection?.selectedLabel === option.label}
          >
            <span className="shrink-0 w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center bg-white/5 border border-white/10">
              {option.label}
            </span>
            <span className="leading-snug">{option.text}</span>
          </button>
        )
      })}
    </div>
  )
}
