import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/env";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: appUrl, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/orders`, changeFrequency: "weekly", priority: 0.4 },
    ...products.map((p) => ({
      url: `${appUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
