import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="brand-display text-4xl">页面不存在</h1>
      <p className="mt-3 text-ink-soft">链接可能已失效，或资料已下架。</p>
      <Link href="/products" className="btn btn-primary mt-6 inline-flex">
        回资料库
      </Link>
    </div>
  );
}
