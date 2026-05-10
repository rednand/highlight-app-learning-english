"use server"

export type TMDBResult = {
  tmdb_id: number
  tmdb_type: "movie" | "tv"
  title: string
  poster_path: string | null
  year: string
}

type RawTMDB = {
  id: number
  media_type: string
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
}

export async function searchTMDB(query: string): Promise<{ results: TMDBResult[] }> {
  const key = process.env.TMDB_API_KEY
  if (!key || !query.trim()) return { results: [] }

  const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=pt-BR&page=1`

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return { results: [] }

    const data = await res.json() as { results: RawTMDB[] }

    return {
      results: (data.results ?? [])
        .filter((r) => r.media_type === "movie" || r.media_type === "tv")
        .slice(0, 8)
        .map((r) => ({
          tmdb_id: r.id,
          tmdb_type: r.media_type as "movie" | "tv",
          title: r.title ?? r.name ?? "",
          poster_path: r.poster_path,
          year: (r.release_date ?? r.first_air_date ?? "").slice(0, 4),
        })),
    }
  } catch {
    return { results: [] }
  }
}
