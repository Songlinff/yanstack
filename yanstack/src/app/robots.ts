import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
