export function cleanTrackTitle(title: string): string {
  return title
    .replace(/\s*[([][^)\]]*[)\]]/g, "")
    .replace(/\s+-\s+.*\b(remaster(ed)?|version|live|edit|mix|mono|stereo)\b.*$/i, "")
    .replace(/\s+(feat\.?|ft\.?|featuring)\s+.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function cleanArtistName(artist: string): string {
  return artist
    .split(/\s+(?:feat\.?|ft\.?|featuring)\s+/i)[0]
    .trim()
}

export type LrclibTrack = {
  plainLyrics?: string | null
  instrumental?: boolean
}

export function pickLyrics(results: unknown): string | null {
  if (!Array.isArray(results)) return null
  for (const result of results as LrclibTrack[]) {
    const lyrics = result?.plainLyrics?.trim()
    if (lyrics && !result.instrumental) return lyrics
  }
  return null
}
