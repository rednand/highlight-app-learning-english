import { createClient } from "../../../utils/supabase/server";
import { notFound } from "next/navigation";
import VocabSidebar from "./vocab-sidebar";

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

  if (error || !lesson) notFound();

  const { data: vocab } = await supabase
    .from("vocabulary")
    .select("id, word, translation")
    .eq("lesson_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-full text-white">
      <section className="flex-1 p-8 border-r border-white/5 overflow-auto">
        <p className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] mb-4">LESSON</p>
        <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>
        <div className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
          {lesson.content || "Nenhum conteúdo escrito ainda..."}
        </div>
      </section>

      <aside className="w-80 p-6 border-l border-white/5 overflow-auto shrink-0">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">
          Vocabulário
        </h3>

        <VocabSidebar lessonId={id} initialVocab={vocab ?? []} />

        <div className="mt-6 p-4 bg-[#111] rounded-xl border border-white/5">
          <p className="text-sm font-bold mb-3 text-gray-400">Treinar Pronúncia</p>
          <button className="bg-yellow-400 hover:bg-yellow-300 text-black w-full py-2 rounded-full transition font-bold text-sm">
            Gravar Áudio
          </button>
        </div>
      </aside>
    </div>
  );
}
