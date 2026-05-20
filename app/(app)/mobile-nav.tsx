"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, RotateCcw, ScrollText, Menu, Library, Map, X } from "lucide-react"
import { useState } from "react"

const mainLinks = [
  { href: "/", icon: LayoutDashboard, label: "Início", exact: true, activeFor: [] as string[] },
  { href: "/lessons", icon: BookOpen, label: "Aulas", exact: false, activeFor: [] as string[] },
  { href: "/media", icon: Library, label: "Mídia", exact: false, activeFor: ["/movies", "/music", "/books"] },
  { href: "/grammar", icon: ScrollText, label: "Gramática", exact: false, activeFor: [] as string[] },
  { href: "/review", icon: RotateCcw, label: "Revisar", exact: false, activeFor: [] as string[] },
]

const moreLinks = [
  { href: "/roadmap", icon: Map, label: "Trilha", activeFor: [] as string[] },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isMoreActive = moreLinks.some(
    ({ href, activeFor }) =>
      pathname === href ||
      (href !== "/" && pathname.startsWith(href)) ||
      activeFor.some((p) => pathname.startsWith(p)),
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div className="fixed bottom-16 left-0 right-0 z-50 mx-4 mb-2 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Mais</span>
            <button onClick={() => setOpen(false)}>
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          {moreLinks.map(({ href, icon: Icon, label, activeFor }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href)) ||
              activeFor.some((p) => pathname.startsWith(p))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                  isActive ? "text-yellow-400" : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-semibold">{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />
                )}
              </Link>
            )
          })}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-[#0a0a0a] border-t border-white/5 flex md:hidden">
        {mainLinks.map(({ href, icon: Icon, label, exact, activeFor }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href) || activeFor.some((p) => pathname.startsWith(p))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[9px] font-bold tracking-wide transition-colors ${
                isActive ? "text-yellow-400" : "text-gray-600"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[9px] font-bold tracking-wide transition-colors ${
            isMoreActive || open ? "text-yellow-400" : "text-gray-600"
          }`}
        >
          <Menu size={18} />
          Mais
        </button>
      </nav>
    </>
  )
}
