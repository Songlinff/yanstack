/** 2027 考研初试：教育部公布为 2026-12-19 至 20 日（以官方为准） */
export const KAOYAN_EXAM_LABEL = "2027考研初试";
export const KAOYAN_EXAM_DATE = new Date(2026, 11, 19, 0, 0, 0, 0); // 本地时区 12/19

const QUOTES = [
  "那些看似不起波澜的日复一日，终会让你看见坚持的意义。",
  "不必追问未来是否明亮，先把今天的题做完。",
  "熬过无人问津的日子，才配得上诗和远方。",
  "你现在的付出，是在给明年的自己写信。",
  "慢一点没关系，别停下来。",
  "书桌前的你，正在改写命运的草稿。",
  "把焦虑换成一页笔记，把恐惧换成一道真题。",
  "上岸不是运气，是无数个清晨与深夜的复利。",
  "今天多懂一点，明天就少慌一点。",
  "别人熬夜刷剧，你熬夜刷题——差距从这里拉开。",
  "允许自己累，但别允许自己放弃。",
  "再坚持一小时，你就比昨天的自己更接近目标。",
  "考研这场长跑，赢的是稳，不是冲。",
  "你不需要永远状态拉满，只需要每天前进一点点。",
  "把「我不行」换成「我再试一次」。",
  "暗夜里亮着的台灯，终会照见录取通知书。",
  "成绩不会辜负真正下过的功夫。",
  "比起完美计划，更重要的是今天坐下来。",
  "你正在做一件很酷的事：用努力选择人生。",
  "坚持到不想坚持的时候，才叫坚持。",
  "一页页翻过去，就是通往考场的路。",
  "别怕走得慢，怕的是站在原地自我怀疑。",
  "你配得上更好的学校，也配得上今天的认真。",
  "把分心留给以后，把专注留给这一页。",
  "此刻的沉默学习，是未来最响亮的回答。",
  "你不是一个人在战斗，同路人就在这盏灯下。",
  "困难是筛子，筛掉半途而废，留下坚定的人。",
  "今天的汗水，是写给录取季最诚实的简历。",
  "先完成，再完美；先行动，再优化。",
  "愿你在倒数的日子里，仍然温柔且坚定。",
  "每一次重做错题，都是在给自己加分。",
];

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 距离初试剩余整天数；已过则为 0 */
export function getKaoyanDaysLeft(now = new Date()) {
  const today = startOfLocalDay(now).getTime();
  const exam = startOfLocalDay(KAOYAN_EXAM_DATE).getTime();
  const diff = Math.ceil((exam - today) / 86_400_000);
  return Math.max(0, diff);
}

/** 按日期稳定取一句，每天换一句 */
export function getDailyQuote(now = new Date()) {
  const day = startOfLocalDay(now);
  const key =
    day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();
  return QUOTES[key % QUOTES.length];
}

export function getKaoyanCountdown(now = new Date()) {
  const daysLeft = getKaoyanDaysLeft(now);
  return {
    daysLeft,
    label: KAOYAN_EXAM_LABEL,
    examDateText: "2026年12月19日–20日",
    quote: getDailyQuote(now),
    ended: daysLeft <= 0,
  };
}
