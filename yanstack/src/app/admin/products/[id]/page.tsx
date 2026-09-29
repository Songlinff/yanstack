import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductEditor } from "@/components/product-editor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") redirect("/login");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="brand-display text-3xl">编辑资料</h1>
      <ProductEditor product={product} categories={categories} />
    </div>
  );
}
