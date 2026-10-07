import { stripSourcePath } from "./utils";

export type ProductDetailInput = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  subject: string | null;
  year: number | null;
  examType: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  previewPages?: string[];
};

export type ProductDetailContent = {
  intro: string;
  highlights: string[];
  audience: string[];
  howToUse: string[];
  claimTips: string[];
  kindLabel: string;
};

type Kind =
  | "zhenti"
  | "mock"
  | "book"
  | "course"
  | "fushi"
  | "ebook"
  | "tool"
  | "choose"
  | "single"
  | "general";

function blob(p: ProductDetailInput) {
  return `${p.slug} ${p.title} ${p.subject || ""} ${p.examType || ""} ${p.categorySlug || ""} ${p.summary || ""}`;
}

function detectKind(p: ProductDetailInput): Kind {
  const s = blob(p);

  if (/fushi|复试|调剂|简历/.test(s) && !/押题|模拟|真题讲解/.test(s)) return "fushi";
  if (/择校|school-choose/.test(s)) return "choose";
  if (/答题卡|做题本|艾宾浩斯|康奈尔|计划表|学习工具|tool-/.test(s)) return "tool";
  if (/电子书|ebook|高清PDF|pack-27-pdf|pack-2526|pack-27-ebook/.test(s)) return "ebook";

  // 押题 / 模拟 / 套卷（优先于真题、课程）
  if (/押题|模拟卷|套卷|临门一脚|十页纸|超越卷|共创|yati|hegongda|冲刺押题/.test(s)) return "mock";

  // 网课 / 真题精讲课配套
  if (/真题讲解|逐篇精讲|技巧班|小三门|专题课|course-en|course-pol|领学班|全程班/.test(s)) return "course";

  // 图书 / 词汇 / 讲义
  if (/黄皮书|词汇|红宝书|闪过|橙啦|空卡|2200|223词|30讲|辅导讲义|零基础|真相|一本通|讲义|book|hongbaoshu|cihui|zhenxiang|kongka|wangjingting/.test(s))
    return "book";

  // 历年真题卷库
  if (/zhenti|历年真题|真题至|真题及答案|真题汇总|408|311|333|396|306|307|312|313|199|西综|管综|农学414|日语203|answer-card/.test(s))
    return "zhenti";

  if (/1500|单文件|en-1500/.test(s) || (p.previewPages?.length === 1 && !String(p.previewPages[0]).includes("📁")))
    return "single";

  // 综合冲刺大包（非单纯押题卷）
  if (/冲刺资料|course-math-zhangyu/.test(s)) return "mock";

  return "general";
}

function yearText(year: number | null) {
  return year ? `${year}` : "近年";
}

function subjectText(p: ProductDetailInput) {
  return (p.subject || p.categoryName || "考研").replace(/真题|复试/g, "").trim() || "考研";
}

function topFolderHints(previews: string[] = []) {
  return previews
    .filter((x) => x.includes("📁"))
    .map((x) => x.replace(/^[\s　]*📁\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function claimTipsBase() {
  return ["免费领取，仅提供夸克网盘下载", "建议用夸克 App 打开后转存到自己的网盘再看"];
}

function buildZhenti(p: ProductDetailInput): ProductDetailContent {
  const subject = subjectText(p);
  const year = yearText(p.year);
  const folders = topFolderHints(p.previewPages);
  const isAll = /全科|2026-all|真题及答案|真题汇总|zhenti-pack/.test(`${p.slug}${p.title}`);
  const isCard = /答题卡/.test(`${p.slug}${p.title}${subject}`);

  if (isCard) {
    return {
      kindLabel: "答题卡",
      intro: "考研各科答题卡高清电子版，用于平时限时模考时按正式考场格式填写，熟悉涂卡与书写区域。",
      highlights: [
        "含公共课及部分统考专业课答题卡（以网盘目录为准）",
        "打印后配合真题空白卷使用效果更好",
        folders.length ? `目录可见：${folders.slice(0, 3).join("、")}` : "按科目分文件夹存放",
      ],
      audience: ["平时模考想按正式卡面练习的同学", "需要打印空白答题卡的人"],
      howToUse: ["打印后与对应科目真题一起限时作答", "涂卡区单独计时，避免考场生疏"],
      claimTips: claimTipsBase(),
    };
  }

  const intro = isAll
    ? `这份资料汇总多版本历年真题与答案（含 ${year} 相关卷），方便按科目对照练习。`
    : `${subject} 历年真题整理至 ${year}，按年份/卷别归档，适合系统刷题与模考。`;

  return {
    kindLabel: "真题卷库",
    intro,
    highlights: [
      isAll ? "覆盖公共课及部分统考专业课（以目录为准）" : `聚焦「${subject}」真题`,
      folders.length
        ? `网盘内可见：${folders.slice(0, 3).join("、")}${folders.length > 3 ? " 等" : ""}`
        : "已按年份/卷别归类",
      "右侧为目录预览，完整文件以夸克为准",
    ],
    audience: [
      "基础—强化阶段：按年份由近到远刷真题",
      "二战同学：针对薄弱年份/题型回炉",
      "冲刺阶段：整卷限时模考，对标正式考试节奏",
    ],
    howToUse: [
      "先闭卷限时做完，再对答案，避免边做边看解析",
      "错题记下考点，隔几天用空白卷或错题本回看",
      "专业课请结合目标院校要求选卷，不必全部刷完",
    ],
    claimTips: claimTipsBase(),
  };
}

function buildMock(p: ProductDetailInput): ProductDetailContent {
  const year = yearText(p.year);
  const folders = topFolderHints(p.previewPages);
  const isYati = /押题|套卷|肖四|腿姐|张宇|李林|预测/.test(`${p.slug}${p.title}${folders.join("")}`);
  const isHegongda = /合工大|超越|共创/.test(`${p.slug}${p.title}`);

  const intro = isHegongda
    ? `合工大共创 / 超越系列模拟卷合集，用于 ${year} 前后数学等科目的套卷训练（具体卷种以目录为准）。`
    : isYati
      ? `「${p.title}」为冲刺阶段押题卷 / 预测套卷合集（肖四、腿姐、张宇、李林等常见套卷，以网盘目录为准），不是历年真题库。`
      : `「${p.title}」为冲刺向模拟卷与押题资料合集，适合临考前整卷演练，具体清单见右侧目录。`;

  return {
    kindLabel: "押题 / 模拟套卷",
    intro,
    highlights: [
      "内容以名师冲刺套卷、预测卷、模拟卷为主",
      folders.length
        ? `当前目录含：${folders.slice(0, 4).join("、")}${folders.length > 4 ? " 等" : ""}`
        : "按老师/卷种分文件夹",
      "用于限时模考与查漏，不能替代历年真题",
      "完整文件以夸克分享为准",
    ],
    audience: [
      "冲刺阶段：需要整套限时模考的同学",
      "已刷过近年真题、想再用套卷练手感的人",
      "想对照名师押题卷查缺补漏的考生",
    ],
    howToUse: [
      "选 1～2 套精做即可，不必把所有老师的卷都做完",
      "严格按考试时长闭卷完成，再对答案复盘错题",
      "押题卷仅供参考，最终仍以大纲与真题题感为准",
    ],
    claimTips: claimTipsBase(),
  };
}

function buildBook(p: ProductDetailInput): ProductDetailContent {
  const subject = subjectText(p);
  const year = yearText(p.year);
  const isVocab = /词汇|单词|闪过|红宝书|空卡|2200|223|1500|刘晓燕|王晶婷/.test(
    `${p.slug}${p.title}${subject}`,
  );
  const isMathBook = /30讲|汤家凤|周洋鑫|高数|零基础|数学/.test(`${p.slug}${p.title}${subject}`);
  const isLaw = /法硕|一本通/.test(`${p.slug}${p.title}`);

  const intro = isVocab
    ? `「${p.title}」为英语词汇 / 单词类电子资料（约 ${year} 备考），适合日常背记与打卡，不是套卷或真题讲解课。`
    : isLaw
      ? `「${p.title}」为法硕复习用图书/讲义电子版，按章节搭建知识框架时使用。`
      : isMathBook
        ? `「${p.title}」为数学基础 / 讲义类电子资料，适合搭框架与跟练例题，再配合真题巩固。`
        : `「${p.title}」为 ${subject} 复习用电子书或讲义资料（约 ${year}），可与纸质书对照使用。`;

  return {
    kindLabel: isVocab ? "词汇资料" : "讲义 / 图书",
    intro,
    highlights: [
      `科目方向：${subject}`,
      isVocab ? "以词表 / 词汇书 PDF 为主" : "以 PDF 讲义或电子书为主（以目录为准）",
      "可与真题、套卷搭配使用",
    ],
    audience: isVocab
      ? ["基础或强化阶段需要系统背词的同学", "想用电子版随时打卡的人"]
      : ["搭框架、看讲义的基础—强化阶段同学", "需要电子版检索与随身看的人"],
    howToUse: isVocab
      ? ["按词表定量打卡，结合真题例句记忆", "不要只收藏：设定每日任务并复习旧词"]
      : ["先通读目录，标出薄弱章节再精读", "每学完一块内容，立刻做对应真题小题巩固"],
    claimTips: claimTipsBase(),
  };
}

function buildCourse(p: ProductDetailInput): ProductDetailContent {
  const subject = subjectText(p);
  const year = yearText(p.year);
  const isLecture = /真题讲解|逐篇精讲|完型|翻译|阅读/.test(`${p.slug}${p.title}`);

  return {
    kindLabel: isLecture ? "真题精讲资料" : "课程配套资料",
    intro: isLecture
      ? `「${p.title}」为名师真题精讲类资料（讲义 / 课件 / 分年讲解等），用于跟着讲解过真题，不是空白真题卷库本身。`
      : `「${p.title}」为 ${year} ${subject} 课程配套资料（讲义、课件等）。用于跟课与回看，具体视频以授课平台为准。`,
    highlights: [
      `对应科目：${subject}`,
      isLecture ? "按老师 / 年份 / 题型分文件夹" : "网盘内为课程配套电子资料",
      "右侧可预览主要目录",
    ],
    audience: isLecture
      ? ["需要跟名师带刷真题的同学", "做完真题后想听精讲复盘的人"]
      : ["正在跟对应班型上课的同学", "需要补讲义、课件的同学"],
    howToUse: isLecture
      ? ["先自己做真题，再对照本资料听/看讲解", "按题型或年份挑自己薄弱部分，不必从头看到尾"]
      : ["按课程进度同步取用当周讲义", "冲刺期只保留高频讲义，其余归档"],
    claimTips: [...claimTipsBase(), "资料仅供个人学习，请尊重授课老师与版权"],
  };
}

function buildFushi(p: ProductDetailInput): ProductDetailContent {
  const isResume = /简历/.test(p.title);
  const isQa = /100问|调剂/.test(p.title);
  const isSchool = /高校|院校|真题/.test(p.title) && !isResume;

  const intro = isResume
    ? "复试简历模板合集，先搭结构再改成符合目标院校要求的个人版本。"
    : isQa
      ? "复试高频问答与调剂相关资料，适合出分后快速建立复试与调剂认知。"
      : isSchool
        ? "多校复试真题 / 回忆向资料，用于了解院校风格（以网盘内学校文件夹为准）。"
        : "复试阶段实用资料包，具体清单见右侧目录。";

  return {
    kindLabel: "复试资料",
    intro,
    highlights: isResume
      ? ["多款模板可选", "先套结构再填经历", "提交前按院校格式微调"]
      : isQa
        ? ["覆盖常见问答思路", "含调剂相关参考", "适合出分后集中准备"]
        : ["按院校 / 主题分文件夹", "了解题型侧重，非标准答案保证", "请结合官网最新复试通知"],
    audience: ["初试出分前后准备复试的同学", "有调剂意向、需要了解流程的人"],
    howToUse: [
      "先查目标院校最新复试办法，再打开对应资料",
      isResume ? "改完请学长或老师过目，避免空泛表述" : "真题类做口述计时练习，模拟真实压力",
    ],
    claimTips: [...claimTipsBase(), "院校政策常变，以研究生院最新通知为准"],
  };
}

function buildEbook(p: ProductDetailInput): ProductDetailContent {
  const year = yearText(p.year);
  const folders = topFolderHints(p.previewPages);
  return {
    kindLabel: "电子书合集",
    intro: `「${p.title}」为 ${year} 前后考研电子书 / 高清 PDF 合集，体积较大、版本可能有多套，请按自己需要转存，不必全部下载。`,
    highlights: [
      folders.length ? `目录示例：${folders.slice(0, 3).join("、")}` : "按科目或来源分文件夹",
      "可能含多个整理版本，内容有重叠属正常",
      "完整清单以夸克为准",
    ],
    audience: ["需要电子版教材 / 讲义的同学", "想先浏览目录再挑选下载的人"],
    howToUse: [
      "先看右侧目录，只转存自己科目需要的部分",
      "同一本书若有多版本，保留更新更清晰的一份即可",
    ],
    claimTips: claimTipsBase(),
  };
}

function buildTool(p: ProductDetailInput): ProductDetailContent {
  const isCard = /答题卡/.test(`${p.slug}${p.title}`);
  const isPlan = /计划表|艾宾浩斯|康奈尔|做题本/.test(`${p.slug}${p.title}`);
  return {
    kindLabel: isCard ? "答题卡" : "学习工具",
    intro: isCard
      ? "各科答题卡电子版，用于日常模考按正式格式作答。"
      : `「${p.title}」为学习计划 / 笔记模板 / 记忆表一类工具资料，用来辅助安排复习节奏，不是试题本身。`,
    highlights: [
      isPlan ? "模板类文件，可打印或复制后填写" : "工具向资料，体量通常较小",
      "按个人习惯选用即可",
    ],
    audience: ["需要规划学习节奏或整理笔记的同学", "想用模板提升复习效率的人"],
    howToUse: [
      isCard ? "打印后配合真题或套卷限时使用" : "结合自己的复习日历填写，避免形式化打卡",
      "工具是辅助，真正提分仍靠真题与薄弱项复盘",
    ],
    claimTips: claimTipsBase(),
  };
}

function buildChoose(p: ProductDetailInput): ProductDetailContent {
  return {
    kindLabel: "择校择专",
    intro: "择校择专专题资料，帮助了解专业方向与避坑要点，不是公共课刷题资料。",
    highlights: ["含择校指导与专业讲解相关内容（以目录为准）", "建议结合自身分数与兴趣判断"],
    audience: ["尚未确定院校专业、需要系统了解的同学", "跨专业考生想听专业讲解的人"],
    howToUse: ["先听 / 看总览课，再按自己目标学科深入", "最终仍要核对目标院校最新招生目录"],
    claimTips: claimTipsBase(),
  };
}

function buildSingle(p: ProductDetailInput): ProductDetailContent {
  return {
    kindLabel: "单份资料",
    intro: `「${p.title}」为单份电子资料，体量小、打开快，适合当作每日轻量任务。`,
    highlights: [p.summary || "单文件，减少选择成本", "下载后即可开始"],
    audience: ["需要碎片化背记的同学", "想先领一份轻量资料的人"],
    howToUse: ["设定每日定量并打卡", "结合真题语境使用效果更好"],
    claimTips: claimTipsBase(),
  };
}

function buildGeneral(p: ProductDetailInput): ProductDetailContent {
  const base = stripSourcePath(p.description) || p.summary;
  return {
    kindLabel: "学习资料",
    intro: base.length > 20 ? base : `「${p.title}」整理自夸克分享，请先看右侧目录再领取。`,
    highlights: [
      p.subject ? `方向：${p.subject}` : "按备考场景整理",
      p.year ? `主要面向 ${p.year} 备考` : "可用于同类复习",
      "完整内容以夸克为准",
    ],
    audience: ["需要该主题资料的考研同学"],
    howToUse: ["先浏览目录，确认需要的部分再转存", "按自己的复习计划使用，避免只收藏"],
    claimTips: claimTipsBase(),
  };
}

/** 生成详情页结构化文案（按资料类型区分） */
export function buildProductDetailContent(p: ProductDetailInput): ProductDetailContent {
  switch (detectKind(p)) {
    case "zhenti":
      return buildZhenti(p);
    case "mock":
      return buildMock(p);
    case "book":
      return buildBook(p);
    case "course":
      return buildCourse(p);
    case "fushi":
      return buildFushi(p);
    case "ebook":
      return buildEbook(p);
    case "tool":
      return buildTool(p);
    case "choose":
      return buildChoose(p);
    case "single":
      return buildSingle(p);
    default:
      return buildGeneral(p);
  }
}

/** 测试 / 排查用：导出识别结果 */
export function detectProductKind(p: ProductDetailInput): Kind {
  return detectKind(p);
}
