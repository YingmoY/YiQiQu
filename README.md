# 一起去 (YiQiQu) - 智能社交邀约平台

一起去（YiQiQu）是一个基于地理位置与兴趣爱好的智能社交邀约平台。它旨在通过先进的匹配算法，连接有共同活动需求的用户，提供从活动发起、智能推荐、实时聊天到评价反馈的全链路社交体验。

## 🌟 核心功能

### 1. 用户系统
- **个人资料管理**：支持自定义头像、昵称、个人简介及个性化标签。
- **MBTI 社交**：内置 MBTI 在线测试与自主录入功能，支持基于性格类型的社交匹配。
- **安全与隐私**：完善的黑名单系统与用户举报机制，保障社交环境安全。

### 2. 邀约广场 (核心)
- **算法推荐**：基于用户标签、MBTI、历史活动偏好及地理位置的智能排序算法。
- **活动发布**：支持多种分类（运动、桌游、户外、美食等）的活动发起。
- **智能邀请**：发布活动后，系统自动根据现有用户画像推荐最合适的邀请对象并生成个性化邀请。
- **流程管理**：清晰的“我的发起”与“我的报名”进度追踪。

### 3. 实时交互
- **即时通讯**：基于 WebSocket 的实时聊天功能。
- **内容安全**：内置全站敏感词过滤系统，实时拦截违规发言。
- **互动评价**：活动结束后可进行双向评价，构建信用体系。

### 4. 管理后台 (桌面端)
- **数据看板**：可视化展示用户增长、活动热度及举报统计。
- **内容审核**：集中处理举报信息，管理用户封禁状态。
- **运营工具**：灵活配置系统敏感词词库，实时检测违规文本。

## 🛠 技术栈

### 前端 (Client)
- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **UI 组件库**: Tailwind CSS + Shadcn/UI
- **动画**: Framer Motion + Anime.js
- **路由**: Wouter

### 后端 (Server)
- **语言**: Go (Golang)
- **框架**: Gin
- **数据库**: PostgreSQL + GORM
- **实时通信**: Gorilla WebSocket
- **推荐引擎**: 自研权重匹配算法

## 🚀 快速启动

### 环境要求
- Go 1.25
- Node.js 22+
- PostgreSQL 15+

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

## 📁 目录结构

```text
├── front/               # 前端项目源码
│   ├── src/             # React 源码
│   │   ├── pages/       # 页面组件 (包含 H5 与 Admin)
│   │   ├── components/  # 通用 UI 组件
│   │   └── lib/         # API 封装与工具类
│   └── package.json
├── back/                # 后端项目源码
│   ├── handlers/        # API 处理器 (按功能拆分)
│   ├── models/          # GORM 数据模型
│   ├── router.go        # 路由定义
│   └── sensitive.go     # 敏感词服务
├── modify.sql           # 数据库增量更新脚本
└── README.md            # 项目说明文档
```

## 🛡 安全与规范
- 严禁发布任何违法违规内容。
- 系统会自动记录所有敏感词命中日志，管理员有权对违规用户进行封禁处理。

---
© 2026 一起去 (YiQiQu) 项目团队. 保留所有权利。
