"use server"

import { createClient } from "../utils/supabase/server"
import { cleanArtistName, cleanTrackTitle, pickLyrics } from "../lib/lyrics-utils"

const LRCLIB_SEARCH = "https://lrclib.net/api/search"
const TIMEOUT_MS = 8000

export type LyricsResult = { lyrics: string } | { error: "not_found" | "not_music" | "unavailable" }

async function searchLrclib(params: Record<string, string>): Promise<string | null> {
  const url = `${LRCLIB_SEARCH}?${new URLSearchParams(params).toString()}`
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`lrclib ${res.status}`)
  return pickLyrics(await res.json())
}

export async function fetchLyrics(lessonId: string): Promise<LyricsResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "unavailable" }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("title, music_artist, source_type")
    .eq("id", lessonId)
    .eq("user_id", user.id)
    .single()

  if (!lesson || lesson.source_type !== "music") return { error: "not_music" }

  const track = cleanTrackTitle(lesson.title)
  const artist = cleanArtistName(lesson.music_artist ?? "")

  let failed = false
  if (artist) {
    try {
      const exact = await searchLrclib({ track_name: track, artist_name: artist })
      if (exact) return { lyrics: exact }
    } catch {
      failed = true
    }
  }

  try {
    const loose = await searchLrclib({ q: `${track} ${artist}`.trim() })
    if (loose) return { lyrics: loose }
  } catch {
    failed = true
  }

  return { error: failed ? "unavailable" : "not_found" }
}
