import type { MetadataRoute } from "next"
import { SITE_URL, PRIVATE_PATHS } from "./lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/about", "/login", "/privacy", "/account-deletion"],
        // "$" = endereço exato; sem ele, "/account" também pegaria "/account-deletion"
        disallow: PRIVATE_PATHS.flatMap((path) => [`${path}$`, `${path}/`]),
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
