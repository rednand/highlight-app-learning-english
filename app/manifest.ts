import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Highlight",
    short_name: "Highlight",
    description: "Registre suas aulas e aprenda inglês com flashcards.",
    start_url: "/",
    display: "standalone",
    background_color: "#facc15",
    theme_color: "#facc15",
    orientation: "portrait",
    icons: [
      { src: "/highlight-icon.png", sizes: "192x192", type: "image/png" },
      { src: "/highlight-icon.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
