# 天才俱乐部 V4 CloudBase 部署清单

环境 ID：`genius-club-d7gwysylp92a59a86`

## 一、创建文档型数据库集合

进入：CloudBase 控制台 → 文档型数据库 → 新建集合。

依次创建以下 6 个集合：

```text
gc_content
gc_usage
gc_submissions
gc_admin_sessions
gc_memberships
gc_orders
```

每个集合的客户端权限都选择“无权限”。前台不直接读写数据库，所有数据均通过 `gc-api` 云函数处理。

## 二、创建云函数

进入：云函数 / 托管 → 新建云函数。

配置：

```text
函数名称：gc-api
类型：普通云函数
运行环境：Node.js 18
创建方式：空白函数或本地 ZIP 上传
```

函数代码位于：

```text
cloudfunctions/gc-api/index.js
cloudfunctions/gc-api/package.json
```

如果使用在线编辑：

1. 将 `index.js` 内容替换为仓库中的对应文件。
2. 将 `package.json` 内容替换为仓库中的对应文件。
3. 点击“保存并安装依赖”。

## 三、设置管理员密码

在 `gc-api` 云函数详情中找到：配置 → 环境变量。

新增：

```text
变量名：GC_ADMIN_PASSWORD
变量值：自行设置一个高强度后台密码
```

不要把这个密码写入 GitHub，也不要发送给任何人。

保存配置后重新部署函数。

## 四、函数调用权限

客户端使用 Publishable Key 调用 `gc-api`。如果调用时提示无权限，请在云函数权限/OPA 策略中允许 Publishable Key 对 `gc-api` 执行调用，但不要开放数据库客户端直连权限。

## 五、初始化云端内容

1. 打开 `/admin.html`。
2. 输入 `GC_ADMIN_PASSWORD` 对应的密码登录。
3. 点击一次“保存基础设置”。

第一次保存会把当前首页、分类和示例文章写入 `gc_content/main`，之后所有访问者读取同一份云端内容。

## 六、当前收费逻辑

```text
每日免费完整阅读：5 条
重复打开同一条：不重复扣次数
北京时间零点：进入新的每日额度
会员支付：暂时关闭
投稿和评论：进入 gc_submissions，状态为 pending
```

已预留：

```text
gc_memberships  会员资格
gc_orders       订单
gc_usage        每日阅读记录
```

后续接支付时无需重做数据结构。
