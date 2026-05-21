"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import Image from "next/image"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  if (!deferredPrompt || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[65] p-4 pb-20 md:pb-4 pointer-events-none">
      <div className="max-w-sm mx-auto bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl pointer-events-auto">
        <Image src="/icon.svg" alt="Highlight" width={36} height={36} className="rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">Instalar o Highlight</p>
          <p className="text-gray-500 text-xs mt-0.5 leading-snug">Acesse mais rápido pela sua tela inicial</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-full hover:bg-yellow-300 transition-colors"
          >
            <Download size={11} />
            Instalar
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-600 hover:text-white transition-colors p-1"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
