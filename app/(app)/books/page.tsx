import { createClient } from "../../utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, BookMarked } from "lucide-react"

export default async function BooksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: books } = await supabase
    .from("lessons")
    .select("id, title, book_author, book_cover_url, created_at")
    .eq("user_id", user.id)
    .eq("source_type", "book")
    .order("created_at", { ascending: false })

  const lessonIds = (books ?? []).map((b) => b.id)
  let countMap: Record<string, number> = {}
  if (lessonIds.length > 0) {
    const { data: counts } = await supabase
      .from("lesson_items")
      .select("lesson_id")
      .in("lesson_id", lessonIds)
    countMap = (counts ?? []).reduce(
      (acc, item) => { acc[item.lesson_id] = (acc[item.lesson_id] || 0) + 1; return acc },
      {} as Record<string, number>,
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/media" className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1 hover:text-yellow-200 transition-colors block">
            ← MÍDIA
          </Link>
          <h1 className="text-2xl font-bold text-white">Livros</h1>
        </div>
        <Link
          href="/books/new"
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-4 py-2 rounded-full transition-colors"
        >
          <Plus size={15} />
          Adicionar
        </Link>
      </div>

      {!books || books.length === 0 ? (
        <div className="text-center py-20">
          <BookMarked size={36} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium mb-1">Nenhum livro ainda</p>
          <p className="text-gray-600 text-sm mb-6">Adicione um livro que você está lendo.</p>
          <Link
            href="/books/new"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
          >
            <Plus size={15} />
            Adicionar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {books.map((book) => {
            const count = countMap[book.id] ?? 0
            return (
              <Link
                key={book.id}
                href={`/lessons/${book.id}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[2/3] bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden mb-2 group-hover:border-yellow-400/20 transition-colors">
                  {book.book_cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.book_cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookMarked size={32} className="text-gray-700" />
                    </div>
                  )}
                  {count > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {count} palavras
                    </div>
                  )}
                </div>
                <p className="text-white text-xs font-semibold line-clamp-2 group-hover:text-yellow-400 transition-colors">
                  {book.title}
                </p>
                {book.book_author && (
                  <p className="text-gray-600 text-[10px] mt-0.5 truncate">{book.book_author}</p>
                )}
              </Link>
            )
          })}
          <Link
            href="/books/new"
            className="flex flex-col items-center justify-center aspect-[2/3] bg-[#0f0f0f] border border-dashed border-white/5 rounded-xl hover:border-yellow-400/20 transition-all text-gray-600 hover:text-gray-400 gap-2"
          >
            <Plus size={20} />
            <span className="text-xs">Adicionar</span>
          </Link>
        </div>
      )}
    </div>
  )
}
