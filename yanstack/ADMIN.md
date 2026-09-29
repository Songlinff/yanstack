# 研栈后台管理系统

独立侧栏后台（`/admin`），前台页头页脚自动隐藏。

## 横向对比来源

| 项目 | 借鉴 |
|------|------|
| **dujiao-next Admin** | 商品/分类/订单/优惠券/支付渠道/手动交付 |
| **LDC Shop Admin** | 仪表盘今日/本周统计、库存预警、用户拉黑、数据导出 |
| **Ant Design Pro / next-admin** | 侧栏布局、模块化菜单、表格列表、顶栏 |
| **acg-faka** | 支付插件就绪状态视图 |

## 模块

| 路径 | 功能 |
|------|------|
| `/admin` | 仪表盘：今日/7日/累计成交、待支付、热销、库存预警 |
| `/admin/products` | 商品搜索、上下架、编辑 |
| `/admin/categories` | 科目分类 CRUD、启停 |
| `/admin/orders` | 订单筛选/搜索/手动发货/取消 |
| `/admin/orders/[orderNo]` | 订单详情、编辑交付、标记退款 |
| `/admin/coupons` | 优惠券 |
| `/admin/users` | 用户搜索、拉黑 |
| `/admin/payments` | 支付渠道就绪状态 |
| `/admin/export` | 订单/商品/优惠券 JSON 导出 |
| `/admin/settings` | 公告、客服微信/邮箱 |

## 登录

`admin@yanstack.local` / `Admin123456`

## 20 轮后台优化

见 `ADMIN_OPTIMIZATION_LOG.md`
