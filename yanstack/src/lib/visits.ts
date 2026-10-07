import { prisma } from "./prisma";

const PV_KEY = "front_pv";

export async function getFrontPv(): Promise<number> {
  const row = await prisma.siteSetting.findUnique({ where: { key: PV_KEY } });
  const n = Number(row?.value || 0);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** 前台页面访问 +1（后台路径不计） */
export async function incrementFrontPv(): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.siteSetting.findUnique({ where: { key: PV_KEY } });
    const next = (Number(row?.value || 0) || 0) + 1;
    await tx.siteSetting.upsert({
      where: { key: PV_KEY },
      create: { key: PV_KEY, value: String(next) },
      update: { value: String(next) },
    });
    return next;
  });
}

/** 只升不降：用于部署覆盖数据库后恢复访问量下限 */
export async function ensureFrontPvAtLeast(min: number): Promise<number> {
  const floor = Math.max(0, Math.floor(min));
  return prisma.$transaction(async (tx) => {
    const row = await tx.siteSetting.findUnique({ where: { key: PV_KEY } });
    const cur = Number(row?.value || 0) || 0;
    const next = Math.max(cur, floor);
    await tx.siteSetting.upsert({
      where: { key: PV_KEY },
      create: { key: PV_KEY, value: String(next) },
      update: { value: String(next) },
    });
    return next;
  });
}
