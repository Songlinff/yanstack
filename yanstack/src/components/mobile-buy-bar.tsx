"use client";

import { ClaimButton } from "./claim-button";
import type { NetdiskLink } from "@/lib/utils";

export function MobileBuyBar({
  productId,
  title,
  links,
  note,
  stock,
}: {
  productId: string;
  title: string;
  links: NetdiskLink[];
  note?: string;
  stock?: number;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#f3f6fa]/95 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="text-lg font-bold text-accent">免费领取</div>
        <ClaimButton
          productId={productId}
          title={title}
          links={links}
          note={note}
          stock={stock}
          compact
        />
      </div>
    </div>
  );
}
