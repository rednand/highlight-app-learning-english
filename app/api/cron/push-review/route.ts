import webpush from "web-push"
import { createAdminClient } from "../../../utils/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Users with at least one card due
  const { data: due } = await supabase
    .from("flashcards")
    .select("user_id")
    .lte("next_review_at", new Date().toISOString())

  if (!due?.length) return NextResponse.json({ ok: true, sent: 0 })

  const userIds = [...new Set(due.map(r => r.user_id))]

  // Count per user
  const counts: Record<string, number> = {}
  for (const { user_id } of due) counts[user_id] = (counts[user_id] ?? 0) + 1

  // Subscriptions for those users
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds)

  if (!subs?.length) return NextResponse.json({ ok: true, sent: 0 })

  let sent = 0
  await Promise.all(
    subs.map(s => {
      const n = counts[s.user_id]
      const payload = JSON.stringify({
        title: "Hora de revisar!",
        body: `Você tem ${n} ${n === 1 ? "cartão" : "cartões"} para revisar hoje.`,
        url: "/review",
      })
      return webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        .then(() => sent++)
        .catch(() => null)
    })
  )

  return NextResponse.json({ ok: true, sent })
}
