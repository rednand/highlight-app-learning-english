"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X, BookOpen } from "lucide-react";
import { createVocabularyWithFlashcard } from "@/app/actions/flashcard-actions";

type VocabItem = { id: string; word: string; translation: string };

export default function VocabSidebar({
  lessonId,
  initialVocab,
}: {
  lessonId: string;
  initialVocab: VocabItem[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    setError(null);
    startTransition(async () => {
      try {
        await createVocabularyWithFlashcard(fd);
        formRef.current?.reset();
        setShowForm(false);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <>
      <div className="space-y-2 mb-4">
        {initialVocab.length === 0 && !showForm && (
          <p className="text-sm text-gray-600 italic">Nenhuma palavra salva nesta nota.</p>
        )}
        {initialVocab.map((v) => (
          <div key={v.id} className="flex items-start gap-2 bg-[#111] border border-white/5 rounded-lg p-3">
            <BookOpen size={14} className="text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">{v.word}</p>
              <p className="text-xs text-gray-500">{v.translation}</p>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 border border-dashed border-yellow-400/30 text-yellow-400 text-sm rounded-lg hover:bg-yellow-400/5 transition flex items-center justify-center gap-2"
        >
          <Plus size={15} />
          Adicionar Palavra
        </button>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nova palavra</span>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="text-gray-600 hover:text-white transition"
            >
              <X size={15} />
            </button>
          </div>

          <input
            name="word"
            required
            placeholder="Ex: to procrastinate"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition"
          />
          <input
            name="translation"
            required
            placeholder="Ex: procrastinar"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 transition"
          />
          <input type="hidden" name="lesson_id" value={lessonId} />

          <button
            type="submit"
            disabled={isPending}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-sm font-bold py-2 rounded-full transition-colors"
          >
            {isPending ? "Salvando…" : "Salvar Palavra"}
          </button>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      )}
    </>
  );
}
