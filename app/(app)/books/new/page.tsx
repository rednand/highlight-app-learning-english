import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import NewBookForm from "./new-book-form"

export default function NewBookPage() {
  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <Link
        href="/books"
        className="flex items-center gap-2 text-fg-subtle hover:text-white text-sm mb-8 transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Livros
      </Link>

      <p className="text-[10px] font-bold tracking-[0.3em] text-brand-strong mb-2">NOVO LIVRO</p>
      <h1 className="text-2xl font-bold text-white mb-2">O que você está lendo?</h1>
      <p className="text-fg-subtle text-sm mb-8">Busque o livro e anote as palavras que aprender.</p>

      <NewBookForm />
    </div>
  )
}
