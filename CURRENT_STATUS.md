# “半句”当前状态（2026-07-21）

本文件记录当前最新状态；若与旧聊天或早期文档冲突，以当前代码和本文件为准。

## 正式地址

- 前台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/
- 后台：https://genius-club-web-genius-club-d7gwysylp92a59a86.webapps.tcloudbase.com/admin.html

## 当前品牌

- 全站名称：半句
- 首页只显示一个“半句”主标题
- 首页副标题：那些没说完、没说出口的话，都留在这里。

## 当前功能

- 隐私、心事、爆料三个分类
- 所有分类页均显示“新增文章”按钮
- 访客新增文章后直接写入 CloudBase 正式内容并立即公开
- 新文章会同步出现在后台文章列表，可由管理员修改或删除
- 评论仍然直接公开（除非后台打开评论审核配置）
- 用户登录、会员和支付仍隐藏/预留

## 本次部署要求

本次同时修改了前端和云函数：

1. 先重新部署 CloudBase 云函数 `gc-api`
2. 再更新静态网站应用 `genius-club-web`
3. 部署后使用 `?v=13` 或 Ctrl+F5 强制刷新测试
