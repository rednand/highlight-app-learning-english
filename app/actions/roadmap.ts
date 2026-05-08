"use server"

import { createClient } from "../utils/supabase/server"

export async function toggleRoadmapSession(sessionKey: string, markDone: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (markDone) {
    await supabase
      .from("roadmap_progress")
      .insert({ user_id: user.id, session_key: sessionKey })
      .select()
  } else {
    await supabase
      .from("roadmap_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("session_key", sessionKey)
  }
}
