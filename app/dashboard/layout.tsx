import { createClient } from "../utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { signOut } from "../actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      <aside className="w-60 border-r border-white/5 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-black text-xs font-bold px-1 py-0.5 rounded">EN</span>
            <span className="font-bold text-lg tracking-tight">Lumen.</span>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <Link
            href="/dashboard/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <LayoutDashboard size={17} className="shrink-0" />
            Dashboard
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
