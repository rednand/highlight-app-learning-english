"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function NavLink({
  href,
  icon,
  label,
  exact = false,
  activeFor = [],
}: {
  href: string
  icon: React.ReactNode
  label: string
  exact?: boolean
  activeFor?: string[]
}) {
  const pathname = usePathname()
  const isActive = exact
    ? pathname === href
    : pathname.startsWith(href) || activeFor.some((p) => pathname.startsWith(p))

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-brand/10 text-brand"
          : "text-fg-muted hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}
