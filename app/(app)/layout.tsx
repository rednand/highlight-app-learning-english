import { createClient } from "../utils/supabase/server"
import { redirect } from "next/navigation"
import { signOut } from "../actions/lessons"
import Link from "next/link"
import { LayoutDashboard, BookOpen, RotateCcw, Map } from "lucide-react"
import NavLink from "./nav-link"
import MobileNav from "./mobile-nav"
import { Toaster } from "sonner"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <aside className="hidden md:flex w-56 border-r border-white/5 flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="Highlight" className="w-6 h-6 rounded" />
            <span className="font-bold tracking-tight">Highlight</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <NavLink href="/" icon={<LayoutDashboard size={16} />} label="Início" exact />
          <NavLink href="/lessons" icon={<BookOpen size={16} />} label="Aulas" />
          <NavLink href="/review" icon={<RotateCcw size={16} />} label="Revisar" />
          <NavLink href="/roadmap" icon={<Map size={16} />} label="Trilha" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <form action={signOut}>
            <button className="text-xs text-gray-600 hover:text-white transition-colors">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      <MobileNav />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
