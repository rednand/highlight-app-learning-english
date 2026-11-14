import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import NewLessonForm from "./new-lesson-form"

export default function NewLessonPage() {
  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <Link
        href="/lessons"
        className="flex items-center gap-2 text-fg-subtle hover:text-white text-sm mb-8 transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Aulas
      </Link>

      <p className="text-[10px] font-bold tracking-[0.3em] text-brand-strong mb-2">NOVA AULA</p>
      <h1 className="text-2xl font-bold text-white mb-8">Registrar aula</h1>

      <NewLessonForm />
    </div>
  )
}
