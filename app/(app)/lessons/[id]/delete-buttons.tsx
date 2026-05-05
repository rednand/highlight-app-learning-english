"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteLesson } from "../../../actions/lessons"
import { deleteLessonItem } from "../../../actions/items"

export function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    toast("Excluir esta aula?", {
      description: "Todas as palavras também serão removidas.",
      action: {
        label: "Excluir",
        onClick: () => startTransition(() => deleteLesson(lessonId)),
      },
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 disabled:opacity-40 transition-colors"
    >
      <Trash2 size={13} />
      {isPending ? "Excluindo…" : "Excluir aula"}
    </button>
  )
}

export function DeleteItemButton({ itemId, lessonId }: { itemId: string; lessonId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => deleteLessonItem(itemId, lessonId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Excluir"
      className="text-gray-700 hover:text-red-400 disabled:opacity-40 transition-colors shrink-0"
    >
      <Trash2 size={13} className={isPending ? "animate-pulse" : ""} />
    </button>
  )
}
