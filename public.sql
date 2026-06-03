/*
 Navicat Premium Dump SQL

 Source Server         : PostgreSQL
 Source Server Type    : PostgreSQL
 Source Server Version : 180002 (180002)
 Source Host           : 127.0.0.1:5432
 Source Catalog        : together
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 180002 (180002)
 File Encoding         : 65001

 Date: 02/06/2026 21:40:33
*/


-- ----------------------------
-- Sequence structure for activities_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."activities_id_seq";
CREATE SEQUENCE "public"."activities_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for activity_feed_caches_activity_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."activity_feed_caches_activity_id_seq";
CREATE SEQUENCE "public"."activity_feed_caches_activity_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for applications_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."applications_id_seq";
CREATE SEQUENCE "public"."applications_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for chat_messages_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."chat_messages_id_seq";
CREATE SEQUENCE "public"."chat_messages_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for email_codes_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."email_codes_id_seq";
CREATE SEQUENCE "public"."email_codes_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for leaderboard_snapshots_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."leaderboard_snapshots_id_seq";
CREATE SEQUENCE "public"."leaderboard_snapshots_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for refresh_sessions_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."refresh_sessions_id_seq";
CREATE SEQUENCE "public"."refresh_sessions_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for reports_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."reports_id_seq";
CREATE SEQUENCE "public"."reports_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for reviews_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."reviews_id_seq";
CREATE SEQUENCE "public"."reviews_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for user_reputations_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."user_reputations_id_seq";
CREATE SEQUENCE "public"."user_reputations_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for users_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."users_id_seq";
CREATE SEQUENCE "public"."users_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for activities
-- ----------------------------
DROP TABLE IF EXISTS "public"."activities";
CREATE TABLE "public"."activities" (
  "id" int4 NOT NULL DEFAULT nextval('activities_id_seq'::regclass),
  "creator_id" int8 NOT NULL,
  "title" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "category" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "location" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "start_time" timestamptz(6) NOT NULL,
  "max_participants" int4 NOT NULL DEFAULT 2,
  "description" text COLLATE "pg_catalog"."default",
  "auto_approve" bool NOT NULL DEFAULT false,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT '招募中'::character varying,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of activities
-- ----------------------------
INSERT INTO "public"."activities" VALUES (1, 2, '北区食堂二楼吃酸汤鱼，求1-2个搭子！', '吃饭', '旦苑北区食堂二楼', '2026-06-01 10:00:00+00', 3, '今天好想吃北区的酸汤鱼，一个人吃不完，来两个饭搭子一起！男女不限，随和好相处就行。', 'f', '招募中', '2026-06-01 02:00:00+00', '2026-06-01 15:22:19.799655+00');
INSERT INTO "public"."activities" VALUES (2, 3, '理科图书馆三楼自习，保持安静', '自习', '理科图书馆3楼中厅', '2026-06-01 06:30:00+00', 2, '准备期末考/托福，找一个自习搭子互相监督。要求：不玩手机，保持安静，累了可以一起去买杯咖啡。', 'f', '进行中', '2026-06-01 01:00:00+00', '2026-06-01 15:22:19.799655+00');
INSERT INTO "public"."activities" VALUES (3, 4, '正区体育场夜跑 5KM，配速5分半', '运动', '正区体育场跑道', '2026-06-01 12:30:00+00', 4, '晚上夜跑，跑完拉伸。配速在5:30左右，欢迎能坚持跑完5公里的同学加入，跑完可以一起喝水聊天。', 'f', '招募中', '2026-06-01 03:30:00+00', '2026-06-01 15:22:19.799655+00');
INSERT INTO "public"."activities" VALUES (4, 5, '去当代艺术博物馆看新展，顺便街拍', '外出', '上海当代艺术博物馆 (PSA)', '2026-05-31 02:00:00+00', 3, '当代艺术博物馆有个超棒的特展，想去拍照打卡。找1-2个爱拍照或者乐意被拍的小伙伴一起，拼车去。', 'f', '已完成', '2026-05-30 07:00:00+00', '2026-06-01 15:22:19.799655+00');
INSERT INTO "public"."activities" VALUES (5, 6, '光华楼西主楼刷高数题，求学霸带', '自习', '光华楼西主楼自习教室', '2026-06-02 01:00:00+00', 2, '高数期末考快到了，好多证明题不会。找个学霸一起自习，可以请喝奶茶！', 'f', '招募中', '2026-06-01 05:00:00+00', '2026-06-01 15:22:19.799655+00');

-- ----------------------------
-- Table structure for activity_feed_cache
-- ----------------------------
DROP TABLE IF EXISTS "public"."activity_feed_cache";
CREATE TABLE "public"."activity_feed_cache" (
  "activity_id" int4 NOT NULL,
  "creator_nickname" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "creator_avatar_color" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "creator_reputation" int4 NOT NULL,
  "joined_count" int4 NOT NULL DEFAULT 1,
  "cached_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of activity_feed_cache
-- ----------------------------
INSERT INTO "public"."activity_feed_cache" VALUES (1, '张杰瑞 Jerry', '#FFDE4D', 98, 3, '2026-06-01 15:22:19.837842+00');
INSERT INTO "public"."activity_feed_cache" VALUES (2, '爱丽丝 Alice', '#4D96FF', 100, 2, '2026-06-01 15:22:19.837842+00');
INSERT INTO "public"."activity_feed_cache" VALUES (3, '鲍勃 Bob', '#6BCB77', 95, 2, '2026-06-01 15:22:19.837842+00');
INSERT INTO "public"."activity_feed_cache" VALUES (5, '大卫 Dave', '#4D96FF', 100, 1, '2026-06-01 15:22:19.837842+00');

-- ----------------------------
-- Table structure for activity_feed_caches
-- ----------------------------
DROP TABLE IF EXISTS "public"."activity_feed_caches";
CREATE TABLE "public"."activity_feed_caches" (
  "activity_id" int8 NOT NULL DEFAULT nextval('activity_feed_caches_activity_id_seq'::regclass),
  "creator_nickname" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "creator_avatar_color" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "creator_reputation" int8 NOT NULL,
  "joined_count" int8 NOT NULL DEFAULT 1,
  "cached_at" timestamptz(6)
)
;

-- ----------------------------
-- Records of activity_feed_caches
-- ----------------------------
INSERT INTO "public"."activity_feed_caches" VALUES (1, '张杰瑞 Jerry', '#FFDE4D', 98, 3, '2026-06-02 13:39:11.943311+00');
INSERT INTO "public"."activity_feed_caches" VALUES (3, '鲍勃 Bob', '#6BCB77', 95, 2, '2026-06-02 13:39:11.948005+00');
INSERT INTO "public"."activity_feed_caches" VALUES (5, '大卫 Dave', '#4D96FF', 100, 1, '2026-06-02 13:39:11.953494+00');

-- ----------------------------
-- Table structure for applications
-- ----------------------------
DROP TABLE IF EXISTS "public"."applications";
CREATE TABLE "public"."applications" (
  "id" int4 NOT NULL DEFAULT nextval('applications_id_seq'::regclass),
  "activity_id" int8 NOT NULL,
  "applicant_id" int8 NOT NULL,
  "message" varchar(255) COLLATE "pg_catalog"."default",
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT '待审批'::character varying,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of applications
-- ----------------------------
INSERT INTO "public"."applications" VALUES (1, 1, 4, '想吃酸汤鱼！随时有空。', '已通过', '2026-06-01 03:00:00+00', '2026-06-01 15:22:19.807512+00');
INSERT INTO "public"."applications" VALUES (2, 1, 5, '加我一个，我也在北区！', '已通过', '2026-06-01 03:15:00+00', '2026-06-01 15:22:19.807512+00');
INSERT INTO "public"."applications" VALUES (3, 2, 6, '我也在复习，一起吧。', '已通过', '2026-06-01 01:30:00+00', '2026-06-01 15:22:19.807512+00');
INSERT INTO "public"."applications" VALUES (4, 2, 5, '求带，理科图书馆太难抢座了。', '待审批', '2026-06-01 02:15:00+00', '2026-06-01 15:22:19.807512+00');
INSERT INTO "public"."applications" VALUES (5, 3, 2, '今晚刚好想跑步，带我一个！', '已通过', '2026-06-01 04:00:00+00', '2026-06-01 15:22:19.807512+00');
INSERT INTO "public"."applications" VALUES (6, 4, 3, '好想去这个展！', '已通过', '2026-05-30 08:00:00+00', '2026-06-01 15:22:19.807512+00');
INSERT INTO "public"."applications" VALUES (7, 4, 6, '我也去，刚好顺路。', '已通过', '2026-05-30 09:00:00+00', '2026-06-01 15:22:19.807512+00');

-- ----------------------------
-- Table structure for chat_messages
-- ----------------------------
DROP TABLE IF EXISTS "public"."chat_messages";
CREATE TABLE "public"."chat_messages" (
  "id" int4 NOT NULL DEFAULT nextval('chat_messages_id_seq'::regclass),
  "activity_id" int8 NOT NULL,
  "sender_id" int8 NOT NULL,
  "message_type" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'text'::character varying,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of chat_messages
-- ----------------------------
INSERT INTO "public"."chat_messages" VALUES (1, 2, 3, 'system', '爱丽丝 Alice 开启了聊天室，大家可以开始沟通啦！', '2026-06-01 01:30:00+00');
INSERT INTO "public"."chat_messages" VALUES (2, 2, 6, 'text', '哈罗，我已经到三楼了，坐在靠窗的32号桌。', '2026-06-01 06:15:00+00');
INSERT INTO "public"."chat_messages" VALUES (3, 2, 3, 'text', '好的，我马上到，我穿一件黄色卫衣。', '2026-06-01 06:18:00+00');
INSERT INTO "public"."chat_messages" VALUES (4, 2, 6, 'text', '收到，桌子上有空位，我帮你占了一个。', '2026-06-01 06:20:00+00');
INSERT INTO "public"."chat_messages" VALUES (5, 4, 5, 'system', '卡罗尔 Carol 开启了聊天室，大家可以开始沟通啦！', '2026-05-30 09:00:00+00');
INSERT INTO "public"."chat_messages" VALUES (6, 4, 3, 'text', '明天我们在学校南区正门集合吗？一起打车去？', '2026-05-30 11:00:00+00');
INSERT INTO "public"."chat_messages" VALUES (7, 4, 5, 'text', '对的！明天上午9:30南区正门，我已经叫好车了。', '2026-05-30 11:15:00+00');
INSERT INTO "public"."chat_messages" VALUES (8, 4, 6, 'text', '太棒了，明天准时到！', '2026-05-30 11:30:00+00');
INSERT INTO "public"."chat_messages" VALUES (9, 4, 5, 'text', '我们到 PSA 啦，这里拍照绝美！', '2026-05-31 02:30:00+00');
INSERT INTO "public"."chat_messages" VALUES (10, 4, 5, 'system', '活动已结束，感谢大家的参与！请在24小时内完成互评，积累信誉分。', '2026-05-31 06:00:00+00');

-- ----------------------------
-- Table structure for email_codes
-- ----------------------------
DROP TABLE IF EXISTS "public"."email_codes";
CREATE TABLE "public"."email_codes" (
  "id" int4 NOT NULL DEFAULT nextval('email_codes_id_seq'::regclass),
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "code" varchar(10) COLLATE "pg_catalog"."default" NOT NULL,
  "purpose" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "is_used" bool NOT NULL DEFAULT false,
  "expires_at" timestamptz(6) NOT NULL,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of email_codes
-- ----------------------------

-- ----------------------------
-- Table structure for leaderboard_snapshots
-- ----------------------------
DROP TABLE IF EXISTS "public"."leaderboard_snapshots";
CREATE TABLE "public"."leaderboard_snapshots" (
  "id" int4 NOT NULL DEFAULT nextval('leaderboard_snapshots_id_seq'::regclass),
  "school" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "ranking_type" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "rank_data" jsonb NOT NULL,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of leaderboard_snapshots
-- ----------------------------
INSERT INTO "public"."leaderboard_snapshots" VALUES (1, '复旦大学', 'reputation', '[{"mbti": "INFJ", "rank": 1, "major": "微电子学", "score": 100, "nickname": "爱丽丝 Alice", "avatar_color": "#4D96FF"}, {"mbti": "INTP", "rank": 2, "major": "物理学", "score": 100, "nickname": "大卫 Dave", "avatar_color": "#4D96FF"}, {"mbti": "ENFJ", "rank": 3, "major": "新闻学", "score": 99, "nickname": "卡罗尔 Carol", "avatar_color": "#FF6B6B"}, {"mbti": "ENFP", "rank": 4, "major": "软件工程", "score": 98, "nickname": "张杰瑞 Jerry", "avatar_color": "#FFDE4D"}, {"mbti": "ESTP", "rank": 5, "major": "工商管理", "score": 95, "nickname": "鲍勃 Bob", "avatar_color": "#6BCB77"}]', '2026-06-01 04:00:00+00');

-- ----------------------------
-- Table structure for refresh_sessions
-- ----------------------------
DROP TABLE IF EXISTS "public"."refresh_sessions";
CREATE TABLE "public"."refresh_sessions" (
  "id" int4 NOT NULL DEFAULT nextval('refresh_sessions_id_seq'::regclass),
  "user_id" int8 NOT NULL,
  "token_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "device_info" varchar(255) COLLATE "pg_catalog"."default",
  "is_revoked" bool NOT NULL DEFAULT false,
  "expires_at" timestamptz(6) NOT NULL,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "last_used_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of refresh_sessions
-- ----------------------------
INSERT INTO "public"."refresh_sessions" VALUES (1, 2, 'c3bd68bf7c5efa6ab031a7b66a8c86818feb980c44b41da9551e94478193b069', '', 'f', '2026-07-01 15:54:05.285902+00', '2026-06-01 15:54:05.286903+00', '2026-06-01 15:54:05.285902+00');
INSERT INTO "public"."refresh_sessions" VALUES (3, 2, '788c6b39ff4552f380a741fc947db0f524171707323171beb0d6cfb277e9dc48', '', 'f', '2026-07-01 15:57:07.876521+00', '2026-06-01 15:57:07.876521+00', '2026-06-01 15:57:07.876521+00');
INSERT INTO "public"."refresh_sessions" VALUES (4, 2, '1526f29b012ce1665f19d145da9b28bea5fded607e1e6045b8bda5afd96f3721', '', 'f', '2026-07-01 15:57:14.427369+00', '2026-06-01 15:57:14.42837+00', '2026-06-01 15:57:14.427369+00');
INSERT INTO "public"."refresh_sessions" VALUES (5, 2, '22ca0467b431fe588c4a52ec2d214d384d05cb3a5d8f2445db4883ed705b382c', '', 'f', '2026-07-01 15:57:23.567875+00', '2026-06-01 15:57:23.568875+00', '2026-06-01 15:57:23.567875+00');
INSERT INTO "public"."refresh_sessions" VALUES (6, 2, 'cae485ee0f6f262798c004a23fb886b75e215b3a77d9cb2eed915a5b78fbb5a4', '', 'f', '2026-07-01 15:59:41.030309+00', '2026-06-01 15:59:41.031313+00', '2026-06-01 15:59:41.030309+00');
INSERT INTO "public"."refresh_sessions" VALUES (7, 2, '2bc5b8eb6b3ac30535ef69a6c1432e694cfc114afaf5b00946693d4f0945d066', '', 'f', '2026-07-01 16:02:10.786301+00', '2026-06-01 16:02:10.787302+00', '2026-06-01 16:02:10.786301+00');
INSERT INTO "public"."refresh_sessions" VALUES (9, 2, '78fe24d0f75c73ddc0fd8bead8b7f9eced99ceb453724548a6244784b1e51453', '', 'f', '2026-07-01 16:07:07.298897+00', '2026-06-01 16:07:07.300411+00', '2026-06-01 16:07:07.298897+00');
INSERT INTO "public"."refresh_sessions" VALUES (10, 2, '26bf8d44ca0f50e7d6832d226bd815434396389471bb490c4cceda9171a38193', '', 'f', '2026-07-01 16:07:20.118143+00', '2026-06-01 16:07:20.119143+00', '2026-06-01 16:07:20.118143+00');
INSERT INTO "public"."refresh_sessions" VALUES (11, 2, '3b7894dd04190784e3a7acb7b5525fda82d619b5c33c277d93db23ee1884b210', '', 'f', '2026-07-01 16:07:30.829706+00', '2026-06-01 16:07:30.829706+00', '2026-06-01 16:07:30.829706+00');
INSERT INTO "public"."refresh_sessions" VALUES (12, 2, '18a5a9c69fe2d166fd7bd0f1f2436e06b6c39dc61ed987bde80581915f1a6d90', '', 'f', '2026-07-01 16:15:40.218004+00', '2026-06-01 16:15:40.218509+00', '2026-06-01 16:15:40.218004+00');
INSERT INTO "public"."refresh_sessions" VALUES (13, 2, '9178f606edd277023a6f34ff7fc903d696c878b015c8b52b368733159885a152', '', 'f', '2026-07-01 16:15:48.725404+00', '2026-06-01 16:15:48.726405+00', '2026-06-01 16:15:48.725404+00');
INSERT INTO "public"."refresh_sessions" VALUES (14, 2, 'a79f4b774d497be470c1385ea5d6d0c4c2eb9d4bbac7bd817c46cc1de7de604e', '', 'f', '2026-07-01 16:18:19.74798+00', '2026-06-01 16:18:19.74898+00', '2026-06-01 16:18:19.74798+00');
INSERT INTO "public"."refresh_sessions" VALUES (15, 2, 'f904107fc3d8e6dd6eaa9c3bae8d91fa71a201e4829635f211bd7a0093775fc5', '', 'f', '2026-07-02 04:01:07.117386+00', '2026-06-02 04:01:07.117386+00', '2026-06-02 04:01:07.117386+00');
INSERT INTO "public"."refresh_sessions" VALUES (16, 1, '16b9fce6dd889d3608e4db2bf10ccaae2e238d522bddee549ec7e6b86a258d3b', '', 'f', '2026-07-02 04:13:07.456903+00', '2026-06-02 04:13:07.457903+00', '2026-06-02 04:13:07.456903+00');
INSERT INTO "public"."refresh_sessions" VALUES (8, 2, 'b85d0c0e8157e4a2b6a19f3e7a8438bbc579bff1f0b23e7c3516229168266e5b', '', 'f', '2026-07-01 16:04:43.791337+00', '2026-06-01 16:04:43.792336+00', '2026-06-01 16:04:43.791337+00');
INSERT INTO "public"."refresh_sessions" VALUES (17, 2, '83b59dcb09307ebd6003c1f6a0695523ca7fd9432f14261fa826f78fd8b8091f', '', 'f', '2026-07-02 04:15:12.929472+00', '2026-06-02 04:15:12.929472+00', '2026-06-02 04:15:12.929472+00');
INSERT INTO "public"."refresh_sessions" VALUES (18, 1, '5cbd4b7c646d9538c68b44b1556dcbe8f00cd371926dad4c68cdf5bb01ff7214', '', 'f', '2026-07-02 04:15:53.174047+00', '2026-06-02 04:15:53.175047+00', '2026-06-02 04:15:53.174047+00');
INSERT INTO "public"."refresh_sessions" VALUES (19, 2, 'd08c22739969f68b04314e9101c552baed843c0609b65e8da3d5666a60a4da47', '', 'f', '2026-07-02 04:17:58.0613+00', '2026-06-02 04:17:58.062301+00', '2026-06-02 04:17:58.0613+00');
INSERT INTO "public"."refresh_sessions" VALUES (2, 2, 'f480736904dfb91b7f7ad3195839aa1fb941b1eddc5b55405b236676f49aaec6', '', 'f', '2026-07-01 15:54:27.837364+00', '2026-06-01 15:54:27.838363+00', '2026-06-01 15:54:27.837364+00');
INSERT INTO "public"."refresh_sessions" VALUES (20, 2, 'b0539f57ef9550e28f44833a266109d77d11b9b3892999ed9561e846b28a2981', '', 'f', '2026-07-02 13:04:26.059055+00', '2026-06-02 13:04:26.059055+00', '2026-06-02 13:04:26.059055+00');

-- ----------------------------
-- Table structure for reports
-- ----------------------------
DROP TABLE IF EXISTS "public"."reports";
CREATE TABLE "public"."reports" (
  "id" int4 NOT NULL DEFAULT nextval('reports_id_seq'::regclass),
  "reporter_id" int8 NOT NULL,
  "target_type" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "target_id" int8 NOT NULL,
  "reason" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT '待处理'::character varying,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of reports
-- ----------------------------

-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS "public"."reviews";
CREATE TABLE "public"."reviews" (
  "id" int4 NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  "activity_id" int8 NOT NULL,
  "reviewer_id" int8 NOT NULL,
  "reviewee_id" int8 NOT NULL,
  "is_attended" bool NOT NULL DEFAULT true,
  "is_punctual" bool NOT NULL DEFAULT true,
  "score" int4 NOT NULL DEFAULT 5,
  "comment" varchar(255) COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of reviews
-- ----------------------------
INSERT INTO "public"."reviews" VALUES (1, 4, 5, 3, 'f', 'f', 5, 'Alice 非常守时，看展的时候很有共同话题，很棒的搭子！', '2026-05-31 06:30:00+00');
INSERT INTO "public"."reviews" VALUES (2, 4, 5, 6, 'f', 'f', 5, 'Dave 也很准时，一路上帮我们拍了很多照片，技术流学霸！', '2026-05-31 06:35:00+00');
INSERT INTO "public"."reviews" VALUES (3, 4, 3, 5, 'f', 'f', 5, 'Carol 组局很赞，叫车、买票都安排得很周到，性格超级开朗！', '2026-05-31 07:00:00+00');

-- ----------------------------
-- Table structure for user_reputations
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_reputations";
CREATE TABLE "public"."user_reputations" (
  "id" int4 NOT NULL DEFAULT nextval('user_reputations_id_seq'::regclass),
  "user_id" int8 NOT NULL,
  "reputation_score" int4 NOT NULL DEFAULT 100,
  "total_activities" int4 NOT NULL DEFAULT 0,
  "attendance_rate" numeric(5,2) NOT NULL DEFAULT 100.00,
  "punctuality_rate" numeric(5,2) NOT NULL DEFAULT 100.00,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of user_reputations
-- ----------------------------
INSERT INTO "public"."user_reputations" VALUES (1, 1, 100, 0, 100.00, 100.00, '2026-06-01 15:22:19.79484+00');
INSERT INTO "public"."user_reputations" VALUES (2, 2, 98, 12, 100.00, 91.67, '2026-06-01 15:22:19.79484+00');
INSERT INTO "public"."user_reputations" VALUES (3, 3, 100, 8, 100.00, 100.00, '2026-06-01 15:22:19.79484+00');
INSERT INTO "public"."user_reputations" VALUES (4, 4, 95, 20, 95.00, 95.00, '2026-06-01 15:22:19.79484+00');
INSERT INTO "public"."user_reputations" VALUES (5, 5, 99, 15, 100.00, 100.00, '2026-06-01 15:22:19.79484+00');
INSERT INTO "public"."user_reputations" VALUES (6, 6, 100, 4, 100.00, 100.00, '2026-06-01 15:22:19.79484+00');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" int4 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "password_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "nickname" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "avatar_color" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT '#FFDE4D'::character varying,
  "school" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "major" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "mbti" varchar(10) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'INFP'::character varying,
  "social_energy" int4 NOT NULL DEFAULT 50,
  "interests" text COLLATE "pg_catalog"."default" DEFAULT '[]'::text,
  "role" varchar(20) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'user'::character varying,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO "public"."users" VALUES (2, 'jerry@fudan.edu.cn', '$2a$10$PwpNn0h6X9nJ81SB6ZuN4e2zROuntk3UoZvGUAtO17kvhXqeU4Sne', '张杰瑞 Jerry', '#FFDE4D', '复旦大学', '软件工程', 'ENFP', 85, '["羽毛球","精酿啤酒","看电影","猫奴"]', 'user', '2026-06-01 15:22:19.785943+00', '2026-06-01 15:22:19.785943+00');
INSERT INTO "public"."users" VALUES (3, 'alice@fudan.edu.cn', '$2a$10$PwpNn0h6X9nJ81SB6ZuN4e2zROuntk3UoZvGUAtO17kvhXqeU4Sne', '爱丽丝 Alice', '#4D96FF', '复旦大学', '微电子学', 'INFJ', 40, '["自习","古典音乐","手账","猫奴"]', 'user', '2026-06-01 15:22:19.785943+00', '2026-06-01 15:22:19.785943+00');
INSERT INTO "public"."users" VALUES (4, 'bob@fudan.edu.cn', '$2a$10$PwpNn0h6X9nJ81SB6ZuN4e2zROuntk3UoZvGUAtO17kvhXqeU4Sne', '鲍勃 Bob', '#6BCB77', '复旦大学', '工商管理', 'ESTP', 95, '["健身","夜跑","街舞","极限运动"]', 'user', '2026-06-01 15:22:19.785943+00', '2026-06-01 15:22:19.785943+00');
INSERT INTO "public"."users" VALUES (5, 'carol@fudan.edu.cn', '$2a$10$PwpNn0h6X9nJ81SB6ZuN4e2zROuntk3UoZvGUAtO17kvhXqeU4Sne', '卡罗尔 Carol', '#FF6B6B', '复旦大学', '新闻学', 'ENFJ', 75, '["探店","美食摄影","看展","戏剧"]', 'user', '2026-06-01 15:22:19.785943+00', '2026-06-01 15:22:19.785943+00');
INSERT INTO "public"."users" VALUES (6, 'dave@fudan.edu.cn', '$2a$10$PwpNn0h6X9nJ81SB6ZuN4e2zROuntk3UoZvGUAtO17kvhXqeU4Sne', '大卫 Dave', '#4D96FF', '复旦大学', '物理学', 'INTP', 20, '["数码科技","硬核科幻","自习","独立游戏"]', 'user', '2026-06-01 15:22:19.785943+00', '2026-06-01 15:22:19.785943+00');
INSERT INTO "public"."users" VALUES (1, 'admin@fudan.edu.cn', '$2a$10$vO8KfGTzVV0vCQqfHP/8QeIhtjBEDwequU8Br4CLHHxN9gbJLKVA6', '系统管理员', '#FF5F5F', '复旦大学', '计算机科学与技术', 'INTJ', 30, '["系统维护","算法研究"]', 'admin', '2026-06-01 15:22:19.785943+00', '2026-06-01 15:22:19.785943+00');

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."activities_id_seq"
OWNED BY "public"."activities"."id";
SELECT setval('"public"."activities_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."activity_feed_caches_activity_id_seq"
OWNED BY "public"."activity_feed_caches"."activity_id";
SELECT setval('"public"."activity_feed_caches_activity_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."applications_id_seq"
OWNED BY "public"."applications"."id";
SELECT setval('"public"."applications_id_seq"', 7, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."chat_messages_id_seq"
OWNED BY "public"."chat_messages"."id";
SELECT setval('"public"."chat_messages_id_seq"', 10, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."email_codes_id_seq"
OWNED BY "public"."email_codes"."id";
SELECT setval('"public"."email_codes_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."leaderboard_snapshots_id_seq"
OWNED BY "public"."leaderboard_snapshots"."id";
SELECT setval('"public"."leaderboard_snapshots_id_seq"', 1, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."refresh_sessions_id_seq"
OWNED BY "public"."refresh_sessions"."id";
SELECT setval('"public"."refresh_sessions_id_seq"', 20, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."reports_id_seq"
OWNED BY "public"."reports"."id";
SELECT setval('"public"."reports_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."reviews_id_seq"
OWNED BY "public"."reviews"."id";
SELECT setval('"public"."reviews_id_seq"', 3, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."user_reputations_id_seq"
OWNED BY "public"."user_reputations"."id";
SELECT setval('"public"."user_reputations_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."users_id_seq"
OWNED BY "public"."users"."id";
SELECT setval('"public"."users_id_seq"', 6, true);

-- ----------------------------
-- Indexes structure for table activities
-- ----------------------------
CREATE INDEX "idx_activities_category" ON "public"."activities" USING btree (
  "category" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_activities_status" ON "public"."activities" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table activities
-- ----------------------------
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table activity_feed_cache
-- ----------------------------
ALTER TABLE "public"."activity_feed_cache" ADD CONSTRAINT "activity_feed_cache_pkey" PRIMARY KEY ("activity_id");

-- ----------------------------
-- Primary Key structure for table activity_feed_caches
-- ----------------------------
ALTER TABLE "public"."activity_feed_caches" ADD CONSTRAINT "activity_feed_caches_pkey" PRIMARY KEY ("activity_id");

-- ----------------------------
-- Indexes structure for table applications
-- ----------------------------
CREATE UNIQUE INDEX "idx_act_app" ON "public"."applications" USING btree (
  "activity_id" "pg_catalog"."int8_ops" ASC NULLS LAST,
  "applicant_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "idx_applications_activity_id" ON "public"."applications" USING btree (
  "activity_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table applications
-- ----------------------------
ALTER TABLE "public"."applications" ADD CONSTRAINT "unique_applicant_activity" UNIQUE ("activity_id", "applicant_id");

-- ----------------------------
-- Primary Key structure for table applications
-- ----------------------------
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table chat_messages
-- ----------------------------
CREATE INDEX "idx_chat_messages_activity_id" ON "public"."chat_messages" USING btree (
  "activity_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table chat_messages
-- ----------------------------
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table email_codes
-- ----------------------------
ALTER TABLE "public"."email_codes" ADD CONSTRAINT "email_codes_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table leaderboard_snapshots
-- ----------------------------
ALTER TABLE "public"."leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table refresh_sessions
-- ----------------------------
CREATE UNIQUE INDEX "idx_refresh_sessions_token_hash" ON "public"."refresh_sessions" USING btree (
  "token_hash" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table refresh_sessions
-- ----------------------------
ALTER TABLE "public"."refresh_sessions" ADD CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table reports
-- ----------------------------
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table reviews
-- ----------------------------
CREATE UNIQUE INDEX "idx_act_rev" ON "public"."reviews" USING btree (
  "activity_id" "pg_catalog"."int8_ops" ASC NULLS LAST,
  "reviewer_id" "pg_catalog"."int8_ops" ASC NULLS LAST,
  "reviewee_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);
CREATE INDEX "idx_reviews_reviewee_id" ON "public"."reviews" USING btree (
  "reviewee_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table reviews
-- ----------------------------
ALTER TABLE "public"."reviews" ADD CONSTRAINT "unique_reviewer_reviewee" UNIQUE ("activity_id", "reviewer_id", "reviewee_id");

-- ----------------------------
-- Primary Key structure for table reviews
-- ----------------------------
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table user_reputations
-- ----------------------------
CREATE UNIQUE INDEX "idx_user_reputations_user_id" ON "public"."user_reputations" USING btree (
  "user_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table user_reputations
-- ----------------------------
ALTER TABLE "public"."user_reputations" ADD CONSTRAINT "user_reputations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "idx_users_email" ON "public"."users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table activities
-- ----------------------------
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table activity_feed_cache
-- ----------------------------
ALTER TABLE "public"."activity_feed_cache" ADD CONSTRAINT "activity_feed_cache_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table applications
-- ----------------------------
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table chat_messages
-- ----------------------------
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table refresh_sessions
-- ----------------------------
ALTER TABLE "public"."refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table reports
-- ----------------------------
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table reviews
-- ----------------------------
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table user_reputations
-- ----------------------------
ALTER TABLE "public"."user_reputations" ADD CONSTRAINT "user_reputations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
