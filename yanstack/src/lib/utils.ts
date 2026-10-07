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

function isQuarkLink(link: NetdiskLink) {
  const name = (link.name || "").toLowerCase();
  const url = (link.url || "").toLowerCase();
  return name.includes("夸克") || name.includes("quark") || url.includes("quark.cn") || url.includes("pan.quark");
}

/** 只保留夸克网盘（兼容旧三网盘 / 单链接数据） */
export function onlyQuarkLinks(links: NetdiskLink[]): NetdiskLink[] {
  const quark = links.filter(isQuarkLink);
  if (quark.length > 0) {
    return quark.map((l) => ({ ...l, name: l.name?.includes("夸克") ? l.name : "夸克网盘" }));
  }
  // 旧数据没有夸克时：若只剩一条有效链接，仍当作夸克展示，避免领取失败
  const usable = links.filter((l) => l.url && l.url !== "#");
  if (usable.length === 1) {
    return [{ ...usable[0], name: "夸克网盘" }];
  }
  return [];
}

/** 统一解析网盘选项（前台仅展示夸克） */
export function parseDelivery(raw: string): DeliveryData {
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data?.links) && data.links.length > 0) {
      const links = data.links.map((l: NetdiskLink) => ({
        name: String(l.name || "网盘"),
        url: String(l.url || "#"),
        code: l.code ? String(l.code) : undefined,
        note: l.note ? String(l.note) : undefined,
      }));
      return {
        links: onlyQuarkLinks(links),
        note: data.note ? String(data.note) : undefined,
      };
    }
    // 旧格式：单链接 → 视为夸克
    if (data?.url) {
      return {
        links: [
          {
            name: "夸克网盘",
            url: String(data.url),
            code: data.code ? String(data.code) : undefined,
          },
        ],
        note: data.note ? String(data.note) : undefined,
      };
    }
  } catch {
    /* fallthrough */
  }
  return { links: [], note: raw };
}

/** 后台编辑器默认：仅夸克 */
export function defaultQuarkLink(): NetdiskLink {
  return { name: "夸克网盘", url: "https://pan.quark.cn/s/demo", code: "" };
}

/** @deprecated 使用 defaultQuarkLink */
export function defaultThreeLinks(): NetdiskLink[] {
  return [defaultQuarkLink()];
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** 去掉详情里的「来源路径：...」行（导入脚本曾写入，前台不展示） */
export function stripSourcePath(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => !/^\s*来源路径\s*[:：]/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
