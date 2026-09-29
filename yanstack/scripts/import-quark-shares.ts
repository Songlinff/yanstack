/**
 * 将 output/quark-share-links.json 的 25 条夸克永久链灌入商品表
 * 用法: npx tsx scripts/import-quark-shares.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ShareItem = {
  key: string;
  productTitle: string;
  folderName: string;
  path: string;
  quark: string;
  passcode?: string;
};

type ShareFile = {
  items: ShareItem[];
  shareType?: string;
};

const META: Record<
  string,
  {
    category: string;
    subject: string;
    year: number;
    examType: string;
    cover: string;
    featured?: boolean;
    summary: string;
    description: string;
  }
> = {
  "zhenti-zhengzhi": {
    category: "politics",
    subject: "政治",
    year: 2026,
    examType: "统考",
    cover: "/covers/politics.svg",
    featured: true,
    summary: "考研政治历年真题汇编至 2026，免费夸克领取。",
    description: "含历年政治真题资料，适合刷题与模考。夸克网盘永久无提取码分享。",
  },
  "zhenti-yingyu": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "考研英语历年真题汇编至 2026。",
    description: "英一/英二相关真题资料合集，夸克永久链领取。",
  },
  "zhenti-shuxue": {
    category: "math",
    subject: "数学",
    year: 2026,
    examType: "统考",
    cover: "/covers/math.svg",
    featured: true,
    summary: "考研数学历年真题汇编至 2026。",
    description: "数学真题资料合集，夸克永久无提取码。",
  },
  "zhenti-408": {
    category: "major",
    subject: "408",
    year: 2026,
    examType: "统考",
    cover: "/covers/cs.svg",
    featured: true,
    summary: "计算机 408 历年真题至 2026。",
    description: "408 统考真题资料包，夸克领取。",
  },
  "zhenti-311": {
    category: "major",
    subject: "教育学311",
    year: 2026,
    examType: "统考",
    cover: "/covers/media.svg",
    summary: "教育学基础综合 311 真题至 2026。",
    description: "311 历年真题资料，夸克永久链。",
  },
  "zhenti-2026-all": {
    category: "school",
    subject: "真题",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "2026 全科真题及答案合集。",
    description: "含 2026 年公共课与部分统考专业课真题答案，夸克领取。",
  },
  "en-liuxiaoyan": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "刘晓燕 2027 词汇/语法/阅读资料包。",
    description: "含《你还在背单词吗》及相关讲义 PDF，夸克永久分享。",
  },
  "en-huangpishu": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "2027 考研英语黄皮书（英一&英二）。",
    description: "黄皮书电子资料，夸克领取。",
  },
  "en-cihuishanguo": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "2027《词汇闪过》资料包。",
    description: "词汇闪过相关电子资料，夸克永久链。",
  },
  "en-shileipeng": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "石雷鹏 / 橙啦词汇语法资料。",
    description: "词汇与语法讲义合集，夸克领取。",
  },
  "en-hongbaoshu": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "考研英语红宝书资料包。",
    description: "红宝书相关资料，夸克永久无提取码。",
  },
  "math-zhangyu30": {
    category: "math",
    subject: "数学",
    year: 2027,
    examType: "统考",
    cover: "/covers/math.svg",
    featured: true,
    summary: "张宇《基础 30 讲》2027。",
    description: "基础 30 讲电子资料，夸克领取。",
  },
  "math-tangjiafeng": {
    category: "math",
    subject: "数学",
    year: 2027,
    examType: "统考",
    cover: "/covers/math.svg",
    summary: "汤家凤高数辅导讲义·基础篇。",
    description: "高数基础篇讲义，夸克永久链。",
  },
  "math-zhouyangxin": {
    category: "math",
    subject: "数学",
    year: 2027,
    examType: "统考",
    cover: "/covers/math.svg",
    summary: "周洋鑫《零基础提前学》。",
    description: "零基础数学提前学资料，夸克领取。",
  },
  "course-en-tianjing": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "2027 田静启航英语全程班资料。",
    description: "网课配套文件夹分享（夸克永久无提取码）。",
  },
  "course-en-tangchi": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "2027 唐迟有道领学班资料。",
    description: "唐迟全程班相关资料，夸克领取。",
  },
  "course-pol-xutao": {
    category: "politics",
    subject: "政治",
    year: 2027,
    examType: "统考",
    cover: "/covers/politics.svg",
    featured: true,
    summary: "2027 徐涛研途政治全程班。",
    description: "徐涛全程班资料文件夹，夸克永久链。",
  },
  "course-pol-tuijie": {
    category: "politics",
    subject: "政治",
    year: 2027,
    examType: "统考",
    cover: "/covers/politics.svg",
    summary: "2027 腿姐笑过政治全程班。",
    description: "腿姐全程班资料，夸克领取。",
  },
  "course-math-zhangyu": {
    category: "math",
    subject: "数学",
    year: 2027,
    examType: "统考",
    cover: "/covers/math.svg",
    featured: true,
    summary: "2027 张宇启航数学专属班。",
    description: "张宇等启航专属班资料，夸克永久链。",
  },
  "course-math-tang": {
    category: "math",
    subject: "数学",
    year: 2027,
    examType: "统考",
    cover: "/covers/math.svg",
    summary: "2027 汤家凤哔哩数学全程班。",
    description: "汤家凤哔哩全程班资料，夸克领取。",
  },
  "fushi-200schools": {
    category: "school",
    subject: "复试",
    year: 2026,
    examType: "复试",
    cover: "/covers/school.svg",
    featured: true,
    summary: "200+ 热门高校复试真题合辑。",
    description: "多校复试真题资料包，夸克永久无提取码。",
  },
  "fushi-100wen": {
    category: "school",
    subject: "复试",
    year: 2026,
    examType: "复试",
    cover: "/covers/school.svg",
    summary: "复试必杀 100 问 + 调剂宝典。",
    description: "复试问答与调剂资料，夸克领取。",
  },
  "fushi-jianli": {
    category: "school",
    subject: "复试",
    year: 2026,
    examType: "复试",
    cover: "/covers/school.svg",
    summary: "考研复试简历模板 124 款。",
    description: "复试简历模板合集，夸克永久链。",
  },
  "fushi-wangke": {
    category: "school",
    subject: "复试",
    year: 2026,
    examType: "复试",
    cover: "/covers/school.svg",
    summary: "复试网课最新版（含机构讲义）。",
    description: "复试网课与讲义资料包，夸克领取。",
  },
  "en-1500": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "考研英语核心 1500 词 PDF。",
    description: "单文件 PDF，夸克永久无提取码下载。",
  },
};

function deliveryPayload(quark: string) {
  return JSON.stringify({
    links: [
      { name: "百度网盘", url: "#", note: "暂未配置，请先用夸克" },
      { name: "阿里云盘", url: "#", note: "暂未配置，请先用夸克" },
      { name: "夸克网盘", url: quark },
    ],
    note: "目前已开通夸克（永久·无提取码）。百度/阿里稍后补齐，内容相同。",
  });
}

async function main() {
  const file = join(process.cwd(), "output", "quark-share-links.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as ShareFile;
  if (!data.items?.length) throw new Error("quark-share-links.json 无 items");

  const categories = [
    { name: "政治", slug: "politics", description: "政治真题与网课资料", sortOrder: 1 },
    { name: "英语", slug: "english", description: "英语真题、词汇与网课", sortOrder: 2 },
    { name: "数学", slug: "math", description: "数学真题与网课资料", sortOrder: 3 },
    { name: "专业课", slug: "major", description: "统考专业课真题", sortOrder: 4 },
    { name: "院校信息", slug: "school", description: "复试、院校与综合资料", sortOrder: 5 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  const catId = async (slug: string) =>
    (await prisma.category.findUniqueOrThrow({ where: { slug } })).id;

  // 下架旧演示商品（demo 链接）
  const demos = await prisma.product.findMany({
    where: { deliveryPayload: { contains: "demo-" } },
  });
  for (const d of demos) {
    await prisma.product.update({
      where: { id: d.id },
      data: { isPublished: false, isFeatured: false },
    });
  }

  let upserted = 0;
  for (const item of data.items) {
    const meta = META[item.key];
    if (!meta) {
      console.warn("跳过未知 key:", item.key);
      continue;
    }
    const slug = `qk-${item.key}`;
    const payload = {
      title: item.productTitle,
      slug,
      summary: meta.summary,
      description: `${meta.description}\n\n来源路径：${item.path}`,
      coverUrl: meta.cover,
      priceCents: 0,
      originalCents: null as number | null,
      stock: -1,
      year: meta.year,
      subject: meta.subject,
      schoolTags: JSON.stringify(["通用"]),
      examType: meta.examType,
      deliveryType: "NETDISK",
      deliveryPayload: deliveryPayload(item.quark),
      previewPages: JSON.stringify([]),
      isPublished: true,
      isFeatured: !!meta.featured,
      categoryId: await catId(meta.category),
    };
    await prisma.product.upsert({
      where: { slug },
      update: payload,
      create: payload,
    });
    upserted += 1;
    console.log("OK", slug, item.quark);
  }

  await prisma.siteSetting.upsert({
    where: { key: "announcement" },
    update: {
      value:
        "首批 25 份资料已上架：点击「立即领取」→ 选「夸克网盘」即可（永久无提取码）。百度/阿里稍后补齐。",
    },
    create: {
      key: "announcement",
      value:
        "首批 25 份资料已上架：点击「立即领取」→ 选「夸克网盘」即可（永久无提取码）。百度/阿里稍后补齐。",
    },
  });

  const published = await prisma.product.count({ where: { isPublished: true } });
  console.log(`\n完成：写入 ${upserted} 条；当前上架商品 ${published}；演示商品已下架 ${demos.length} 条。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
