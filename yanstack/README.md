# 研栈 YanStack · 考研资料售卖平台

可运行的数字资料商城：**浏览 → 加购 → 优惠券结算 → 支付 → 网盘即时发货 → 订单回查 → 管理后台**。

## 横向对比后的选型

| 参考项目 | 借鉴点 | 未直接 fork 原因 |
|---------|--------|------------------|
| **dujiao-next（独角数卡 Next）** | 订单/支付/自动发货/优惠券/游客单 | Go+Vue，本机无 Go；功能过重 |
| **acg-faka（异次元发卡）** | 支付插件化、国内渠道思路 | PHP 栈；二次元 UI 不适配考研 |
| **digital-marketplace** | Next.js 前台、购物车、购买后下载 | 仅 Stripe，国内不可用 |
| **claro** | 受保护内容/多租户思路 | Stripe Connect；过重 |

本仓库在 `yanstack/` 用 **Next.js + Prisma + SQLite** 自建「换壳 + 考研特色」成品，支付预留易支付/支付宝/微信。

## 快速启动

```bash
cd yanstack
npm install
npm run db:setup
npm run dev
```

浏览器打开：http://localhost:3000

### 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | `admin@yanstack.local` | `Admin123456` |
| 学员 | `demo@yanstack.local` | `Demo123456` |

优惠券：`YANSTACK10`（满 20 减 10）、`KAOYAN88`（满 88 减 15）

## 功能清单

- 科目分类（政治/英语/数学/专业课/院校）
- 年份、标签、搜索筛选
- 购物车 + 游客/登录下单
- 优惠券实时预览
- 模拟支付（演示即时发货）
- 易支付聚合（填 EPAY_* 后启用支付宝/微信跳转）
- 支付回调 `/api/pay/notify`
- 订单号取货、交付快照
- 管理后台概览 + 上架资料
- sitemap / robots

## 你需要填写的内容

见根目录 [需要你填写的配置.md](../需要你填写的配置.md)

## 优化记录

见 [OPTIMIZATION_LOG.md](./OPTIMIZATION_LOG.md)（对照多项目迭代 20 轮）
