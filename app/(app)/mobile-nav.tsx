"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, RotateCcw, ScrollText, Menu, Library, Map, UserRound, X, ListChecks } from "lucide-react"
import { useState } from "react"

const mainLinks = [
  { href: "/", icon: LayoutDashboard, label: "Início", exact: true, activeFor: [] as string[] },
  { href: "/media", icon: Library, label: "Mídia", exact: false, activeFor: ["/movies", "/music", "/books"] },
  { href: "/lessons", icon: BookOpen, label: "Aulas", exact: false, activeFor: [] as string[] },
  { href: "/review", icon: RotateCcw, label: "Revisar", exact: false, activeFor: [] as string[] },
]

const moreLinks = [
  { href: "/words", icon: ListChecks, label: "Palavras", activeFor: [] as string[] },
  { href: "/grammar", icon: ScrollText, label: "Gramática", activeFor: [] as string[] },
  { href: "/roadmap", icon: Map, label: "Trilha", activeFor: [] as string[] },
  { href: "/account", icon: UserRound, label: "Conta", activeFor: [] as string[] },
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
        <div className="fixed bottom-16 left-0 right-0 z-50 mx-4 mb-2 bg-sunken border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-xs font-bold text-fg-muted tracking-wider uppercase">Mais</span>
            <button onClick={() => setOpen(false)}>
              <X size={16} className="text-fg-subtle" />
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
                  isActive ? "text-brand" : "text-fg-muted hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-semibold">{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
                )}
              </Link>
            )
          })}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-page/95 backdrop-blur border-t border-white/10 flex md:hidden pb-[env(safe-area-inset-bottom)]">
        {mainLinks.map(({ href, icon: Icon, label, exact, activeFor }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href) || activeFor.some((p) => pathname.startsWith(p))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
            >
              <span className={`flex items-center justify-center w-11 h-7 rounded-full transition-colors ${
                isActive ? "bg-brand/15 text-brand" : "text-fg-subtle"
              }`}>
                <Icon size={18} />
              </span>
              <span className={`text-[10px] font-bold tracking-wide transition-colors ${
                isActive ? "text-brand" : "text-fg-dim"
              }`}>
                {label}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
        >
          <span className={`flex items-center justify-center w-11 h-7 rounded-full transition-colors ${
            isMoreActive || open ? "bg-brand/15 text-brand" : "text-fg-subtle"
          }`}>
            <Menu size={18} />
          </span>
          <span className={`text-[10px] font-bold tracking-wide transition-colors ${
            isMoreActive || open ? "text-brand" : "text-fg-dim"
          }`}>
            Mais
          </span>
        </button>
      </nav>
    </>
  )
}
