import { createLesson } from "../../../actions/lessons"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import RoadmapPicker from "./roadmap-picker"

export default function NewLessonPage() {
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <Link
        href="/lessons"
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Aulas
      </Link>

      <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-400 mb-2">NOVA AULA</p>
      <h1 className="text-2xl font-bold text-white mb-8">Registrar aula</h1>

      <form action={createLesson} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Título
          </label>
          <input
            name="title"
            required
            placeholder="Ex: Phrasal verbs com &ldquo;up&rdquo;"
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Data da aula
          </label>
          <input
            name="lesson_date"
            type="date"
            defaultValue={today}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Notas{" "}
            <span className="text-gray-700 normal-case font-normal tracking-normal">(opcional)</span>
          </label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Contexto, tema da aula, observações..."
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition-colors resize-none text-sm"
          />
        </div>

        <RoadmapPicker />

        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-full transition-colors text-sm"
        >
          Criar Aula
        </button>
      </form>
    </div>
  )
}
