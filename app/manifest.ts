import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Highlight",
    short_name: "Highlight",
    description: "Registre suas aulas e aprenda inglês com flashcards.",
    id: "/",
    start_url: "/",
    scope: "/",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["education"],
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    launch_handler: { client_mode: "navigate-existing" },
    prefer_related_applications: false,
    background_color: "#facc15",
    theme_color: "#facc15",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Revisar flashcards",
        short_name: "Revisar",
        url: "/review",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Minhas aulas",
        short_name: "Aulas",
        url: "/lessons",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Roadmap",
        short_name: "Roadmap",
        url: "/roadmap",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  }
}
