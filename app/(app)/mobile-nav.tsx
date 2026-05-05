"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, RotateCcw } from "lucide-react"

const links = [
  { href: "/", icon: LayoutDashboard, label: "Início", exact: true },
  { href: "/lessons", icon: BookOpen, label: "Aulas", exact: false },
  { href: "/review", icon: RotateCcw, label: "Revisar", exact: false },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/5 flex md:hidden">
      {links.map(({ href, icon: Icon, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold tracking-wide transition-colors ${
              isActive ? "text-yellow-400" : "text-gray-600"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
