"use client"

import { Volume2 } from "lucide-react"

export default function SpeakButton({ text, className }: { text: string; className?: string }) {
  function speak() {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      type="button"
      onClick={speak}
      title="Ouvir pronúncia"
      className={className ?? "text-gray-600 hover:text-yellow-400 transition-colors shrink-0"}
    >
      <Volume2 size={13} />
    </button>
  )
}
