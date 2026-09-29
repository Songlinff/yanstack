# 研栈迭代优化日志（第 2 轮 · 再 20 次）

对照：dujiao-next / acg-faka / digital-marketplace / claro + 自测问题清单。

| 轮次 | 评估发现的问题 | 改进 |
|------|----------------|------|
| 1 | 下单即扣优惠券次数，未付款浪费名额 | 改为支付成功后再 `usedCount++` |
| 2 | 任意人凭订单号可见网盘链接 | 交付信息需登录本人 / 邮箱解锁 / 管理员 |
| 3 | 模拟支付可在任意状态被刷 | 仅 PENDING；生产默认禁用（`ALLOW_MOCK_PAY`） |
| 4 | 待支付订单无法取消 | 增加取消订单 API + 按钮 |
| 5 | 库存校验只看 stock===0 | 数量上限与超卖校验；支付时二次读库存 |
| 6 | 加购/结算无反馈 | Toast 提示系统 |
| 7 | 无加载/错误/404 页 | `loading` / `error` / `not-found` |
| 8 | 导航用 subject=英语 匹配不到「英语一」 | 改为 category slug 筛选 |
| 9 | 列表无排序与筛选态 | 排序、筛选芯片、空态引导 |
| 10 | 单号/提取码难复制 | CopyButton |
| 11 | 后台只能新建不能编辑/上下架 | 商品列表、编辑页、上下架切换 |
| 12 | 优惠券只能 seed | `/admin/coupons` 增改启停 |
| 13 | 后台无法手动发货/取消 | AdminOrderActions |
| 14 | 后台统计过粗 | 待支付数、今日成交额/单量 |
| 15 | 结算可连点重复下单 | submitting ref 防抖 + Toast |
| 16 | 键盘可达性弱 | skip link、focus-visible、aria-label |
| 17 | sitemap/robots 手写路由不规范 | 改用 `sitemap.ts` / `robots.ts` |
| 18 | Hero 塞入公告破坏首屏预算 | 公告移出 hero 独立条 |
| 19 | 真实支付中断无法续付 | ResumePayButton + `/api/orders/pay` |
| 20 | 状态英文裸露、渠道难读 | StatusBadge + 中文支付渠道文案 |

历史第 1 轮 20 项见文件前半（初建阶段）；本表为全面优化迭代。
