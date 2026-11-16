import type { MetadataRoute } from "next"
import { SITE_URL, BLOCKED_PATHS, isIndexableDeployment } from "./lib/site"

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableDeployment(process.env.VERCEL_ENV)) {
    return { rules: [{ userAgent: "*", disallow: "/" }] }
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...BLOCKED_PATHS] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
