# 天才俱乐部 V3：Supabase 数据库配置步骤

当前代码已经支持两种模式：

- 没填 Supabase 配置：自动使用本地演示数据，不影响现有网站打开。
- 填了 Supabase 配置：前台和后台都会读写云数据库，后台修改后所有访问者同步看到。

## 1. 创建 Supabase 项目

打开 Supabase，创建一个新项目。

创建完成后，进入项目控制台。

## 2. 运行数据库脚本

进入：

```txt
SQL Editor -> New query
```

把仓库里的 `supabase-schema.sql` 全部复制进去，然后点击 Run。

这一步会创建：

```txt
gc_settings
gc_categories
gc_posts
gc_comments
gc_admins
```

并写入默认首页、分类、文章和评论。

## 3. 创建管理员账号

进入 Supabase：

```txt
Authentication -> Users -> Add user
```

创建一个管理员邮箱和密码。

创建后，复制这个用户的 User UID。

## 4. 把账号加入管理员表

再次进入：

```txt
SQL Editor -> New query
```

运行：

```sql
insert into public.gc_admins (user_id)
values ('这里替换成你的 User UID');
```

## 5. 填写网站配置

打开仓库文件：

```txt
supabase-config.js
```

把里面改成：

```js
window.GC_SUPABASE_CONFIG = {
  url: '你的 Project URL',
  anonKey: '你的 anon public key'
};
```

注意：只能填 anon/public key，不要填 service_role key。

Project URL 和 anon key 在 Supabase：

```txt
Project Settings -> API
```

## 6. 等 GitHub Pages 自动更新

保存提交后，等待 1～3 分钟，刷新网站。

前台：

```txt
https://jiguang121.github.io/anhe-map/
```

后台：

```txt
https://jiguang121.github.io/anhe-map/admin.html
```

后台登录时，用你在 Supabase Authentication 里创建的管理员邮箱和密码。

## 7. 验证是否成功

在后台改一篇文章标题，保存。

然后换一个浏览器、手机或无痕窗口打开前台。

如果能看到修改后的标题，就说明已经变成真正的云数据库网站。
