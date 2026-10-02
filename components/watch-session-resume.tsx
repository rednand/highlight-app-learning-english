"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { consumeResumeOnce, getWatchSessionLessonId } from "../app/lib/watch-session"

export default function WatchSessionResume() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!consumeResumeOnce()) return
    if (pathname !== "/") return
    const lessonId = getWatchSessionLessonId()
    if (lessonId) router.replace(`/lessons/${lessonId}`)
  }, [pathname, router])

  return null
}
