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
  "zhenti-333": {
    category: "major",
    subject: "教育综合333",
    year: 2026,
    examType: "统考",
    cover: "/covers/media.svg",
    featured: true,
    summary: "教育综合 333 历年真题至 2026。",
    description: "教育学专硕 333 真题合集，夸克永久无提取码。",
  },
  "zhenti-396": {
    category: "major",
    subject: "经综396",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    summary: "经济类联考 396 真题至 2026。",
    description: "396 经济类联考历年真题，夸克领取。",
  },
  "zhenti-306": {
    category: "major",
    subject: "西综306",
    year: 2026,
    examType: "统考",
    cover: "/covers/cs.svg",
    featured: true,
    summary: "西医综合 306 真题至 2026。",
    description: "西综历年真题资料包，夸克永久链。",
  },
  "zhenti-fashuo": {
    category: "major",
    subject: "法硕",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "法律硕士历年真题至 2026。",
    description: "法硕（法学/非法学）真题合集，夸克领取。",
  },
  "zhenti-307": {
    category: "major",
    subject: "中医综合307",
    year: 2026,
    examType: "统考",
    cover: "/covers/media.svg",
    summary: "中医综合 307 真题至 2026。",
    description: "中医综合历年真题，夸克永久无提取码。",
  },
  "zhenti-199": {
    category: "major",
    subject: "管综199",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "管理类联考 199 真题至 2026。",
    description: "管综历年真题资料，夸克领取。",
  },
  "zhenti-313": {
    category: "major",
    subject: "历史学313",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    summary: "历史学 313 真题至 2026。",
    description: "历史学基础真题合集，夸克永久链。",
  },
  "zhenti-312": {
    category: "major",
    subject: "心理学312",
    year: 2026,
    examType: "统考",
    cover: "/covers/media.svg",
    summary: "心理学 312 真题至 2026。",
    description: "心理学专业基础综合真题，夸克领取。",
  },
  "zhenti-nongxue": {
    category: "major",
    subject: "农学联考",
    year: 2026,
    examType: "统考",
    cover: "/covers/cs.svg",
    summary: "农学联考真题（含 414 等）。",
    description: "农学相关统考真题及答案，夸克永久无提取码。",
  },
  "zhenti-203": {
    category: "english",
    subject: "日语203",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "考研日语 203 真题（2005-2026）。",
    description: "日语二外真题合集，夸克领取。",
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
  "zhenti-pack": {
    category: "school",
    subject: "真题",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "历年真题大合集 + 各科答题卡。",
    description: "政英数与统考专业课真题多版本汇总，附答题卡，夸克永久链。",
  },
  "pack-hot": {
    category: "school",
    subject: "热更",
    year: 2027,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "持续更新热更包（随时失效请尽快转存）。",
    description: "网盘热更资料，链接可能变动，建议用夸克 App 打开后立即转存。",
  },
  "pack-27-ebook": {
    category: "school",
    subject: "电子书",
    year: 2027,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "2027 考研电子书大合集。",
    description: "多版本电子书与笔记合集，持续更新，夸克领取。",
  },
  "pack-27-pdf": {
    category: "school",
    subject: "电子书",
    year: 2027,
    examType: "统考",
    cover: "/covers/school.svg",
    summary: "27 考研高清 PDF 合集。",
    description: "英数政专与计划表等高清 PDF，夸克永久无提取码。",
  },
  "en-zhenxiang": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "考研真相（26+27 双版本）。",
    description: "英语真题解析《考研真相》合集，夸克领取。",
  },
  "course-en-all": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "历年英语真题讲解·名师汇总大包。",
    description: "田静/唐迟/颉斌斌/唐静/刘琦/易熙人等名师真题精讲合集，夸克永久链。",
  },
  "major-600schools": {
    category: "major",
    subject: "院校专业课",
    year: 2026,
    examType: "自命题",
    cover: "/covers/cs.svg",
    featured: true,
    summary: "600 所高校专业课真题笔记题库。",
    description: "海量院校专业课题库与笔记（持续更新），夸克领取。",
  },
  "school-choose": {
    category: "school",
    subject: "择校",
    year: 2026,
    examType: "择校",
    cover: "/covers/school.svg",
    featured: true,
    summary: "择校择专专题课（经管/理工/人文）。",
    description: "择校避坑与专业讲解专题，夸克永久无提取码。",
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
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "田静历年英语真题讲解合集。",
    description: "名师真题精讲视频/资料，按年份带刷，夸克永久无提取码。",
  },
  "course-en-tangchi": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "唐迟 05-25 真题阅读逐篇精讲。",
    description: "阅读真题带刷合集，适合精读与题感训练，夸克领取。",
  },
  "course-pol-xutao": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "2027 英语小三门（完型/新题型/翻译）合集。",
    description: "唐静、刘琦、易熙人等小三门资料合集，夸克永久链。",
  },
  "course-pol-tuijie": {
    category: "politics",
    subject: "政治",
    year: 2027,
    examType: "统考",
    cover: "/covers/politics.svg",
    featured: true,
    summary: "2027 腿姐政治技巧班（含基础/强化/技巧）。",
    description: "选择题技巧 + 大题阅卷人模版等完整班次资料，夸克领取。",
  },
  "course-math-zhangyu": {
    category: "school",
    subject: "冲刺",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "26 考研冲刺资料大合集（押题/模拟/作文等）。",
    description: "政治押题、英语急救、模拟卷等冲刺资料，夸克永久链。",
  },
  "pack-26-yati": {
    category: "school",
    subject: "冲刺押题",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "26 冲刺押题卷合集（肖四/腿姐/张宇/李林等）。",
    description: "含肖秀荣四套卷、腿姐四套卷、张宇预测卷、李林套卷、黄皮书模拟及作文押题等，夸克永久无提取码。",
  },
  "course-math-tang": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "26 考研英语专题课（阅读/翻译/作文）。",
    description: "石雷鹏、唐迟、田静等专题讲解合集，夸克领取。",
  },
  "fushi-200schools": {
    category: "school",
    subject: "复试",
    year: 2026,
    examType: "复试",
    cover: "/covers/school.svg",
    featured: true,
    summary: "各院校历年复试真题合集。",
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
    summary: "考研复试简历模板合集。",
    description: "复试简历模板合集，夸克永久链。",
  },
  "fushi-wangke": {
    category: "school",
    subject: "复试",
    year: 2026,
    examType: "复试",
    cover: "/covers/school.svg",
    featured: true,
    summary: "26 复试大礼包（真题/口语/简历/调剂）。",
    description: "复试全流程资料包：真题、自我介绍、简历、调剂等，夸克领取。",
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
  "pack-25-math": {
    category: "math",
    subject: "数学",
    year: 2025,
    examType: "统考",
    cover: "/covers/math.svg",
    summary: "25 考研数学模拟卷合集。",
    description: "数学模拟卷资料，夸克永久链。",
  },
  "pack-25-yati": {
    category: "school",
    subject: "冲刺押题",
    year: 2025,
    examType: "统考",
    cover: "/covers/school.svg",
    summary: "25 冲刺押题资料汇总。",
    description: "政治/英语/数学冲刺押题与相关资料，夸克领取。",
  },
  "pack-hegongda": {
    category: "math",
    subject: "数学",
    year: 2025,
    examType: "统考",
    cover: "/covers/math.svg",
    featured: true,
    summary: "合工大共创 / 超越卷合集。",
    description: "合工大共创超越系列套卷，夸克永久无提取码。",
  },
  "pack-25-shujuan": {
    category: "school",
    subject: "做题本",
    year: 2025,
    examType: "统考",
    cover: "/covers/school.svg",
    summary: "25 考研书籍做题本 PDF。",
    description: "政英数专做题本电子版，夸克领取。",
  },
  "pack-25-notes": {
    category: "school",
    subject: "笔记",
    year: 2025,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "25 考研笔记汇总（英数政专）。",
    description: "各科笔记合集，夸克永久链。",
  },
  "en-huangpishu-2627": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "黄皮书 26+27 双版本合集。",
    description: "含 2026 与 2027 黄皮书全套，夸克领取。",
  },
  "major-fashuo-ybt": {
    category: "major",
    subject: "法硕",
    year: 2027,
    examType: "统考",
    cover: "/covers/school.svg",
    featured: true,
    summary: "法硕《一本通》（2027）。",
    description: "法律硕士一本通资料，夸克永久无提取码。",
  },
  "en-kongka": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "空卡《考研英语 2200 核心词》。",
    description: "空卡核心词汇资料，夸克领取。",
  },
  "en-wangjingting": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "王晶婷《词汇讲义》（2027）。",
    description: "词汇讲义电子资料，夸克永久链。",
  },
  "pack-2526-ebook": {
    category: "school",
    subject: "电子书",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    summary: "25+26 考研电子书合集。",
    description: "往年电子书与笔记合集，夸克领取。",
  },
  "pack-27-ebook-alt": {
    category: "school",
    subject: "电子书",
    year: 2027,
    examType: "统考",
    cover: "/covers/school.svg",
    summary: "2027 考研电子书（另一整理版本）。",
    description: "与电子书大合集互补的另一套整理，夸克永久链。",
  },
  "tool-ebbinghaus": {
    category: "school",
    subject: "学习工具",
    year: 2027,
    examType: "工具",
    cover: "/covers/school.svg",
    summary: "艾宾浩斯遗忘曲线记忆表。",
    description: "背单词/复习节奏表，夸克领取。",
  },
  "tool-cornell": {
    category: "school",
    subject: "学习工具",
    year: 2027,
    examType: "工具",
    cover: "/covers/school.svg",
    summary: "康奈尔笔记模板。",
    description: "考研康奈尔笔记模板，夸克永久无提取码。",
  },
  "tool-plan": {
    category: "school",
    subject: "学习工具",
    year: 2027,
    examType: "工具",
    cover: "/covers/school.svg",
    summary: "考研学习计划表。",
    description: "学习计划表模板，夸克领取。",
  },
  "en-223": {
    category: "english",
    subject: "英语",
    year: 2027,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "考研英语高频 223 词。",
    description: "高频词汇资料，夸克永久链。",
  },
  "course-en-chairong": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "柴荣历年英语真题讲解。",
    description: "柴荣真题精讲合集，夸克领取。",
  },
  "course-en-jiebinbin": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    featured: true,
    summary: "颉斌斌 05-25 真题逐题精讲。",
    description: "按年份真题精讲，夸克永久无提取码。",
  },
  "course-en-liuqi": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "刘琦小三门历年真题讲解。",
    description: "完型/翻译/新题型真题带刷，夸克领取。",
  },
  "course-en-songyixuan": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "宋逸轩历年完型真题讲解。",
    description: "完型及阅读等相关真题讲解，夸克永久链。",
  },
  "course-en-tangjing": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "唐静翻译历年真题讲解。",
    description: "英一/英二翻译真题讲解，夸克领取。",
  },
  "course-en-yixiren": {
    category: "english",
    subject: "英语",
    year: 2026,
    examType: "统考",
    cover: "/covers/english.svg",
    summary: "易熙人完形真题讲解（04-25）。",
    description: "完形方法论与真题讲解，夸克永久无提取码。",
  },
  "zhenti-414": {
    category: "major",
    subject: "农学414",
    year: 2025,
    examType: "统考",
    cover: "/covers/cs.svg",
    summary: "农学 414 历年真题至 2025。",
    description: "农学联考 414 真题合集，夸克领取。",
  },
  "zhenti-answer-card": {
    category: "school",
    subject: "答题卡",
    year: 2026,
    examType: "统考",
    cover: "/covers/school.svg",
    summary: "全科答题卡高清 PDF。",
    description: "考研各科答题卡电子版，夸克永久链。",
  },
};

function deliveryPayload(quark: string) {
  return JSON.stringify({
    links: [{ name: "夸克网盘", url: quark }],
    note: "夸克网盘永久分享，无提取码。建议用夸克 App 打开后转存。",
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
      description: meta.description,
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
        "资料库已按最新夸克目录全量更新：统考真题、电子书、名师讲解与择校专题均可免费领取。点击「立即领取」→「夸克网盘」（永久无提取码）。",
    },
    create: {
      key: "announcement",
      value:
        "资料库已按最新夸克目录全量更新：统考真题、电子书、名师讲解与择校专题均可免费领取。点击「立即领取」→「夸克网盘」（永久无提取码）。",
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
