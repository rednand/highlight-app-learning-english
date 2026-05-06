import { createClient } from "../../utils/supabase/server"
import RoadmapClient from "./roadmap-client"

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, roadmap_key")
    .eq("user_id", user!.id)
    .not("roadmap_key", "is", null)

  const lessonCountByKey: Record<string, number> = {}
  for (const l of lessons ?? []) {
    if (l.roadmap_key) lessonCountByKey[l.roadmap_key] = (lessonCountByKey[l.roadmap_key] ?? 0) + 1
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.3em] text-yellow-300 mb-1">TRILHA</p>
        <h1 className="text-2xl font-bold text-white">Roadmap de Inglês</h1>
        <p className="text-gray-500 text-sm mt-1">Marque as sessões conforme for estudando.</p>
      </div>
      <RoadmapClient lessonCountByKey={lessonCountByKey} />
    </div>
  )
}
