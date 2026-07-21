# “半句”网站维护交接说明

> 用途：当聊天记录丢失、换新对话或交给其他 AI / 开发者维护时，先读取本文件，再检查仓库当前代码。不要从零重做，也不要用旧版本覆盖现有功能。

## 1. 项目身份

- 网站名称：**半句**
- 首页副标题：**那些没说完、没说出口的话，都留在这里。**
- 内容方向：隐私、心事、生活片段等内容展示
- GitHub 账号：`jiguang121`
- GitHub 仓库：`https://github.com/jiguang121/anhe-map`
- 默认分支：`main`

整站品牌统一使用“半句”，不要再使用：

- 天才俱乐部
- Genius Club
- 半句故事记录

## 2. 线上地址

腾讯云 CloudBase 前台：

`https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/`

腾讯云 CloudBase 后台：

`https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/admin.html`

旧 GitHub Pages 备用前台：

`https://jiguang121.github.io/anhe-map/`

旧 GitHub Pages 备用后台：

`https://jiguang121.github.io/anhe-map/admin.html`

## 3. 腾讯云 CloudBase 信息

- 环境名称：`genius-club`
- 环境 ID：`genius-club-d7gwysylp92a59a86`
- 区域：上海 `ap-shanghai`
- 静态网站应用名称：`genius-club-web`
- 云函数名称：`gc-api`
- 云函数运行环境：Node.js 18

数据库集合：

- `gc_content`
- `gc_usage`
- `gc_submissions`
- `gc_admin_sessions`
- `gc_memberships`
- `gc_orders`

管理员密码由云函数环境变量提供：

`GC_ADMIN_PASSWORD`

**不要在聊天、截图、代码或本文档中索要或记录管理员密码、SecretId、SecretKey、验证码或其他私密凭证。**

## 4. 腾讯云前端部署配置

静态托管连接：

- GitHub 仓库：`https://github.com/jiguang121/anhe-map`
- 分支：`main`
- 目标目录：`./`
- 安装命令：留空
- 构建命令：`npm run build`
- 构建产物目录：`./dist`
- 部署路径：`/`

前端代码更新后，在腾讯云执行：

`CloudBase → 静态网站托管 → genius-club-web → 更新服务 → 确认部署`

部署成功后，前台和后台分别按 `Ctrl + F5` 强制刷新。

仅修改前端文件时，通常**不需要重新部署云函数**。

## 5. 云函数更新方式

只有修改以下文件时，才需要重新部署云函数：

- `cloudfunctions/gc-api/index.js`
- `cloudfunctions/gc-api/package.json`

腾讯云云函数在线编辑器可使用：

```bash
curl -L "https://raw.githubusercontent.com/jiguang121/anhe-map/main/cloudfunctions/gc-api/index.js" -o index.js
```

然后点击：

`保存并安装依赖`

修改云函数后，要确认 HTTP 访问、环境变量和跨域来源仍然有效。

## 6. 当前已经实现的功能

### 前台

- 三个分类入口：隐私、心事、爆料
- 全部文章开放浏览
- 文章列表与详情页
- 评论发布
- 评论发布后直接公开
- 前台刷新后获取云端最新内容

### 后台

- 管理员密码登录
- 修改首页文案
- 修改三个分类名称和说明
- 新建文章
- 选择文章所属分类
- 修改文章标题、正文和展示评论
- 删除文章
- 删除或修改评论
- 导出当前全部内容 JSON
- 批量导入文章 JSON
- 一键载入首批 30 篇内容

### 当前隐藏或预留

- 用户投稿入口隐藏
- 登录功能隐藏
- 会员功能隐藏
- 支付功能隐藏
- 相关代码可保留，但未正式启用

### 当前同步方式

- 后台保存后，内容进入 CloudBase 数据库
- 前台刷新后同步
- 暂时没有 WebSocket 或实时推送
- 已经打开页面的访问者需要刷新才能看到最新修改

## 7. 后台文章操作

少量新增文章：

1. 登录后台
2. 找到“文章与展示评论”
3. 点击“新建文章”
4. 选择隐私、心事或爆料
5. 填写标题和正文
6. 评论可留空，也可每行填写一条
7. 点击“保存文章”

删除文章：

1. 从左侧选择文章
2. 点击“删除文章”
3. 确认删除

修改文章分类：

1. 选择文章
2. 修改分类下拉框
3. 保存文章

## 8. 批量导入格式

后台支持文章数组，或包含 `posts` 数组的 JSON。

示例：

```json
[
  {
    "category": "privacy",
    "title": "文章标题",
    "content": "文章正文",
    "comments": [
      "第一条评论",
      "第二条评论"
    ]
  }
]
```

分类代码：

- `privacy` = 隐私
- `mind` = 心事
- `leak` = 爆料

导入规则：

- 未提供 ID 时自动生成 ID
- 相同 ID 会更新原文章
- 其他已有文章不会删除
- 导入前会弹窗确认

## 9. 主要文件

维护前必须先读取仓库当前版本，以实际代码为准。

- `index.html`：前台页面
- `admin.html`：后台页面
- `styles.css`：前台基础样式
- `admin.css`：后台样式
- `site-data.js`：默认站点配置和默认内容
- `starter-content.js`：首批 30 篇文章
- `app.js`：前台交互逻辑
- `admin.js`：后台管理逻辑
- `gc-api.js`：浏览器与 CloudBase 云函数通信
- `cloudbase-config.js`：浏览器端 CloudBase 公开配置
- `brand-override.js` / 品牌相关脚本：统一前台和后台显示“半句”
- `cloudbase-build.sh`：腾讯云构建脚本
- `package.json`：构建命令配置
- `cloudfunctions/gc-api/index.js`：CloudBase 云函数后端
- `cloudfunctions/gc-api/package.json`：云函数依赖

品牌相关脚本的实际文件名和加载方式，以仓库当前代码为准，不要凭旧记录猜测。

## 10. 品牌要求

整站统一为：

- 浏览器标题：半句
- 首页小字：半句
- 首页主标题：半句
- 分类页标识：半句
- 后台标题：半句后台
- 首页副标题：那些没说完、没说出口的话，都留在这里。

后台“首页设置”保存时，也应将这些信息保存到 CloudBase 数据库，避免只修改静态页面、不修改云端数据。

## 11. 当前仍未完成的事项

- 独立域名尚未购买
- ICP 备案尚未办理
- 当前使用腾讯云默认域名
- 评论实名、举报、审核和内容治理机制尚未完善
- 访问统计尚未正式实现
- 尚未添加正式备案号页脚
- 尚未建立完整的隐私政策、用户协议和举报说明
- 当前评论与后台保存采用整份内容文档读写，高并发时可能发生覆盖
- 当前架构适合早期测试和小规模使用，不应直接宣称已具备大规模高并发能力

## 12. 当前下一阶段目标

目标是把“半句”完善为中国境内可稳定访问、可正式长期使用的网站。

建议顺序：

1. 检查“半句”品牌部署结果
2. 购买适合的独立域名
3. 域名实名认证
4. 个人 ICP 备案
5. 绑定 CloudBase 自定义域名和 HTTPS
6. 增加页脚备案号
7. 增加隐私说明、内容规则和举报入口
8. 再决定评论审核、后台实名或手机号验证方案
9. 增加基础访问统计
10. 流量增长后再拆分数据库结构，解决高并发覆盖问题

## 13. 维护操作原则

1. 优先直接修改 GitHub 仓库，不要让用户手工复制大量代码。
2. 修改前先读取仓库当前文件和最新提交。
3. 不要用旧代码整体覆盖新版本。
4. 不要删除文章、评论、数据库内容或配置，除非用户明确要求。
5. 每次修改完成后明确说明：
   - 是否需要重新部署前端
   - 是否需要重新部署云函数
   - 是否需要登录后台保存设置
6. 没有腾讯云控制台操作权限时，根据用户截图明确说明点哪里。
7. 不索要密码、验证码、SecretId、SecretKey 或私密访问密钥。
8. 浏览器端 Publishable Key 属于公开配置，但仍不要在对话中重复展示。
9. 涉及域名、备案、平台规则和法律合规时，必须重新查询当时的最新官方规则，不要依赖旧结论。
10. 无法确认的信息应明确说明，不要猜测。

## 14. 新对话启动指令

聊天记录丢失后，可向新的 AI 发送：

> 继续维护“半句”网站。GitHub 仓库是 `jiguang121/anhe-map`，默认分支是 `main`。请先读取仓库根目录的 `PROJECT_HANDOFF.md`，再检查当前代码和最新提交，不要从零重做，也不要用旧版本覆盖现有功能。当前目标是继续完成独立域名、ICP 备案和正式上线。
