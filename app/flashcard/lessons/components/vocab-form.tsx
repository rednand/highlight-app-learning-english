import { createClient } from "../../../utils/supabase/server";
import { notFound } from "next/navigation";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lesson) {
    notFound();
  }

  return (
    <div className="flex h-screen text-slate-900">
      <section className="flex-1 p-8 border-r bg-white">
        <h1 className="text-3xl font-bold w-full mb-4 outline-none">
          {lesson.title}
        </h1>

        <div className="w-full h-full text-lg leading-relaxed outline-none whitespace-pre-wrap">
          {lesson.content || "Nenhum conteúdo escrito ainda..."}
        </div>
      </section>

      <aside className="w-80 p-6 bg-gray-50 border-l">
        <h3 className="font-bold mb-4 text-slate-700">Vocabulário</h3>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-slate-500 italic">
            Nenhuma palavra salva nesta nota.
          </p>
        </div>

        <button className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition">
          + Adicionar Palavra
        </button>

        <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border">
          <p className="text-sm font-bold mb-3 text-slate-600">
            Treinar Pronúncia
          </p>
          <button className="bg-rose-500 hover:bg-rose-600 text-white w-full py-2 rounded-full transition font-medium">
            Gravar Áudio
          </button>
        </div>
      </aside>
    </div>
  );
}
