"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { savePushSubscription, deletePushSubscription } from "../actions/push"

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function PushToggle() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    setSupported(true)
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    )
  }, [])

  if (!supported) return null

  async function toggle() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await deletePushSubscription(sub.endpoint)
          await sub.unsubscribe()
        }
        setSubscribed(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") return

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
          console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY não definida")
          return
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        const json = sub.toJSON()
        await savePushSubscription({
          endpoint: json.endpoint!,
          p256dh: (json.keys as Record<string, string>).p256dh,
          auth: (json.keys as Record<string, string>).auth,
        })
        setSubscribed(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={subscribed ? "Desativar notificações" : "Ativar notificações de revisão"}
      className={`transition-colors disabled:opacity-40 ${
        subscribed ? "text-yellow-400 hover:text-gray-400" : "text-gray-600 hover:text-white"
      }`}
    >
      {subscribed ? <Bell size={15} /> : <BellOff size={15} />}
    </button>
  )
}
