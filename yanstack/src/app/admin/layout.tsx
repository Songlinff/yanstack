import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin-shell";

export const metadata: Metadata = {
  title: "研栈后台",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/");

  const newFeedbackCount = await prisma.feedback.count({ where: { status: "NEW" } });

  return (
    <AdminShell adminName={user.name} newFeedbackCount={newFeedbackCount}>
      {children}
    </AdminShell>
  );
}
