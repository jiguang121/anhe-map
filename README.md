# 天才俱乐部 Genius Club

这是一个 H5 V3 项目，用于验证“隐私 / 心事 / 爆料”的匿名内容浏览、评论、会员墙和后台内容管理体验。

## 当前状态

项目已经支持两种运行模式：

1. 本地演示模式：不配置 Supabase 时，数据保存在当前浏览器 localStorage。
2. 云数据库模式：配置 Supabase 后，前台和后台读写同一个云数据库，后台修改后所有访问者同步看到。

## 已实现功能

- 首页三个漂浮入口：隐私、心事、爆料
- 分类内容流
- 匿名发布内容
- 查看详情
- 匿名评论
- 游客浏览指定条数后触发会员墙
- 演示会员入口
- 独立后台页：admin.html
- 后台可管理首页文案、入口名称、入口小字、文章、评论、会员墙文案、免费浏览条数
- 支持 Supabase 云数据库
- 支持 Supabase Auth 管理员登录
- 未配置数据库时自动回退本地演示模式

## 页面入口

前台：

```txt
/index.html
```

后台：

```txt
/admin.html
```

线上地址：

```txt
https://jiguang121.github.io/anhe-map/
```

## 文件说明

```txt
index.html           前台页面
admin.html           后台管理页面
styles.css           前台基础样式
admin.css            后台样式
site-data.js         默认内容配置
supabase-config.js   Supabase 项目配置
supabase-schema.sql  Supabase 数据库表结构和初始化内容
gc-api.js            数据读写层，自动判断云端或本地
app.js               前台交互逻辑
admin.js             后台管理逻辑
SUPABASE_SETUP.md    Supabase 配置教程
README.md            项目说明
```

## 变成真正网站的关键步骤

查看：

```txt
SUPABASE_SETUP.md
```

完成 Supabase 配置后，这个网站才会从“本地演示后台”变成“真正后台同步网站”。
