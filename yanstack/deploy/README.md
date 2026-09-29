# 研栈 · 本机对外发布（免费）

用 **Cloudflare 免费隧道** 把本机 3000 端口的站点发布到公网 https 地址，不用买服务器、不用备案、不用公网 IP。

## 怎么用

双击 **`一键启动.bat`**，等 1–2 分钟，屏幕上会打印：

```
研栈已对外开放，把下面这个网址发给别人即可访问：
  https://xxxx.trycloudflare.com
  后台：   https://xxxx.trycloudflare.com/admin
  支付回调：https://xxxx.trycloudflare.com/api/pay/notify
```

首次运行会先做一次生产构建（约几分钟），之后直接复用。

脚本会弹出两个最小化窗口：**站点** 和 **隧道**。这两个窗口不能关，关了网站就下线；最小化到任务栏即可。

## 三条硬规则

1. **电脑要一直开着、连着网。** 关机 / 断网 / 睡眠 = 网站下线。
2. **网址每次重启都会变。** 免费隧道地址是随机的，重启脚本后请把新地址发给用户；要用固定网址请买域名（¥10–20/年）后告诉我改造。
3. **桌面上会出现这个必要文件**：上级目录的 `.tunnel-url`，存放当前外网地址，别删。支付回调地址就是读它的。

## 常见问题

**Q：构建时报 `EPERM: rename query_engine-windows.dll.node`**
A：本机端口 3000 上已经有一个 `npm run dev` 在跑，它锁住了 Prisma 引擎文件。把那个开发服务器窗口关掉，再双击一键启动即可。

**Q：能真的收钱吗？**
A：现在不能。`.env` 里 `PAYMENT_DEFAULT_CHANNEL=MOCK`、`ALLOW_MOCK_PAY=true`，是模拟支付（下单直接发货）。要收真钱需要填 `EPAY_*`（易支付聚合，最快），并把 `ALLOW_MOCK_PAY` 改成 `false`。

**Q：别人访问慢怎么办？**
A：Cloudflare 免费隧道在国内属跨境链路，速度看运营商运气。正式卖货建议上国内轻量服务器 + 备案，或 Oracle 免费 ARM。可以先用本机这套跑通流程和收款，再迁移，数据不用改。

## 上线前必须改的两项

编辑 `yanstack/.env`：

| 项 | 现在 | 应改成 |
|----|------|--------|
| `AUTH_SECRET` | `yanstack-dev-secret-change-me...` | 至少 32 位随机串（务必改，等于登录系统钥匙） |
| `ADMIN_PASSWORD` | `Admin123456` | 强密码 |

改完后回到本项目根目录，先关掉 dev 窗口，再双击一键启动（会重新构建并生效）。

## 数据安全

订单数据在 `yanstack/prisma/dev.db`（SQLite 单文件）。定期把这个文件复制一份就是完整备份。
