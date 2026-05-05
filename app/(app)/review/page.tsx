import ReviewClient from "./review-client"

export default function ReviewPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-400 mb-1">REVISÃO</p>
        <h1 className="text-2xl font-bold text-white">Flashcards</h1>
      </div>
      <ReviewClient />
    </div>
  )
}
