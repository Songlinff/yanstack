import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  mkdirSync(join(process.cwd(), "output"), { recursive: true });
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    include: { category: true },
  });
  const announcement = await prisma.siteSetting.findUnique({
    where: { key: "announcement" },
  });
  const payload = {
    announcement: announcement?.value || "",
    products: products.map((x) => ({
      title: x.title,
      slug: x.slug,
      summary: x.summary,
      description: x.description,
      coverUrl: x.coverUrl,
      priceCents: x.priceCents,
      originalCents: x.originalCents,
      stock: x.stock,
      year: x.year,
      subject: x.subject,
      schoolTags: x.schoolTags,
      examType: x.examType,
      deliveryType: x.deliveryType,
      deliveryPayload: x.deliveryPayload,
      previewPages: x.previewPages,
      isPublished: x.isPublished,
      isFeatured: x.isFeatured,
      categorySlug: x.category.slug,
    })),
  };
  writeFileSync(
    join(process.cwd(), "output", "sync-payload.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );
  console.log("exported", payload.products.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
