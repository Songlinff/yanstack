"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductEditor } from "@/components/product-editor";

type Category = { id: string; name: string };

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  if (!categories.length) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-ink-soft">加载分类中…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="brand-display text-3xl">上架新资料</h1>
      <ProductEditor
        categories={categories}
        // after save ProductEditor goes to /admin/products
      />
      <button className="mt-4 text-sm text-accent" onClick={() => router.push("/admin")}>
        返回后台
      </button>
    </div>
  );
}
