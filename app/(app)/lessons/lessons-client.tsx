"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, BookOpen, Search, LayoutGrid, List } from "lucide-react"

type Lesson = {
  id: string
  title: string
  lesson_date: string | null
  created_at: string
  itemCount: number
}

export default function LessonsClient({ lessons }: { lessons: Lesson[] }) {
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")

  const filtered = lessons.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Buscar aulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-[#0f0f0f] border border-white/5 rounded-xl p-1">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-lg transition-colors ${
              view === "grid" ? "bg-yellow-400/10 text-yellow-400" : "text-gray-600 hover:text-gray-400"
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-lg transition-colors ${
              view === "list" ? "bg-yellow-400/10 text-yellow-400" : "text-gray-600 hover:text-gray-400"
            }`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {filtered.length === 0 && lessons.length > 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">Nenhuma aula encontrada.</p>
      )}

      <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {filtered.map((lesson) => {
          const date = lesson.lesson_date
            ? new Date(lesson.lesson_date + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : new Date(lesson.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })

          if (view === "list") {
            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="flex items-center gap-4 p-4 bg-[#0f0f0f] border border-white/5 rounded-xl hover:border-yellow-400/20 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm group-hover:text-yellow-400 transition-colors truncate">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{date}</p>
                </div>
                <span className="text-xs text-gray-600 shrink-0">
                  {lesson.itemCount} {lesson.itemCount === 1 ? "item" : "itens"}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              className="block p-5 bg-[#0f0f0f] border border-white/5 rounded-xl hover:border-yellow-400/20 hover:bg-white/[0.02] transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-4">
                <BookOpen size={16} className="text-yellow-400" />
              </div>
              <h2 className="text-white font-semibold text-base mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2">
                {lesson.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{date}</span>
                <span>·</span>
                <span>
                  {lesson.itemCount} {lesson.itemCount === 1 ? "item" : "itens"}
                </span>
              </div>
            </Link>
          )
        })}

        {view === "grid" && (
          <Link
            href="/lessons/new"
            className="flex flex-col items-center justify-center gap-2 p-5 bg-[#0f0f0f] border border-dashed border-white/5 rounded-xl hover:border-yellow-400/20 transition-all min-h-[80px] sm:min-h-[148px] text-gray-600 hover:text-gray-400"
          >
            <Plus size={20} />
            <span className="text-sm">Adicionar nova aula</span>
          </Link>
        )}
      </div>
    </div>
  )
}
