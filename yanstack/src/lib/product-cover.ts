/** 按科目/分类解析封面配色与主副标题，避免静态 SVG 文案错位 */

export type CoverTheme = {
  from: string;
  to: string;
  accent: string;
  blob?: string;
};

const THEMES: Record<string, CoverTheme> = {
  politics: { from: "#0c2340", to: "#0d9488", accent: "#c7f9f0", blob: "#0d9488" },
  english: { from: "#1a3a5c", to: "#c45c26", accent: "#ffe8d6", blob: "#c45c26" },
  math: { from: "#0f766e", to: "#0c2340", accent: "#99f6e4", blob: "#14b8a6" },
  cs: { from: "#102a43", to: "#134e4a", accent: "#9fb3c8", blob: "#0d9488" },
  medicine: { from: "#0f2942", to: "#0e7490", accent: "#a5f3fc", blob: "#0891b2" },
  law: { from: "#1c1917", to: "#44403c", accent: "#fde68a", blob: "#a8a29e" },
  education: { from: "#243b53", to: "#7c3aed", accent: "#e9d5ff", blob: "#8b5cf6" },
  psych: { from: "#312e81", to: "#0f766e", accent: "#c7d2fe", blob: "#6366f1" },
  economy: { from: "#0c2340", to: "#b45309", accent: "#fde68a", blob: "#d97706" },
  history: { from: "#292524", to: "#78350f", accent: "#fed7aa", blob: "#a16207" },
  agri: { from: "#14532d", to: "#0c2340", accent: "#bbf7d0", blob: "#16a34a" },
  school: { from: "#0c2340", to: "#1a3a5c", accent: "#9fb3c8", blob: "#0d9488" },
  general: { from: "#0c2340", to: "#0d9488", accent: "#c7f9f0", blob: "#0d9488" },
};

export function resolveCoverTheme(input: {
  subject?: string | null;
  categorySlug?: string | null;
  title?: string;
}): CoverTheme {
  const s = `${input.subject || ""} ${input.title || ""} ${input.categorySlug || ""}`;
  if (/408|计算机|计组|操作系统|数据结构/.test(s)) return THEMES.cs;
  if (/西综|306|西医|中医|307|医学|护理/.test(s)) return THEMES.medicine;
  if (/法硕|法学|法律/.test(s)) return THEMES.law;
  if (/311|333|教育/.test(s)) return THEMES.education;
  if (/312|心理/.test(s)) return THEMES.psych;
  if (/396|199|经综|管综|经济|管理/.test(s)) return THEMES.economy;
  if (/313|历史/.test(s)) return THEMES.history;
  if (/农学|414/.test(s)) return THEMES.agri;
  if (/政治|腿姐|肖秀荣|徐涛/.test(s) || input.categorySlug === "politics") return THEMES.politics;
  if (/英语|英一|英二|日语|黄皮书|红宝书|词汇|翻译|阅读|作文|田静|唐迟|刘晓燕/.test(s) || input.categorySlug === "english")
    return THEMES.english;
  if (/数学|数一|数二|数三|张宇|汤家凤|周洋鑫/.test(s) || input.categorySlug === "math") return THEMES.math;
  if (input.categorySlug === "school" || /复试|择校|院校|电子书|热更|真题汇总|答题卡/.test(s))
    return THEMES.school;
  if (input.categorySlug === "major") return THEMES.cs;
  return THEMES.general;
}

/** 封面主标题：优先短科目名，否则截断商品标题 */
export function coverHeadline(title: string, subject?: string | null) {
  const sub = (subject || "").trim();
  if (sub && sub.length <= 12 && !/^真题|热更|电子书$/.test(sub)) return sub;
  const t = title.replace(/（.*?）|\(.*?\)/g, "").trim();
  if (t.length <= 14) return t;
  return `${t.slice(0, 13)}…`;
}

export function coverSubline(year?: number | null, categoryName?: string | null) {
  const bits = [year ? String(year) : null, categoryName || null, "研栈"].filter(Boolean);
  return bits.join(" · ");
}
