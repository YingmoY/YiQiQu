# 一起去 H5 项目功能增强说明

本次交付基于原始压缩包中的前端与 Go 后端代码完成增强改造，并在增量版本中继续补齐了**活动评价**、**敏感词过滤/管理**以及多卡片页面切换空白问题修复。交付压缩包包含 `front`、`back` 两个源码目录，以及数据库变更脚本 `modify.sql` 和本说明文件。

## 一、交付目录

| 路径 | 内容说明 |
|---|---|
| `front/` | H5 前端源码，基于 React、Vite、TypeScript、TailwindCSS，包含 `/admin` 独立管理后台页面。 |
| `back/` | Go 后端源码，已将原先集中式后端拆分为多个标准文件，包含路由、中间件、模型、业务处理器、推荐算法与敏感词服务。 |
| `modify.sql` | PostgreSQL 数据库变更脚本，新增用户资料字段、黑名单、MBTI 测试结果、智能邀请记录、活动评价、敏感词词库与命中日志。 |
| `readme.md` | 本项目说明文档。 |

## 二、新增与调整功能

### 1. 用户功能

用户功能已新增并接入真实后端接口，包括**个人资料编辑**、**用户标签**、**“我的”页面**、**黑名单管理**和 **MBTI 手动录入/在线测试**。用户可在“我的”页面编辑昵称、头像色、学校、专业、简介、兴趣标签、MBTI、社交能量，并可在聊天中拉黑用户后于黑名单面板解除拉黑。

| 功能 | 前端入口 | 后端接口 |
|---|---|---|
| 查看个人资料 | `/profile` | `GET /api/v1/users/profile` |
| 编辑个人资料 | `/profile` | `PUT /api/v1/users/profile` |
| MBTI 在线测试 | `/profile` 的 MBTI 面板 | `POST /api/v1/users/mbti-test` |
| 黑名单列表 | `/profile` 的黑名单面板 | `GET /api/v1/users/blacklist` |
| 解除黑名单 | `/profile` 的黑名单面板 | `DELETE /api/v1/users/:id/unblock` |

### 2. 核心功能：邀约广场推荐与智能邀请

邀约广场已改为按算法得分排序返回活动，排序参考了活动状态、开始时间、同校同兴趣匹配、报名热度、发起人信誉、用户标签、MBTI 相似度和黑名单关系等因素。活动卡片展示了推荐分与推荐理由，使用户能感知推荐逻辑。

活动发布成功后，系统会根据当前活动与已有用户数据生成智能邀请候选人。发起人可在活动详情页查看推荐对象、推荐理由、匹配分数，并一键生成邀请文案与邀请记录。同时，“我的”页面新增**我的发起**、**我的报名**和**我的邀请**管理入口。

| 功能 | 前端入口 | 后端接口 |
|---|---|---|
| 推荐排序的邀约广场 | 首页 `/` | `GET /api/v1/activities` |
| 创建活动后推荐邀请对象 | `/create` 发布成功页 | `GET /api/v1/activities/:id/recommended-users` |
| 生成智能邀请 | 创建成功页、活动详情页 | `POST /api/v1/activities/:id/invitations/generate` |
| 我的发起 | `/profile` | `GET /api/v1/me/activities/created` |
| 我的报名 | `/profile` | `GET /api/v1/me/activities/applied` |
| 我的邀请 | `/profile` | `GET /api/v1/me/invitations` |

### 3. 活动评价

活动评价功能已补齐为真实可用的前后端闭环。活动完成后，报名成功的参与者和发起人可进入评价页，对活动中的其他成员提交出勤、准时、评分与文字评价。系统会保存评价记录，避免对同一活动同一对象重复评价，并在提交后同步刷新前端状态。

| 功能 | 前端入口 | 后端接口 |
|---|---|---|
| 活动评价页面 | `/activities/:id/evaluate` | `GET /api/v1/activities/:id` |
| 查询当前用户已评价对象 | 评价页初始化 | `GET /api/v1/activities/:id/reviews/me` |
| 提交活动评价 | 评价页 | `POST /api/v1/activities/:id/reviews` |

### 4. 敏感词过滤与管理

后端新增统一敏感词服务，支持**替换**与**拒绝提交**两种处理动作。活动发布、报名留言、聊天消息、举报原因、个人资料编辑、拉黑原因和活动评价评论均接入统一过滤逻辑。命中敏感词后，系统会记录场景、原文、过滤后文本、命中词与处理动作，便于管理后台追踪。

管理后台新增**敏感词库**模块，可新增、启停、删除敏感词，查看命中日志，并提供文本检测工具。默认词库会在后端首次运行时初始化，也可通过 `modify.sql` 初始化。

| 功能 | 前端入口 | 后端接口 |
|---|---|---|
| 敏感词列表 | `/admin` 的敏感词库标签 | `GET /api/v1/admin/sensitive-words` |
| 新增敏感词 | `/admin` 的敏感词库标签 | `POST /api/v1/admin/sensitive-words` |
| 启用/停用敏感词 | `/admin` 的敏感词库标签 | `PUT /api/v1/admin/sensitive-words/:id` |
| 删除敏感词 | `/admin` 的敏感词库标签 | `DELETE /api/v1/admin/sensitive-words/:id` |
| 文本检测 | `/admin` 的敏感词库标签 | `POST /api/v1/admin/sensitive-words/check` |
| 命中日志 | `/admin` 的敏感词库标签 | `GET /api/v1/admin/sensitive-hits` |

### 5. 聊天功能：拉黑与举报

聊天页新增了安全操作区，可对活动聊天中的具体消息进行举报，也可对指定用户执行拉黑。后端在读取聊天历史和 WebSocket 发送消息时会检查黑名单关系，避免被拉黑用户继续互动。聊天消息和举报原因均已接入敏感词过滤。

| 功能 | 前端入口 | 后端接口 |
|---|---|---|
| 消息举报 | `/chat/:id` 消息卡片 | `POST /api/v1/chat/messages/:id/report` |
| 聊天用户拉黑 | `/chat/:id` 消息卡片 | `POST /api/v1/chat/users/:id/block` |
| 通用举报 | 活动/用户/聊天场景复用 | `POST /api/v1/reports` |

### 6. 独立桌面版管理后台

新增 `/admin` 独立路径的桌面版管理后台。该页面采用宽屏布局，不依赖 H5 底部导航，可查看统计看板，管理用户、活动、举报和敏感词。后端管理接口使用管理员权限中间件保护，仅 `role = admin` 的用户可访问。

| 管理能力 | 前端路径 | 后端接口 |
|---|---|---|
| 统计看板 | `/admin` | `GET /api/v1/admin/stats` |
| 用户管理 | `/admin` | `GET /api/v1/admin/users`、`POST /api/v1/admin/users/:id/ban`、`POST /api/v1/admin/users/:id/status` |
| 活动管理 | `/admin` | `GET /api/v1/admin/activities`、`POST /api/v1/admin/activities/:id/status`、`DELETE /api/v1/admin/activities/:id` |
| 举报处理 | `/admin` | `GET /api/v1/admin/reports`、`POST /api/v1/admin/reports/:id/resolve` |
| 敏感词治理 | `/admin` | `GET/POST/PUT/DELETE /api/v1/admin/sensitive-words`、`GET /api/v1/admin/sensitive-hits` |

### 7. 多卡片页面切换空白修复

此前部分页面在切换卡片或标签后会因为动画初始透明状态未重新触发而显示空白，需要用户手动点击刷新才能看到内容。本次已修复“我的”页面和“管理后台”页面的切换逻辑：切换面板时会主动触发当前面板动画，列表类面板不再依赖初始透明状态，并确保管理后台切换标签后可立即展示已加载数据。

## 三、后端结构调整

后端已按照一般 Go 项目标准将业务从单个文件拆分，便于继续维护。核心文件如下：

| 文件 | 作用 |
|---|---|
| `main.go` | 服务启动入口。 |
| `database.go` | 数据库连接、AutoMigrate 与默认敏感词初始化。 |
| `router.go` | API 路由注册。 |
| `middleware.go` | JWT、管理员权限、跨域等中间件。 |
| `models.go` | 用户、活动、报名、邀请、黑名单、举报、聊天、评价、敏感词等模型。 |
| `utils.go` | Token、JSON 数组、响应等通用工具函数。 |
| `sensitive.go` | 敏感词过滤、拒绝判断、默认词库和命中日志服务。 |
| `recommendation.go` | 邀约广场与智能邀请推荐算法。 |
| `handlers_auth.go` | 注册、登录、刷新、退出等认证接口。 |
| `handlers_user.go` | 用户资料、黑名单、MBTI 测试接口。 |
| `handlers_activity.go` | 活动、报名、我的活动、智能邀请接口。 |
| `handlers_chat.go` | 聊天历史、WebSocket、聊天举报、拉黑接口。 |
| `handlers_review_report.go` | 活动评价、通用举报、排行榜和缓存刷新。 |
| `handlers_admin.go` | 管理后台统计、用户、活动、举报和敏感词管理接口。 |

## 四、运行方式

### 1. 数据库

项目使用 PostgreSQL。若是全新库，可先导入原始 `public.sql`，再执行本次新增的 `modify.sql`；若后端允许 AutoMigrate，也可由后端启动时自动补齐新增表结构。

```bash
psql "$DATABASE_URL" -f public.sql
psql "$DATABASE_URL" -f modify.sql
```

建议生产环境显式执行 `modify.sql`，以便掌控数据库变更。示例管理员账号仍为 `admin@fudan.edu.cn`，脚本中已确保该账号角色为 `admin`。

### 2. 后端

```bash
cd back
export DATABASE_URL="host=localhost user=postgres password=postgres dbname=postgres port=5432 sslmode=disable"
export JWT_SECRET="请替换为生产环境随机密钥"
go mod tidy
go run .
```

后端默认监听 `:8080`，接口前缀为 `/api/v1`。

### 3. 前端

```bash
cd front
pnpm install
pnpm dev
```

生产构建命令如下：

```bash
pnpm build
```

如后端地址不是默认 `/api/v1` 同源代理，请根据现有前端配置调整 API 基础地址。

## 五、验证结果

本次修改已在交付环境中完成以下校验：

| 校验项 | 命令 | 结果 |
|---|---|---|
| 前端类型检查 | `pnpm exec tsc --noEmit` | 通过 |
| 前端生产构建 | `pnpm build` | 通过 |
| 后端格式化 | `gofmt -w *.go` | 通过 |
| 后端编译 | `GOTOOLCHAIN=local go build ./...` | 通过 |

## 六、注意事项

后端管理接口依赖用户 Token 中的管理员角色，普通用户访问 `/admin` 页面时接口会返回权限不足。线上部署时应设置强随机 `JWT_SECRET`，并确认数据库中至少存在一个 `role = 'admin'` 的管理员用户。聊天 WebSocket、拉黑、举报、活动评价、敏感词过滤与智能邀请均已接入真实后端模型，不是纯前端假数据。
