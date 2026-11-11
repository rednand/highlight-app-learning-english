import type { Metadata } from "next"
import Link from "next/link"
import DeleteAccountForm from "./delete-account-form"

export const metadata: Metadata = {
  title: "Conta - Highlight",
}

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Conta</h1>

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
