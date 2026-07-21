# “半句”当前生产状态（2026-07-21）

本文件只记录当前生产状态。若与旧聊天、旧 README 或早期部署说明冲突，以 `main` 分支当前代码和 `MAINTENANCE_HANDOFF.md` 为准。

## 正式地址

- 前台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/
- 后台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/admin.html

## 基础设施

- GitHub：`jiguang121/anhe-map`
- 分支：`main`
- CloudBase 环境：`genius-club-d7gwysylp92a59a86`
- 区域：`ap-shanghai`
- 静态应用：`genius-club-web`
- 云函数：`gc-api`
- 正式数据库集合：`gc_content`、`gc_usage`、`gc_submissions`、`gc_admin_sessions`、`gc_memberships`、`gc_orders`

## 当前品牌

- 全站名称：半句
- 首页主标题：半句
- 首页副标题：那些没说完、没说出口的话，都留在这里。
- 不再使用“天才俱乐部”“Genius Club”“半句故事记录”。

## 当前已实现

- 隐私、心事、爆料三个分类。
- 当前全部文章免费浏览，无登录和每日次数限制。
- 所有分类页均显示“新增文章”。
- 访客文章直接写入 CloudBase 正式内容并立即公开。
- 新文章同步进入后台，可由管理员修改、分类或删除。
- 评论默认直接公开，后台可修改或删除展示评论。
- 后台可修改首页文案、分类名称和分类副标题。
- 后台支持 JSON 导出、批量导入和首批 30 篇内容载入。
- 后台由云函数环境变量 `GC_ADMIN_PASSWORD` 控制登录。
- 会员、每日浏览记录和订单数据结构已预留，但登录、会员和支付尚未正式启用。
- 当前没有实时推送，已打开页面需要刷新后读取最新内容。

## 当前尚未完成

- 独立域名和 ICP 备案。
- 正式会员、支付、续费、退款和订单管理。
- 完整举报、审核、敏感词、限频与内容治理。
- 正式访问统计和运营面板。
- 备案号与完整合规页脚。
- `gc_content` 当前采用整份内容文档读写，高并发可能发生覆盖。
- 大规模推广前的并发、容灾、备份与恢复验证。

## 部署规则

前端代码修改后：

1. CloudBase → 静态网站托管 → `genius-club-web`。
2. 点击“更新服务”并确认部署。
3. 前台和后台使用 Ctrl+F5 或版本参数强制刷新。

只有修改以下文件时才需要重新部署云函数：

- `cloudfunctions/gc-api/index.js`
- `cloudfunctions/gc-api/package.json`

云函数有修改时：先重新部署 `gc-api`，再更新静态应用。

## 永久恢复入口

聊天记录中断或换新对话时，直接读取：

- `MAINTENANCE_HANDOFF.md`
- `CURRENT_STATUS.md`
- 最近 GitHub 提交
- 当前目标文件

不要从零重做，也不要按照旧 Supabase 阶段继续判断。
