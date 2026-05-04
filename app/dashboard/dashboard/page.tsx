import { createClient } from "../../utils/supabase/server";
import { createLesson } from "../../actions";
import Link from "next/link";
import { Plus, FileText, Calendar } from "lucide-react";

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("lessons")
    .select("*")
    .order("created_at", { ascending: false });

  const count = notes?.length ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] mb-2">NOTES • STUDY • REPEAT</p>
        <h1 className="text-2xl font-bold text-white">Minhas Notas</h1>
        <p className="text-gray-400 text-sm mt-1">
          {count} {count === 1 ? "nota" : "notas"} no total
        </p>
      </div>

      <div className="bg-[#111] rounded-xl border border-white/5 mb-8">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <Plus size={16} className="text-yellow-400" />
          <h2 className="font-semibold text-sm text-white">Nova Nota</h2>
        </div>
        <form action={createLesson} className="p-6 flex flex-col gap-4">
          <input
            name="title"
            placeholder="Título da nota (ex: Verbos Irregulares)"
            required
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition"
          />
          <textarea
            name="content"
            placeholder="O que você quer anotar hoje?"
            rows={3}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold px-6 py-2.5 rounded-full transition-colors"
            >
              Salvar Nota
            </button>
          </div>
        </form>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map((note) => (
            <Link
              href={`/dashboard/lessons/${note.id}`}
              key={note.id}
              className="group bg-[#111] border border-white/5 rounded-xl p-5 hover:border-yellow-400/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-yellow-400/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-yellow-400/20 transition-colors">
                  <FileText size={18} className="text-yellow-400" />
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar size={12} />
                  {new Date(note.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-yellow-400 transition-colors line-clamp-1">
                {note.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {note.content || "Sem conteúdo..."}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-xl text-center">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4">
            <FileText size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium text-sm">Nenhuma nota encontrada</p>
          <p className="text-gray-600 text-xs mt-1">Crie sua primeira nota acima!</p>
        </div>
      )}
    </div>
  );
}
