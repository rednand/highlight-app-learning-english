"use server"

import { createClient } from "../utils/supabase/server"
import { cleanArtistName, cleanTrackTitle, pickLyrics } from "../lib/lyrics-utils"

const LRCLIB_SEARCH = "https://lrclib.net/api/search"

export type LyricsResult = { lyrics: string } | { error: "not_found" | "not_music" | "unavailable" }

async function searchLrclib(params: Record<string, string>): Promise<string | null> {
  const url = `${LRCLIB_SEARCH}?${new URLSearchParams(params).toString()}`
  const res = await fetch(url)
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

  try {
    const exact = artist
      ? await searchLrclib({ track_name: track, artist_name: artist })
      : null
    if (exact) return { lyrics: exact }

    const loose = await searchLrclib({ q: `${track} ${artist}`.trim() })
    if (loose) return { lyrics: loose }

    return { error: "not_found" }
  } catch {
    return { error: "unavailable" }
  }
}
