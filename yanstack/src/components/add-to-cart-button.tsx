"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatCNY } from "@/lib/utils";
import { useToast } from "./toast";

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    coverUrl: string;
    priceCents: number;
    stock?: number;
  };
  compact?: boolean;
};

export function AddToCartButton({ product, compact }: Props) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const { push } = useToast();
  const [done, setDone] = useState(false);
  const soldOut = product.stock === 0;

  const payload = {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    coverUrl: product.coverUrl,
    priceCents: product.priceCents,
  };

  if (soldOut) {
    return <button className="btn btn-ghost opacity-60" disabled>已售罄</button>;
  }

  return (
    <div className={`flex flex-wrap gap-3 ${compact ? "justify-end" : ""}`}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          add(payload);
          setDone(true);
          push("已加入购物车", "ok");
          setTimeout(() => setDone(false), 1600);
        }}
      >
        {done ? "已加入" : compact ? "加购" : `加入购物车 · ${formatCNY(product.priceCents)}`}
      </button>
      {!compact && (
        <button
          type="button"
          className="btn btn-ink"
          onClick={() => {
            add(payload);
            push("即将去结算", "info");
            router.push("/checkout");
          }}
        >
          立即购买
        </button>
      )}
    </div>
  );
}
