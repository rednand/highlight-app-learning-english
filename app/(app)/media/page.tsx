import { createClient } from "../../utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Film, Tv, Music, BookMarked } from "lucide-react"

export default async function MediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [moviesResult, musicResult, booksResult] = await Promise.all([
    supabase.from("lessons").select("id, title, tmdb_poster_path, tmdb_type, tmdb_season").eq("user_id", user.id).eq("source_type", "movie").order("created_at", { ascending: false }).limit(6),
    supabase.from("lessons").select("id, title, music_artist, music_thumbnail_url").eq("user_id", user.id).eq("source_type", "music").order("created_at", { ascending: false }).limit(6),
    supabase.from("lessons").select("id, title, book_author, book_cover_url").eq("user_id", user.id).eq("source_type", "book").order("created_at", { ascending: false }).limit(6),
  ])

  const movies = moviesResult.data ?? []
  const tracks = musicResult.data ?? []
  const books = booksResult.data ?? []

  const allIds = [...movies, ...tracks, ...books].map((x) => x.id)
  let countMap: Record<string, number> = {}
  if (allIds.length > 0) {
    const { data: counts } = await supabase.from("lesson_items").select("lesson_id").in("lesson_id", allIds)
    countMap = (counts ?? []).reduce(
      (acc, item) => { acc[item.lesson_id] = (acc[item.lesson_id] || 0) + 1; return acc },
      {} as Record<string, number>,
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-10">
      <div>
        <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">HIGHLIGHT</p>
        <h1 className="text-2xl font-bold text-white">Mídia</h1>
      </div>

      {/* Filmes & Séries */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film size={15} className="text-gray-500" />
            <h2 className="text-sm font-bold text-white">Filmes & Séries</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/movies" className="text-xs text-gray-500 hover:text-white transition-colors">
              Ver todos
            </Link>
            <Link
              href="/movies/new"
              className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus size={12} />
              Adicionar
            </Link>
          </div>
        </div>

        {movies.length === 0 ? (
          <div className="flex items-center justify-center h-32 bg-[#0f0f0f] border border-dashed border-white/5 rounded-xl text-gray-600 text-sm">
            Nenhum filme ainda
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {movies.map((movie) => {
              const count = countMap[movie.id] ?? 0
              return (
                <Link key={movie.id} href={`/lessons/${movie.id}`} className="group shrink-0 w-28">
                  <div className="relative aspect-[2/3] bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden mb-1.5 group-hover:border-yellow-400/20 transition-colors">
                    {movie.tmdb_poster_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.tmdb_poster_path}`}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {movie.tmdb_type === "tv"
                          ? <Tv size={24} className="text-gray-700" />
                          : <Film size={24} className="text-gray-700" />}
                      </div>
                    )}
                    {count > 0 && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {count}
                      </div>
                    )}
                  </div>
                  <p className="text-white text-[11px] font-semibold line-clamp-2 group-hover:text-yellow-400 transition-colors">
                    {movie.title}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Música */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music size={15} className="text-gray-500" />
            <h2 className="text-sm font-bold text-white">Música</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/music" className="text-xs text-gray-500 hover:text-white transition-colors">
              Ver todos
            </Link>
            <Link
              href="/music/new"
              className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus size={12} />
              Adicionar
            </Link>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-32 bg-[#0f0f0f] border border-dashed border-white/5 rounded-xl text-gray-600 text-sm">
            Nenhuma música ainda
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {tracks.map((track) => {
              const count = countMap[track.id] ?? 0
              return (
                <Link key={track.id} href={`/lessons/${track.id}`} className="group shrink-0 w-28">
                  <div className="relative aspect-square bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden mb-1.5 group-hover:border-yellow-400/20 transition-colors">
                    {track.music_thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.music_thumbnail_url}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={24} className="text-gray-700" />
                      </div>
                    )}
                    {count > 0 && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {count}
                      </div>
                    )}
                  </div>
                  <p className="text-white text-[11px] font-semibold line-clamp-2 group-hover:text-yellow-400 transition-colors">
                    {track.title}
                  </p>
                  {track.music_artist && (
                    <p className="text-gray-600 text-[10px] mt-0.5 truncate">{track.music_artist}</p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Livros */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookMarked size={15} className="text-gray-500" />
            <h2 className="text-sm font-bold text-white">Livros</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/books" className="text-xs text-gray-500 hover:text-white transition-colors">
              Ver todos
            </Link>
            <Link
              href="/books/new"
              className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus size={12} />
              Adicionar
            </Link>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="flex items-center justify-center h-32 bg-[#0f0f0f] border border-dashed border-white/5 rounded-xl text-gray-600 text-sm">
            Nenhum livro ainda
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {books.map((book) => {
              const count = countMap[book.id] ?? 0
              return (
                <Link key={book.id} href={`/lessons/${book.id}`} className="group shrink-0 w-28">
                  <div className="relative aspect-[2/3] bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden mb-1.5 group-hover:border-yellow-400/20 transition-colors">
                    {book.book_cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.book_cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookMarked size={24} className="text-gray-700" />
                      </div>
                    )}
                    {count > 0 && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {count}
                      </div>
                    )}
                  </div>
                  <p className="text-white text-[11px] font-semibold line-clamp-2 group-hover:text-yellow-400 transition-colors">
                    {book.title}
                  </p>
                  {book.book_author && (
                    <p className="text-gray-600 text-[10px] mt-0.5 truncate">{book.book_author}</p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
