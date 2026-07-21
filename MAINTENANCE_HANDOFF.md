# “半句”网站维护交接说明

> 用途：聊天记录丢失、换新对话或换维护人员时，先读取本文件和当前代码，即可恢复项目上下文并继续修改。
>
> 判断优先级：`main` 分支当前代码 > `CURRENT_STATUS.md` > 本文件 > 旧聊天记录。`README.md`、旧部署说明或旧聊天若与当前代码冲突，以当前代码为准。

## 一、可直接复制给新对话的恢复提示词

```text
继续维护“半句”网站，不要从零重做，也不要根据旧聊天记录猜测项目状态。

请先连接并检查 GitHub 仓库 jiguang121/anhe-map 的 main 分支，至少读取：
CURRENT_STATUS.md
MAINTENANCE_HANDOFF.md
package.json
cloudbase-build.sh
cloudbase-config.js
index.html
admin.html
app.js
admin.js
gc-api.js
site-data.js
starter-content.js
cloudfunctions/gc-api/index.js
cloudfunctions/gc-api/package.json

先查看最近提交记录，再根据当前代码确认真实功能。旧 README、旧 Supabase 文件和旧聊天记录可能已经过时，不得直接作为当前状态依据。

项目关键信息：
- 网站名称：半句
- 定位：隐私、心事、生活片段与爆料类匿名内容 H5 网站
- 首页副标题：那些没说完、没说出口的话，都留在这里。
- GitHub 仓库：https://github.com/jiguang121/anhe-map
- 默认分支：main
- CloudBase 环境 ID：genius-club-d7gwysylp92a59a86
- 区域：上海 ap-shanghai
- 静态应用名称：genius-club-web
- 云函数名称：gc-api
- 前台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/
- 后台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/admin.html

当前已实现：
1. 前台“隐私、心事、爆料”三个分类。
2. 当前全部文章免费浏览，无登录和每日次数限制。
3. 各分类页面可新增文章；访客发布后直接写入 CloudBase 正式内容并公开。
4. 前台评论可以直接公开发布；后台可修改或删除展示评论。
5. 后台可修改首页文案、分类名称和副标题。
6. 后台可新建、修改、分类和删除文章。
7. 后台可导出全部内容 JSON、批量导入文章 JSON、一键载入首批 30 篇内容。
8. 后台保存后，前台刷新即可同步；暂未实现实时推送。
9. 管理员登录由云函数环境变量 GC_ADMIN_PASSWORD 控制。
10. 会员、订单、每日浏览记录等后端结构已预留，但前台登录、会员和支付目前隐藏且未正式启用。

当前尚未完成：
1. 独立域名和 ICP 备案。
2. 正式支付、会员开通、续费、退款和订单管理。
3. 完整举报、审核、敏感词、反滥用与内容治理。
4. 正式访问统计和运营数据面板。
5. 备案号与正式合规页脚。
6. 当前内容采用整份 gc_content 文档读写，高并发可能覆盖，不适合大规模流量。
7. 评论和用户发布机制仍需在正式推广前加强安全与合规。

操作规则：
1. 修改前先读取当前文件和最近提交，不能用旧代码覆盖新功能。
2. 优先直接修改 GitHub 仓库，不要让我复制粘贴大量代码。
3. 不得索要、展示或写入管理员密码、SecretId、SecretKey、验证码或私密访问密钥。
4. 不得删除已有文章、评论或 CloudBase 数据，除非我明确要求。
5. 每次修改完成后必须明确说明：
   - 修改了哪些文件；
   - 是否需要更新 CloudBase 静态应用；
   - 是否需要重新部署 gc-api 云函数；
   - 是否需要登录后台保存设置；
   - 如何刷新和验证结果。
6. 仅修改前端文件时，通常只更新静态应用 genius-club-web。
7. 修改 cloudfunctions/gc-api/index.js 或 package.json 时，必须重新部署 gc-api 云函数，再更新前端。
8. 腾讯云无法直接操作时，根据我发的后台截图逐步告诉我点击位置。
9. 当前目标是继续完善已经上线的“半句”，不是重新设计或重建网站。

开始时先给出：
- 当前 main 分支最新提交；
- 当前架构和线上状态；
- 本次需求涉及前端、云函数还是数据库；
- 接下来准备直接修改哪些文件。
确认后直接执行修改。
```

## 二、正式项目身份

- 网站名称：半句
- 页面形式：移动端优先的 H5 网站，电脑浏览器兼容
- 内容方向：隐私、心事、生活片段、匿名表达与爆料
- 首页副标题：那些没说完、没说出口的话，都留在这里。
- GitHub：`jiguang121/anhe-map`
- 默认分支：`main`

## 三、线上与 CloudBase

- CloudBase 环境名称：`genius-club`
- 环境 ID：`genius-club-d7gwysylp92a59a86`
- 区域：`ap-shanghai`
- 静态应用：`genius-club-web`
- 云函数：`gc-api`
- 云函数运行环境：Node.js 18
- 前台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/
- 后台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/admin.html
- GitHub Pages 仅为旧备用地址，不作为正式生产地址。

## 四、数据库集合

- `gc_content`：整站内容与配置
- `gc_usage`：每日阅读记录预留
- `gc_submissions`：投稿和评论记录
- `gc_admin_sessions`：后台会话
- `gc_memberships`：会员预留
- `gc_orders`：订单预留

管理员密码通过云函数环境变量 `GC_ADMIN_PASSWORD` 设置。不要把真实密码、SecretId、SecretKey、验证码或私密密钥写入仓库、聊天或截图。

## 五、当前真实功能

- 三个分类：隐私、心事、爆料。
- 当前全部内容开放浏览，无登录和次数限制。
- 分类页显示“新增文章”，访客文章直接发布到 CloudBase 正式内容。
- 新文章在前台刷新后显示，并同步进入后台文章列表。
- 评论默认直接公开；后台可编辑或删除评论。
- 后台可编辑首页、分类、文章和评论。
- 后台支持 JSON 导出、批量导入和首批 30 篇内容载入。
- 后台使用 CloudBase 云函数密码登录。
- 登录、会员和支付界面目前隐藏或仅保留占位；支付尚未接入。
- 当前没有实时推送，已打开页面需要刷新才能看到云端更新。

## 六、构建与部署

CloudBase 静态应用配置：

- 仓库：`https://github.com/jiguang121/anhe-map`
- 分支：`main`
- 安装命令：留空
- 构建命令：`npm run build`
- 构建产物：`./dist`
- 部署路径：`/`

`npm run build` 调用 `cloudbase-build.sh`，将正式前端文件复制到 `dist`。

前端文件修改后：

1. CloudBase → 静态网站托管 → `genius-club-web`。
2. 点击更新服务并确认部署。
3. 前台和后台使用 Ctrl+F5 或添加版本参数强制刷新。

只有修改以下文件时才需要重新部署云函数：

- `cloudfunctions/gc-api/index.js`
- `cloudfunctions/gc-api/package.json`

云函数更新后，应先部署 `gc-api`，再更新静态应用。

## 七、主要文件

- `index.html`：前台页面
- `admin.html`：后台页面
- `styles.css`：前台样式
- `admin.css`：后台样式
- `app.js`：前台交互
- `admin.js`：后台交互、文章管理和 JSON 导入导出
- `gc-api.js`：浏览器与 CloudBase 云函数通信
- `cloudbase-config.js`：浏览器端公开 CloudBase 配置
- `site-data.js`：默认数据和配置
- `starter-content.js`：首批 30 篇内容
- `brand-migration.js`：旧品牌数据迁移
- `cloudbase-build.sh`：构建脚本
- `package.json`：构建命令
- `cloudfunctions/gc-api/index.js`：CloudBase 后端逻辑
- `CURRENT_STATUS.md`：当前生产状态摘要
- `MAINTENANCE_HANDOFF.md`：永久维护交接说明

## 八、品牌要求

全站统一使用“半句”。不要恢复或新增以下旧名称：

- 天才俱乐部
- Genius Club
- 半句故事记录

品牌展示：

- 浏览器标题：半句
- 首页主标题：半句
- 信息流标识：半句
- 后台标题：半句后台
- 首页副标题：那些没说完、没说出口的话，都留在这里。

## 九、上线前仍需完善

- 独立域名与 ICP 备案
- 用户协议、隐私政策、内容规范和备案页脚
- 举报、审核、敏感词、限频和封禁机制
- 访问统计和运营面板
- 正式会员与支付
- 拆分内容存储，避免整份文档并发覆盖
- 高并发、容灾、备份和恢复验证

## 十、维护原则

1. 当前代码是唯一可靠实现依据。
2. 不使用旧 Supabase 架构，不从零重建。
3. 修改前检查最近提交和目标文件。
4. 尽量直接提交 GitHub。
5. 保护云端已有内容，禁止无授权重置数据库。
6. 每次维护后同步更新 `CURRENT_STATUS.md`；架构、部署或核心功能变化时，同时更新本文件。
