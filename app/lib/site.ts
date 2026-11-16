const PRODUCTION_URL = "https://highlight-english-learning.vercel.app"

/** Normaliza a URL do site; volta para a de produção se a variável vier vazia ou inválida. */
export function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim()
  if (!value) return PRODUCTION_URL
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") return PRODUCTION_URL
    return url.origin
  } catch {
    return PRODUCTION_URL
  }
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)

/** Páginas abertas a qualquer pessoa, que podem aparecer no Google. */
export const PUBLIC_PATHS = ["/about", "/login", "/privacy", "/account-deletion"] as const

/**
 * Rotas técnicas, sem conteúdo para o Google. As telas do app não entram aqui:
 * sem login elas redirecionam para /login e, logadas, têm noindex no layout.
 */
export const BLOCKED_PATHS = ["/api/", "/auth/", "/sentry-example-page"] as const

/** Deploys de teste (preview) do Vercel não devem aparecer no Google. */
export function isIndexableDeployment(vercelEnv: string | undefined): boolean {
  return !vercelEnv || vercelEnv === "production"
}
