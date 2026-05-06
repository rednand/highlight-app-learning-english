import webpush from "web-push"
import { createClient } from "../../utils/supabase/server"
import { NextResponse } from "next/server"

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id)

  if (!subs?.length) return NextResponse.json({ error: "no subscriptions" }, { status: 404 })

  await Promise.all(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: "Highlight", body: "Push funcionando! 🔔" }),
      ).catch(() => null)
    )
  )

  return NextResponse.json({ ok: true, sent: subs.length })
}
