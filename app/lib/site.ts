export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://highlight-english-learning.vercel.app").replace(/\/+$/, "")

/** Páginas abertas a qualquer pessoa, que podem aparecer no Google. */
export const PUBLIC_PATHS = ["/about", "/login", "/privacy", "/account-deletion"] as const

/** Telas internas do app (exigem login) e rotas técnicas: fora do Google. */
export const PRIVATE_PATHS = [
  "/lessons", "/media", "/movies", "/music", "/books", "/review", "/words",
  "/grammar", "/roadmap", "/account", "/auth", "/api", "/sentry-example-page",
] as const
