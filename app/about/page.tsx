import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Highlight - Aprenda inglês com flashcards",
  description:
    "Highlight é um app para registrar suas aulas de inglês e memorizar vocabulário com flashcards e repetição espaçada.",
}

const features = [
  {
    title: "Registre suas aulas",
    text: "Guarde as palavras e expressões de cada aula, filme, música ou livro em um só lugar.",
  },
  {
    title: "Flashcards com repetição espaçada",
    text: "O app calcula o melhor momento para revisar cada palavra, para você lembrar por mais tempo.",
  },
  {
    title: "Tradução e pronúncia",
    text: "Traduções, fonética e frases de exemplo para entender como cada palavra é usada.",
  },
  {
    title: "Lembretes diários",
    text: "Receba uma notificação para não perder a revisão do dia, se você ativar.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-10 flex items-center gap-2">
          <Image
            src="/highlight-icon.png"
            alt="Highlight"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-xl font-bold tracking-tight text-white">
            Highlight
          </span>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-white">
          Aprenda inglês registrando o que você estuda
        </h1>
        <p className="mb-8 text-base leading-relaxed text-gray-400">
          O Highlight ajuda você a guardar o vocabulário das suas aulas e a
          memorizá-lo com flashcards e repetição espaçada.
        </p>

        <Link
          href="/login"
          className="mb-12 inline-block rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-yellow-300"
        >
          Entrar com Google
        </Link>

        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-5"
            >
              <h2 className="mb-1 text-sm font-semibold text-white">
                {feature.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-400">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

        <footer className="flex flex-wrap gap-4 border-t border-white/5 pt-6 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-white">
            Política de Privacidade
          </Link>
          <Link href="/account-deletion" className="hover:text-white">
            Excluir conta
          </Link>
        </footer>
      </div>
    </div>
  )
}
