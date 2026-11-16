import { describe, it, expect, afterEach, vi } from "vitest"
import robots from "../app/robots"
import sitemap from "../app/sitemap"
import { SITE_URL, PUBLIC_PATHS, BLOCKED_PATHS, resolveSiteUrl, isIndexableDeployment } from "../app/lib/site"

afterEach(() => vi.unstubAllEnvs())

function firstRule() {
  const rules = robots().rules
  return Array.isArray(rules) ? rules[0] : rules
}

describe("resolveSiteUrl", () => {
  it("usa a produção quando a variável falta, está vazia ou é inválida", () => {
    const prod = "https://highlight-english-learning.vercel.app"
    expect(resolveSiteUrl(undefined)).toBe(prod)
    expect(resolveSiteUrl("   ")).toBe(prod)
    expect(resolveSiteUrl("highlight.app")).toBe(prod)
    expect(resolveSiteUrl("ftp://x.com")).toBe(prod)
  })

  it("normaliza para a origem, sem barra no final", () => {
    expect(resolveSiteUrl("https://meu-app.com/")).toBe("https://meu-app.com")
    expect(resolveSiteUrl("http://localhost:3000/qualquer")).toBe("http://localhost:3000")
  })
})

describe("isIndexableDeployment", () => {
  it("só produção (ou fora do Vercel) pode ser indexada", () => {
    expect(isIndexableDeployment(undefined)).toBe(true)
    expect(isIndexableDeployment("production")).toBe(true)
    expect(isIndexableDeployment("preview")).toBe(false)
    expect(isIndexableDeployment("development")).toBe(false)
  })
})

describe("robots.txt", () => {
  it("em produção libera o site e bloqueia só rotas técnicas", () => {
    vi.stubEnv("VERCEL_ENV", "production")
    const rule = firstRule()
    expect(rule.allow).toBe("/")
    expect(rule.disallow).toEqual([...BLOCKED_PATHS])
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`)
  })

  it("nenhum bloqueio pega uma página pública", () => {
    for (const publicPath of PUBLIC_PATHS) {
      for (const blocked of BLOCKED_PATHS) expect(publicPath.startsWith(blocked)).toBe(false)
    }
  })

  it("em deploy de teste bloqueia tudo e não aponta sitemap", () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    expect(firstRule().disallow).toBe("/")
    expect(robots().sitemap).toBeUndefined()
  })
})

describe("sitemap", () => {
  it("lista só as páginas públicas com o endereço completo", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual(PUBLIC_PATHS.map((path) => `${SITE_URL}${path}`))
  })
})
