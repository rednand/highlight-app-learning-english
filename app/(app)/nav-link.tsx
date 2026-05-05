"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function NavLink({
  href,
  icon,
  label,
  exact = false,
}: {
  href: string
  icon: React.ReactNode
  label: string
  exact?: boolean
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-yellow-400/10 text-yellow-400"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}
