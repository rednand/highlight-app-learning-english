import Link from "next/link";
import FlashcardReview from "./components";
import FlashcardForm from "./components/flashcard-form";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400 text-black text-xs font-bold px-1 py-0.5 rounded">EN</span>
          <span className="font-bold text-lg tracking-tight">Lumen.</span>
        </div>
        <Link
          href="/dashboard/dashboard"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] mb-2">FLASHCARDS • SPACED REPETITION</p>
        <h1 className="text-2xl font-bold mb-10">Revisar Flashcards</h1>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <FlashcardReview />
          </div>
          <div className="lg:w-80">
            <FlashcardForm />
          </div>
        </div>
      </div>
    </div>
  );
}
