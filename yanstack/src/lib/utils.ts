export function formatCNY(cents: number) {
  if (!cents || cents <= 0) return "免费";
  return `¥${(cents / 100).toFixed(2)}`;
}

export function parseSchoolTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export type NetdiskLink = {
  name: string;
  url: string;
  code?: string;
  note?: string;
};

export type DeliveryData = {
  links: NetdiskLink[];
  note?: string;
};

/** 统一解析为三个网盘选项（兼容旧单链接格式） */
export function parseDelivery(raw: string): DeliveryData {
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data?.links) && data.links.length > 0) {
      return {
        links: data.links.map((l: NetdiskLink) => ({
          name: String(l.name || "网盘"),
          url: String(l.url || "#"),
          code: l.code ? String(l.code) : undefined,
          note: l.note ? String(l.note) : undefined,
        })),
        note: data.note ? String(data.note) : undefined,
      };
    }
    // 旧格式：单链接 → 补齐为三项（后两项可编辑时替换）
    if (data?.url) {
      const primary: NetdiskLink = {
        name: String(data.netdisk || "百度网盘"),
        url: String(data.url),
        code: data.code ? String(data.code) : undefined,
      };
      return {
        links: [
          primary,
          { name: "阿里云盘", url: String(data.url), code: data.code ? String(data.code) : undefined },
          { name: "夸克网盘", url: String(data.url), code: data.code ? String(data.code) : undefined },
        ],
        note: data.note ? String(data.note) : undefined,
      };
    }
  } catch {
    /* fallthrough */
  }
  return { links: [], note: raw };
}

export function defaultThreeLinks(): NetdiskLink[] {
  return [
    { name: "百度网盘", url: "https://pan.baidu.com/s/demo", code: "yz01" },
    { name: "阿里云盘", url: "https://www.alipan.com/s/demo", code: "yz02" },
    { name: "夸克网盘", url: "https://pan.quark.cn/s/demo", code: "yz03" },
  ];
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
