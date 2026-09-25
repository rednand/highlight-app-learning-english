"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

export default function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? pendingLabel ?? children : children}
    </button>
  )
}
