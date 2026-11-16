import { describe, it, expect } from "vitest"
import robots from "../app/robots"
import sitemap from "../app/sitemap"
import { SITE_URL, PUBLIC_PATHS, PRIVATE_PATHS } from "../app/lib/site"

describe("robots.txt", () => {
  const rules = robots().rules
  const rule = Array.isArray(rules) ? rules[0] : rules

  it("libera as páginas públicas", () => {
    for (const path of PUBLIC_PATHS) expect(rule.allow).toContain(path)
  })

  it("bloqueia as telas internas e rotas técnicas", () => {
    for (const path of ["/lessons", "/review", "/words", "/api", "/sentry-example-page"]) {
      expect(rule.disallow).toContain(`${path}$`)
      expect(rule.disallow).toContain(`${path}/`)
    }
  })

  it("nenhum bloqueio pega uma página pública por prefixo", () => {
    const disallow = rule.disallow as string[]
    for (const publicPath of PUBLIC_PATHS) {
      for (const blocked of disallow) {
        const prefix = blocked.replace(/\$$/, "")
        const exact = blocked.endsWith("$")
        const hits = exact ? publicPath === prefix : publicPath.startsWith(prefix)
        expect(hits, `${blocked} bloqueia ${publicPath}`).toBe(false)
      }
    }
  })

  it("não bloqueia o site inteiro", () => {
    expect(rule.disallow).not.toContain("/")
  })

  it("aponta para o sitemap", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`)
  })
})

describe("sitemap", () => {
  it("lista só as páginas públicas com o endereço completo", () => {
    const urls = sitemap().map((entry) => entry.url)
    expect(urls).toEqual(PUBLIC_PATHS.map((path) => `${SITE_URL}${path}`))
    for (const path of PRIVATE_PATHS) expect(urls).not.toContain(`${SITE_URL}${path}`)
  })

  it("usa o domínio de produção sem barra no final", () => {
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/)
  })
})
