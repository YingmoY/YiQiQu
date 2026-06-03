-- yiqiqu_h5 功能增强数据库变更脚本
-- 适用数据库：PostgreSQL
-- 说明：后端已启用 GORM AutoMigrate；若生产环境不希望自动迁移，可先执行本脚本。

BEGIN;

-- 1. 用户资料增强：个人简介、标签、MBTI 来源、封禁状态、最后活跃时间。
ALTER TABLE IF EXISTS "public"."users"
  ADD COLUMN IF NOT EXISTS "bio" varchar(255) COLLATE "pg_catalog"."default" DEFAULT '',
  ADD COLUMN IF NOT EXISTS "mbti_source" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "tags" text COLLATE "pg_catalog"."default" DEFAULT '[]'::text,
  ADD COLUMN IF NOT EXISTS "is_banned" bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "last_active_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP;

UPDATE "public"."users"
SET "last_active_at" = COALESCE("last_active_at", "updated_at", "created_at", CURRENT_TIMESTAMP),
    "tags" = COALESCE("tags", '[]'),
    "bio" = COALESCE("bio", ''),
    "mbti_source" = COALESCE("mbti_source", 'manual')
WHERE "last_active_at" IS NULL OR "tags" IS NULL OR "bio" IS NULL OR "mbti_source" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_users_role" ON "public"."users" ("role");
CREATE INDEX IF NOT EXISTS "idx_users_is_banned" ON "public"."users" ("is_banned");
CREATE INDEX IF NOT EXISTS "idx_users_last_active_at" ON "public"."users" ("last_active_at");

-- 2. 用户黑名单关系：聊天拉黑、我的黑名单页面复用该表。
CREATE TABLE IF NOT EXISTS "public"."user_blocks" (
  "id" bigserial PRIMARY KEY,
  "blocker_id" bigint NOT NULL,
  "blocked_id" bigint NOT NULL,
  "reason" varchar(255) COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idx_block_pair" UNIQUE ("blocker_id", "blocked_id")
);
CREATE INDEX IF NOT EXISTS "idx_user_blocks_blocker_id" ON "public"."user_blocks" ("blocker_id");
CREATE INDEX IF NOT EXISTS "idx_user_blocks_blocked_id" ON "public"."user_blocks" ("blocked_id");

-- 3. MBTI 在线测试结果：保留用户历史测试答案和结果。
CREATE TABLE IF NOT EXISTS "public"."mbti_test_results" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "answers" text COLLATE "pg_catalog"."default" NOT NULL,
  "result" varchar(10) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_mbti_test_results_user_id" ON "public"."mbti_test_results" ("user_id");

-- 4. 智能邀请记录：活动发布后保存算法推荐对象、推荐分、理由和邀请文案。
CREATE TABLE IF NOT EXISTS "public"."activity_invitations" (
  "id" bigserial PRIMARY KEY,
  "activity_id" bigint NOT NULL,
  "inviter_id" bigint NOT NULL,
  "invitee_id" bigint NOT NULL,
  "score" numeric(8,2) NOT NULL DEFAULT 0,
  "reasons" text COLLATE "pg_catalog"."default" DEFAULT '[]'::text,
  "message" text COLLATE "pg_catalog"."default",
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT '已生成',
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idx_act_invite" UNIQUE ("activity_id", "invitee_id")
);
CREATE INDEX IF NOT EXISTS "idx_activity_invitations_activity_id" ON "public"."activity_invitations" ("activity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_invitations_invitee_id" ON "public"."activity_invitations" ("invitee_id");
CREATE INDEX IF NOT EXISTS "idx_activity_invitations_inviter_id" ON "public"."activity_invitations" ("inviter_id");
CREATE INDEX IF NOT EXISTS "idx_activity_invitations_score" ON "public"."activity_invitations" ("score" DESC);

-- 5. 活动评价：活动完成后参与者可互评，评价会影响用户信誉统计。
CREATE TABLE IF NOT EXISTS "public"."reviews" (
  "id" bigserial PRIMARY KEY,
  "activity_id" bigint NOT NULL,
  "reviewer_id" bigint NOT NULL,
  "reviewee_id" bigint NOT NULL,
  "is_attended" bool NOT NULL DEFAULT true,
  "is_punctual" bool NOT NULL DEFAULT true,
  "score" bigint NOT NULL DEFAULT 5,
  "comment" varchar(255) COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idx_act_rev" UNIQUE ("activity_id", "reviewer_id", "reviewee_id")
);
CREATE INDEX IF NOT EXISTS "idx_reviews_activity_id" ON "public"."reviews" ("activity_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_reviewee_id" ON "public"."reviews" ("reviewee_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_reviewer_id" ON "public"."reviews" ("reviewer_id");

-- 6. 敏感词词库：支持替换（mask）和拒绝（reject）两种动作。
CREATE TABLE IF NOT EXISTS "public"."sensitive_words" (
  "id" bigserial PRIMARY KEY,
  "word" varchar(100) COLLATE "pg_catalog"."default" NOT NULL UNIQUE,
  "category" varchar(50) COLLATE "pg_catalog"."default" NOT NULL DEFAULT '通用',
  "action" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'mask',
  "is_enabled" bool NOT NULL DEFAULT true,
  "hit_count" bigint NOT NULL DEFAULT 0,
  "created_by" bigint DEFAULT 0,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_sensitive_words_enabled" ON "public"."sensitive_words" ("is_enabled");
CREATE INDEX IF NOT EXISTS "idx_sensitive_words_category" ON "public"."sensitive_words" ("category");

-- 7. 敏感词命中日志：用于管理后台追踪命中场景、原文与过滤后文本。
CREATE TABLE IF NOT EXISTS "public"."sensitive_word_hits" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint DEFAULT 0,
  "scene" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "target_id" bigint DEFAULT 0,
  "original_content" text COLLATE "pg_catalog"."default",
  "filtered_content" text COLLATE "pg_catalog"."default",
  "matched_words" text COLLATE "pg_catalog"."default" DEFAULT '[]'::text,
  "action" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_sensitive_word_hits_user_id" ON "public"."sensitive_word_hits" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sensitive_word_hits_scene" ON "public"."sensitive_word_hits" ("scene");
CREATE INDEX IF NOT EXISTS "idx_sensitive_word_hits_created_at" ON "public"."sensitive_word_hits" ("created_at" DESC);

-- 8. 初始化默认敏感词，生产环境可通过 /admin 敏感词库继续维护。
INSERT INTO "public"."sensitive_words" ("word", "category", "action", "is_enabled", "created_by") VALUES
  ('诈骗', '安全', 'reject', true, 0),
  ('赌博', '安全', 'reject', true, 0),
  ('辱骂', '社区', 'mask', true, 0),
  ('广告', '营销', 'mask', true, 0),
  ('加微信', '引流', 'mask', true, 0)
ON CONFLICT ("word") DO NOTHING;

-- 9. 推荐、评价、敏感词与管理后台常用索引。
CREATE INDEX IF NOT EXISTS "idx_activities_status" ON "public"."activities" ("status");
CREATE INDEX IF NOT EXISTS "idx_activities_category" ON "public"."activities" ("category");
CREATE INDEX IF NOT EXISTS "idx_activities_start_time" ON "public"."activities" ("start_time");
CREATE INDEX IF NOT EXISTS "idx_applications_applicant_id" ON "public"."applications" ("applicant_id");
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "public"."reports" ("status");
CREATE INDEX IF NOT EXISTS "idx_reports_target" ON "public"."reports" ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_chat_messages_activity_id" ON "public"."chat_messages" ("activity_id");

-- 10. 可选：确保示例管理员账号具备管理后台权限。
UPDATE "public"."users" SET "role" = 'admin' WHERE "email" = 'admin@fudan.edu.cn';

COMMIT;
