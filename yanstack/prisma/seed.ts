import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function threeLinks(slug: string) {
  return JSON.stringify({
    links: [
      {
        name: "夸克网盘",
        url: `https://pan.quark.cn/s/demo-${slug}`,
        code: "qk03",
      },
    ],
    note: "请使用夸克 App 打开链接下载。",
  });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@yanstack.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123456";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN", name: "研栈管理员" },
    create: {
      email: adminEmail,
      name: "研栈管理员",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@yanstack.local" },
    update: {},
    create: {
      email: "demo@yanstack.local",
      name: "演示学员",
      passwordHash: await bcrypt.hash("Demo123456", 10),
      role: "USER",
    },
  });

  const categories = [
    { name: "政治", slug: "politics", description: "马原、毛中特、史纲、思修与时政", sortOrder: 1 },
    { name: "英语", slug: "english", description: "英一/英二真题、词汇、作文模板", sortOrder: 2 },
    { name: "数学", slug: "math", description: "数一/数二/数三讲义与习题", sortOrder: 3 },
    { name: "专业课", slug: "major", description: "院校专业课真题与笔记", sortOrder: 4 },
    { name: "院校信息", slug: "school", description: "报录比、导师、复试经验", sortOrder: 5 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  const cat = async (slug: string) =>
    (await prisma.category.findUniqueOrThrow({ where: { slug } })).id;

  const products = [
    {
      title: "2026考研政治核心笔记·精编版",
      slug: "politics-core-2026",
      summary: "四门课框架图 + 高频考点速记，适合冲刺背诵。",
      description:
        "覆盖马原/毛中特/史纲/思修核心框架，含近五年命题趋势标注与时政补充位。免费领取，夸克网盘下载。",
      coverUrl: "/covers/politics.svg",
      priceCents: 0,
      originalCents: null as number | null,
      year: 2026,
      subject: "政治",
      schoolTags: JSON.stringify(["通用"]),
      examType: "统考",
      deliveryType: "NETDISK",
      deliveryPayload: threeLinks("politics-2026"),
      previewPages: JSON.stringify(["目录预览", "马原框架图样张"]),
      isFeatured: true,
      categoryId: await cat("politics"),
    },
    {
      title: "考研英语一真题精析 2016-2025",
      slug: "english-yi-2016-2025",
      summary: "十年真题逐题精析，含阅读长难句拆解与作文范文。",
      description: "英一真题 PDF + 答案精析 + 作文模板卡。免费领取后任选网盘下载。",
      coverUrl: "/covers/english.svg",
      priceCents: 0,
      originalCents: null,
      year: 2025,
      subject: "英语一",
      schoolTags: JSON.stringify(["通用"]),
      examType: "统考",
      deliveryType: "NETDISK",
      deliveryPayload: threeLinks("english-yi"),
      previewPages: JSON.stringify(["阅读样张", "作文模板卡"]),
      isFeatured: true,
      categoryId: await cat("english"),
    },
    {
      title: "高等数学强化讲义·数一数二通用",
      slug: "math-advanced-boost",
      summary: "极限、积分、多元、级数高频题型分类训练。",
      description: "按题型编排，每章含「易错点」与「考试年出现频率」。附配套习题答案册。",
      coverUrl: "/covers/math.svg",
      priceCents: 0,
      originalCents: null,
      year: 2026,
      subject: "数学",
      schoolTags: JSON.stringify(["通用"]),
      examType: "统考",
      deliveryType: "NETDISK",
      deliveryPayload: threeLinks("math-boost"),
      previewPages: JSON.stringify(["章节目录", "积分题型页"]),
      isFeatured: true,
      categoryId: await cat("math"),
    },
    {
      title: "408计算机统考真题与答案汇编",
      slug: "cs-408-pack",
      summary: "数据结构/组成原理/操作系统/计网真题合集。",
      description: "按科目分册整理，含近年机试常见考点索引表。",
      coverUrl: "/covers/cs.svg",
      priceCents: 0,
      originalCents: null,
      year: 2025,
      subject: "408",
      schoolTags: JSON.stringify(["计算机", "软院"]),
      examType: "统考",
      deliveryType: "NETDISK",
      deliveryPayload: threeLinks("cs-408"),
      previewPages: JSON.stringify(["索引表预览"]),
      isFeatured: false,
      categoryId: await cat("major"),
    },
    {
      title: "新闻传播学热点专题笔记 2026",
      slug: "journalism-hot-2026",
      summary: "传播学理论框架 + 年度热点专题答题模板。",
      description: "适合新传考研冲刺，含名词解释库与大题模板。",
      coverUrl: "/covers/media.svg",
      priceCents: 0,
      originalCents: null,
      year: 2026,
      subject: "新闻传播",
      schoolTags: JSON.stringify(["新传", "传媒"]),
      examType: "专业课",
      deliveryType: "NETDISK",
      deliveryPayload: threeLinks("media-2026"),
      previewPages: JSON.stringify(["热点目录"]),
      isFeatured: false,
      categoryId: await cat("major"),
    },
    {
      title: "目标院校报录比与复试经验包",
      slug: "school-ratio-pack",
      summary: "30+ 热门院校近年报录数据与复试流程整理。",
      description: "含联系导师建议、复试礼仪与常见问答。数据仅供参考，以院校官网为准。",
      coverUrl: "/covers/school.svg",
      priceCents: 0,
      originalCents: null,
      year: 2025,
      subject: "院校信息",
      schoolTags: JSON.stringify(["985", "211", "双一流"]),
      examType: "通用",
      deliveryType: "NETDISK",
      deliveryPayload: threeLinks("school-ratio"),
      previewPages: JSON.stringify(["数据样表"]),
      isFeatured: true,
      categoryId: await cat("school"),
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  // 兜底：所有商品价格清零
  await prisma.product.updateMany({ data: { priceCents: 0, originalCents: null } });

  const settings: Record<string, string> = {
    site_tagline: "把真正有用的考研资料，交到你手里",
    support_wechat: "请填写客服微信号",
    support_email: "support@yanstack.local",
    announcement: "全部资料免费领取：点击「立即领取」后通过夸克网盘下载。",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  console.log("Seed OK (free claim mode)");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
