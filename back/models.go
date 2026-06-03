package main

import "time"

// User 用户模型
type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null;size:255" json:"email"`
	PasswordHash string    `gorm:"not null;size:255" json:"-"`
	Nickname     string    `gorm:"not null;size:50" json:"nickname"`
	AvatarColor  string    `gorm:"not null;default:'#FFDE4D';size:20" json:"avatar_color"`
	School       string    `gorm:"not null;size:100" json:"school"`
	Major        string    `gorm:"not null;size:100" json:"major"`
	Bio          string    `gorm:"size:255" json:"bio"`
	MBTI         string    `gorm:"not null;default:'INFP';size:10" json:"mbti"`
	MBTISource   string    `gorm:"not null;default:'manual';size:20" json:"mbti_source"`
	SocialEnergy int       `gorm:"not null;default:50" json:"social_energy"`
	Interests    string    `gorm:"type:text;default:'[]'" json:"-"`
	InterestsArr []string  `gorm:"-" json:"interests"`
	Tags         string    `gorm:"type:text;default:'[]'" json:"-"`
	TagsArr      []string  `gorm:"-" json:"tags"`
	Role         string    `gorm:"not null;default:'user';size:20" json:"role"`
	IsBanned     bool      `gorm:"not null;default:false" json:"is_banned"`
	LastActiveAt time.Time `json:"last_active_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserReputation 用户信誉模型
type UserReputation struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	UserID          uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	ReputationScore int       `gorm:"not null;default:100" json:"reputation_score"`
	TotalActivities int       `gorm:"not null;default:0" json:"total_activities"`
	AttendanceRate  float64   `gorm:"type:decimal(5,2);not null;default:100.00" json:"attendance_rate"`
	PunctualityRate float64   `gorm:"type:decimal(5,2);not null;default:100.00" json:"punctuality_rate"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// EmailCode 邮箱验证码模型
type EmailCode struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"not null;size:255" json:"email"`
	Code      string    `gorm:"not null;size:10" json:"code"`
	Purpose   string    `gorm:"not null;size:20" json:"purpose"`
	IsUsed    bool      `gorm:"not null;default:false" json:"is_used"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// RefreshSession 刷新令牌会话
type RefreshSession struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null" json:"user_id"`
	TokenHash  string    `gorm:"uniqueIndex;not null;size:255" json:"token_hash"`
	DeviceInfo string    `gorm:"size:255" json:"device_info"`
	IsRevoked  bool      `gorm:"not null;default:false" json:"is_revoked"`
	ExpiresAt  time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt  time.Time `json:"created_at"`
	LastUsedAt time.Time `json:"last_used_at"`
}

// Activity 活动模型
type Activity struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	CreatorID       uint      `gorm:"not null" json:"creator_id"`
	Title           string    `gorm:"not null;size:100" json:"title"`
	Category        string    `gorm:"not null;size:50" json:"category"`
	Location        string    `gorm:"not null;size:255" json:"location"`
	StartTime       time.Time `gorm:"not null" json:"start_time"`
	MaxParticipants int       `gorm:"not null;default:2" json:"max_participants"`
	Description     string    `gorm:"type:text" json:"description"`
	AutoApprove     bool      `gorm:"not null;default:false" json:"auto_approve"`
	Status          string    `gorm:"not null;default:'招募中';size:20" json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Application 报名申请模型
type Application struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ActivityID  uint      `gorm:"uniqueIndex:idx_act_app;not null" json:"activity_id"`
	ApplicantID uint      `gorm:"uniqueIndex:idx_act_app;not null" json:"applicant_id"`
	Message     string    `gorm:"size:255" json:"message"`
	Status      string    `gorm:"not null;default:'待审批';size:20" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ActivityInvitation 智能邀请记录
type ActivityInvitation struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ActivityID uint      `gorm:"uniqueIndex:idx_act_invite;not null" json:"activity_id"`
	InviterID  uint      `gorm:"not null" json:"inviter_id"`
	InviteeID  uint      `gorm:"uniqueIndex:idx_act_invite;not null" json:"invitee_id"`
	Score      float64   `gorm:"type:decimal(8,2);not null;default:0" json:"score"`
	Reasons    string    `gorm:"type:text;default:'[]'" json:"-"`
	ReasonsArr []string  `gorm:"-" json:"reasons"`
	Message    string    `gorm:"type:text" json:"message"`
	Status     string    `gorm:"not null;default:'已生成';size:20" json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// UserBlock 黑名单关系
type UserBlock struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	BlockerID uint      `gorm:"uniqueIndex:idx_block_pair;not null" json:"blocker_id"`
	BlockedID uint      `gorm:"uniqueIndex:idx_block_pair;not null" json:"blocked_id"`
	Reason    string    `gorm:"size:255" json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}

// MBTITestResult 在线测试结果
type MBTITestResult struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	Answers   string    `gorm:"type:text;not null" json:"-"`
	Result    string    `gorm:"not null;size:10" json:"result"`
	CreatedAt time.Time `json:"created_at"`
}

// ChatMessage 聊天记录模型
type ChatMessage struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ActivityID  uint      `gorm:"not null" json:"activity_id"`
	SenderID    uint      `gorm:"not null" json:"sender_id"`
	MessageType string    `gorm:"not null;default:'text';size:20" json:"message_type"`
	Content     string    `gorm:"type:text;not null" json:"content"`
	CreatedAt   time.Time `json:"created_at"`
}

// Review 评价模型
type Review struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ActivityID uint      `gorm:"uniqueIndex:idx_act_rev;not null" json:"activity_id"`
	ReviewerID uint      `gorm:"uniqueIndex:idx_act_rev;not null" json:"reviewer_id"`
	RevieweeID uint      `gorm:"uniqueIndex:idx_act_rev;not null" json:"reviewee_id"`
	IsAttended bool      `gorm:"not null;default:true" json:"is_attended"`
	IsPunctual bool      `gorm:"not null;default:true" json:"is_punctual"`
	Score      int       `gorm:"not null;default:5" json:"score"`
	Comment    string    `gorm:"size:255" json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}

// Report 举报模型
type Report struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ReporterID uint      `gorm:"not null" json:"reporter_id"`
	TargetType string    `gorm:"not null;size:20" json:"target_type"`
	TargetID   uint      `gorm:"not null" json:"target_id"`
	Reason     string    `gorm:"not null;size:255" json:"reason"`
	Status     string    `gorm:"not null;default:'待处理';size:20" json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// SensitiveWord 敏感词词库
// Action 支持 mask（替换）或 reject（拒绝提交）
type SensitiveWord struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Word      string    `gorm:"uniqueIndex;not null;size:100" json:"word"`
	Category  string    `gorm:"not null;default:'通用';size:50" json:"category"`
	Action    string    `gorm:"not null;default:'mask';size:20" json:"action"`
	IsEnabled bool      `gorm:"not null;default:true" json:"is_enabled"`
	HitCount  int       `gorm:"not null;default:0" json:"hit_count"`
	CreatedBy uint      `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SensitiveWordHit 敏感词命中日志
type SensitiveWordHit struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	UserID          uint      `gorm:"index" json:"user_id"`
	Scene           string    `gorm:"not null;size:50" json:"scene"`
	TargetID        uint      `json:"target_id"`
	OriginalContent string    `gorm:"type:text" json:"original_content"`
	FilteredContent string    `gorm:"type:text" json:"filtered_content"`
	MatchedWords    string    `gorm:"type:text;default:'[]'" json:"-"`
	MatchedWordsArr []string  `gorm:"-" json:"matched_words"`
	Action          string    `gorm:"not null;size:20" json:"action"`
	CreatedAt       time.Time `json:"created_at"`
}

// LeaderboardSnapshot 排行榜快照
type LeaderboardSnapshot struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	School      string    `gorm:"not null;size:100" json:"school"`
	RankingType string    `gorm:"not null;size:20" json:"ranking_type"`
	RankData    string    `gorm:"type:jsonb;not null" json:"rank_data"`
	CreatedAt   time.Time `json:"created_at"`
}

// ActivityFeedCache 热门活动广场缓存模型
type ActivityFeedCache struct {
	ActivityID         uint      `gorm:"primaryKey" json:"activity_id"`
	CreatorNickname    string    `gorm:"not null;size:50" json:"creator_nickname"`
	CreatorAvatarColor string    `gorm:"not null;size:20" json:"creator_avatar_color"`
	CreatorReputation  int       `gorm:"not null" json:"creator_reputation"`
	JoinedCount        int       `gorm:"not null;default:1" json:"joined_count"`
	CachedAt           time.Time `json:"cached_at"`
}
