import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import NewMovieForm from "./new-movie-form"

export default function NewMoviePage() {
  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <Link
        href="/movies"
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Filmes & Séries
      </Link>

      <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-2">NOVO TÍTULO</p>
      <h1 className="text-2xl font-bold text-white mb-2">O que você está assistindo?</h1>
      <p className="text-gray-500 text-sm mb-8">Busque o título e anote as palavras que aprender.</p>

      <NewMovieForm />
    </div>
  )
}
