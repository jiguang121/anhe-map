# 半句

“半句”是一个面向移动端的 H5 匿名内容网站，内容分类包括隐私、心事和爆料。

首页副标题：

> 那些没说完、没说出口的话，都留在这里。

## 当前生产架构

- GitHub 仓库：`jiguang121/anhe-map`
- 默认分支：`main`
- 腾讯云 CloudBase 环境：`genius-club-d7gwysylp92a59a86`
- 区域：`ap-shanghai`
- 静态应用：`genius-club-web`
- 云函数：`gc-api`
- 前台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/
- 后台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/admin.html

本项目已经迁移到腾讯云 CloudBase，不再使用旧 Supabase 架构。

## 当前功能

- 隐私、心事、爆料三个分类
- 全部文章开放浏览
- 访客直接新增文章并发布到 CloudBase
- 匿名评论
- CloudBase 管理后台
- 首页与分类文案管理
- 文章新建、修改、分类和删除
- 评论编辑和删除
- 全量 JSON 导出
- 批量文章 JSON 导入
- 首批 30 篇内容载入
- 会员、每日浏览记录和订单数据结构预留

## 构建

```bash
npm run build
```

构建脚本会生成 `dist` 目录，CloudBase 静态应用部署该目录。

## 主要文件

```text
index.html                         前台页面
admin.html                         后台页面
styles.css                         前台样式
admin.css                          后台样式
site-data.js                       默认站点数据
starter-content.js                 首批 30 篇内容
app.js                             前台交互
gc-api.js                          浏览器与云函数通信
admin.js                           后台管理
cloudbase-config.js                CloudBase 浏览器公开配置
brand-migration.js                 旧品牌迁移
cloudbase-build.sh                 CloudBase 构建脚本
package.json                       构建命令
cloudfunctions/gc-api/index.js     CloudBase 云函数
cloudfunctions/gc-api/package.json 云函数依赖
CURRENT_STATUS.md                  当前生产状态
MAINTENANCE_HANDOFF.md             永久维护交接说明
```

## 维护入口

继续维护前必须先读取：

1. `MAINTENANCE_HANDOFF.md`
2. `CURRENT_STATUS.md`
3. 最近 GitHub 提交
4. 本次准备修改的当前文件

不要根据旧聊天记录或早期 Supabase 文档从零重建。

## 部署原则

- 仅修改前端文件：更新 CloudBase 静态应用 `genius-club-web`。
- 修改 `cloudfunctions/gc-api/index.js` 或云函数 `package.json`：先重新部署 `gc-api`，再更新静态应用。
- 不得在仓库或聊天中存放管理员密码、SecretId、SecretKey 或验证码。
- 不得在未明确授权时重置或删除 CloudBase 正式数据。
