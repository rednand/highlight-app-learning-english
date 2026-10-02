const STORAGE_KEY = "hl_watch_session"
const RESUMED_KEY = "hl_watch_session_resumed"
const CHANGE_EVENT = "hl-watch-session-change"
const MAX_AGE_MS = 12 * 60 * 60 * 1000

type WatchSession = { lessonId: string; startedAt: number }

function isSession(value: unknown): value is WatchSession {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.lessonId === "string" && typeof v.startedAt === "number"
}

export function getWatchSessionLessonId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isSession(parsed)) return null
    if (Date.now() - parsed.startedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed.lessonId
  } catch {
    return null
  }
}

export function startWatchSession(lessonId: string) {
  try {
    const session: WatchSession = { lessonId, startedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    sessionStorage.setItem(RESUMED_KEY, "1")
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function endWatchSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeWatchSession(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

export function consumeResumeOnce(): boolean {
  try {
    if (sessionStorage.getItem(RESUMED_KEY)) return false
    sessionStorage.setItem(RESUMED_KEY, "1")
    return true
  } catch {
    return false
  }
}
