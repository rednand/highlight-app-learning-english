import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "../../utils/supabase/server"
import DeleteAccountForm from "./delete-account-form"
import PushToggle from "../push-toggle"

export const metadata: Metadata = {
  title: "Conta - Highlight",
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

function formatDate(value: string | undefined): string {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const name = readString(user.user_metadata.full_name) ?? readString(user.user_metadata.name)
  const avatar = readString(user.user_metadata.avatar_url) ?? readString(user.user_metadata.picture)
  const provider = readString(user.app_metadata.provider)
  const initials = (name ?? user.email ?? "??").slice(0, 2).toUpperCase()

  const rows: { label: string; value: string }[] = [
    { label: "Nome", value: name ?? "-" },
    { label: "E-mail", value: user.email ?? "-" },
    { label: "E-mail verificado", value: user.email_confirmed_at ? "Sim" : "Não" },
    { label: "Login", value: provider === "google" ? "Google" : (provider ?? "-") },
    { label: "Conta criada em", value: formatDate(user.created_at) },
    { label: "Último acesso", value: formatDate(user.last_sign_in_at) },
  ]

  return (
    <div className="mx-auto w-full max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Conta</h1>

      <section className="mb-6 rounded-2xl border border-white/5 bg-[#0f0f0f] p-6">
        <div className="mb-6 flex items-center gap-4">
          {avatar ? (
            <Image
              src={avatar}
              alt={name ?? "Foto de perfil"}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/20 text-lg font-bold text-yellow-400">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{name ?? user.email}</p>
            <p className="truncate text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-white/5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-gray-500">{row.label}</dt>
              <dd className="truncate text-sm text-white">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-6 rounded-2xl border border-white/5 bg-[#0f0f0f] p-6">
        <h2 className="mb-2 text-base font-semibold text-white">Notificações</h2>
        <p className="mb-4 text-sm leading-relaxed text-gray-400">
          Receba um lembrete diário para não perder a revisão dos seus flashcards.
        </p>
        <PushToggle showLabel />
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-[#0f0f0f] p-6">
        <h2 className="mb-2 text-base font-semibold text-white">Excluir conta</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-400">
          Esta ação é permanente. Todas as suas aulas, palavras, flashcards,
          progresso e notificações serão apagados e não poderão ser recuperados.
        </p>
        <DeleteAccountForm />
      </section>

      <p className="mt-6 text-xs text-gray-600">
        <Link href="/privacy" className="hover:text-white">
          Política de Privacidade
        </Link>
      </p>
    </div>
  )
}
