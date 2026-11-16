"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export type NoteImage = { key: string; url: string }

/** Miniaturas das imagens de uma anotação; tocar abre em tela cheia. */
export default function NoteImages({
  images,
  onRemove,
  removing,
}: {
  images: NoteImage[]
  onRemove?: (key: string) => void
  removing?: string | null
}) {
  const [open, setOpen] = useState<NoteImage | null>(null)
  const router = useRouter()
  const refreshed = useRef(false)

  // Link vencido (a tela ficou aberta muito tempo): busca links novos uma vez.
  function handleError(image: NoteImage) {
    if (refreshed.current || image.url.startsWith("blob:")) return
    refreshed.current = true
    router.refresh()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (images.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((image) => (
          <div key={image.key} className={`relative aspect-square ${removing === image.key ? "opacity-40" : ""}`}>
            <button
              type="button"
              onClick={() => setOpen(image)}
              className="block w-full h-full rounded-xl overflow-hidden bg-raised border border-line"
              aria-label="Abrir imagem"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" loading="lazy" onError={() => handleError(image)} className="w-full h-full object-cover" />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(image.key)}
                disabled={Boolean(removing)}
                aria-label="Tirar imagem"
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-page border border-line text-fg-muted hover:text-note-red disabled:opacity-40 flex items-center justify-center"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Imagem da anotação"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[80] bg-page/95 flex items-center justify-center p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open.url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-raised text-white flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  )
}
