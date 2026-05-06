self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Highlight", {
      body: data.body,
      icon: data.icon ?? "/icon-192.svg",
      badge: "/icon-192.svg",
      data: { url: data.url ?? "/" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      const url = event.notification.data?.url ?? "/"
      for (const client of list) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
