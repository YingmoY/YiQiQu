package main

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"
)

type ActivityRecommendation struct {
	Score   float64  `json:"recommendation_score"`
	Reasons []string `json:"recommendation_reasons"`
}

type InviteeRecommendation struct {
	User       User           `json:"user"`
	Reputation UserReputation `json:"reputation"`
	Score      float64        `json:"score"`
	Reasons    []string       `json:"reasons"`
	Message    string         `json:"message"`
}

func scoreActivityForUser(activity Activity, viewer User, creator User, rep UserReputation, joinedCount int) ActivityRecommendation {
	reasons := []string{}
	score := 0.0
	if activity.Status == "招募中" {
		score += 35
		reasons = append(reasons, "仍在招募，报名成功率高")
	}
	if activity.Status == "进行中" {
		score += 10
	}
	creatorTags := append(parseJSONArray(creator.Interests), parseJSONArray(creator.Tags)...)
	viewerTags := append(parseJSONArray(viewer.Interests), parseJSONArray(viewer.Tags)...)
	if containsString(viewerTags, activity.Category) {
		score += 18
		reasons = append(reasons, "活动分类命中你的兴趣标签")
	}
	overlap := overlapCount(viewerTags, creatorTags)
	if overlap > 0 {
		score += float64(overlap) * 8
		reasons = append(reasons, fmt.Sprintf("与发起人有 %d 个共同标签", overlap))
	}
	if viewer.School == creator.School && viewer.School != "" {
		score += 10
		reasons = append(reasons, "同校同学更容易成局")
	}
	if viewer.Major == creator.Major && viewer.Major != "" {
		score += 6
		reasons = append(reasons, "专业背景相近")
	}
	energyDiff := absInt(viewer.SocialEnergy - creator.SocialEnergy)
	if energyDiff <= 20 {
		score += 8
		reasons = append(reasons, "社交能量匹配")
	}
	if isMBTICompatible(viewer.MBTI, creator.MBTI) {
		score += 8
		reasons = append(reasons, "MBTI 互动风格互补")
	}
	score += clampFloat(float64(rep.ReputationScore)/5, 0, 20)
	if rep.ReputationScore >= 90 {
		reasons = append(reasons, "发起人信誉优秀")
	}
	hoursUntil := time.Until(activity.StartTime).Hours()
	if hoursUntil > 0 && hoursUntil <= 72 {
		score += 10 - math.Abs(hoursUntil-24)/12
		reasons = append(reasons, "活动时间临近且可规划")
	}
	if joinedCount > 1 {
		score += clampFloat(float64(joinedCount)*2, 0, 10)
		reasons = append(reasons, "已有同伴加入，成局氛围更强")
	}
	if hasBlocked(viewer.ID, creator.ID) || hasBlocked(creator.ID, viewer.ID) {
		score = -1000
		reasons = []string{"已因黑名单关系过滤"}
	}
	if len(reasons) == 0 {
		reasons = append(reasons, "基于时间、信誉与活跃度排序")
	}
	return ActivityRecommendation{Score: math.Round(score*100) / 100, Reasons: reasons}
}

func recommendInvitees(activity Activity, limit int) []InviteeRecommendation {
	var creator User
	db.First(&creator, activity.CreatorID)
	hydrateUser(&creator)
	var users []User
	visibleUsersQuery().Where("id <> ?", activity.CreatorID).Find(&users)
	creatorTags := append(parseJSONArray(creator.Interests), parseJSONArray(creator.Tags)...)
	activityTokens := tokenizeActivity(activity)
	result := []InviteeRecommendation{}
	for _, u := range users {
		if isBlockedBetween(activity.CreatorID, u.ID) {
			continue
		}
		var existing Application
		if err := db.Where("activity_id = ? AND applicant_id = ?", activity.ID, u.ID).First(&existing).Error; err == nil {
			continue
		}
		hydrateUser(&u)
		var rep UserReputation
		db.Where("user_id = ?", u.ID).First(&rep)
		reasons := []string{}
		score := 0.0
		userTags := append(parseJSONArray(u.Interests), parseJSONArray(u.Tags)...)
		if containsString(userTags, activity.Category) {
			score += 25
			reasons = append(reasons, "兴趣标签匹配活动分类")
		}
		overlapWithActivity := overlapCount(userTags, activityTokens)
		if overlapWithActivity > 0 {
			score += float64(overlapWithActivity) * 10
			reasons = append(reasons, fmt.Sprintf("与活动内容命中 %d 个关键词", overlapWithActivity))
		}
		overlapWithCreator := overlapCount(userTags, creatorTags)
		if overlapWithCreator > 0 {
			score += float64(overlapWithCreator) * 6
			reasons = append(reasons, "与发起人兴趣相近")
		}
		if u.School == creator.School && u.School != "" {
			score += 10
			reasons = append(reasons, "同校更便于赴约")
		}
		if u.Major == creator.Major && u.Major != "" {
			score += 4
			reasons = append(reasons, "专业背景相近")
		}
		if absInt(u.SocialEnergy-creator.SocialEnergy) <= 20 {
			score += 8
			reasons = append(reasons, "社交节奏接近")
		}
		if isMBTICompatible(u.MBTI, creator.MBTI) {
			score += 8
			reasons = append(reasons, "MBTI 互动互补")
		}
		score += clampFloat(float64(rep.ReputationScore)/5, 0, 20)
		if rep.ReputationScore >= 90 {
			reasons = append(reasons, "信誉表现稳定")
		}
		if len(reasons) == 0 {
			reasons = append(reasons, "近期活跃用户，适合作为候选邀请对象")
		}
		message := buildInvitationMessage(activity, u, reasons)
		result = append(result, InviteeRecommendation{User: u, Reputation: rep, Score: math.Round(score*100) / 100, Reasons: reasons, Message: message})
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Score > result[j].Score })
	if limit <= 0 {
		limit = 10
	}
	if len(result) > limit {
		result = result[:limit]
	}
	return result
}

func tokenizeActivity(activity Activity) []string {
	text := strings.ToLower(activity.Title + " " + activity.Category + " " + activity.Location + " " + activity.Description)
	candidates := []string{"吃饭", "自习", "运动", "外出", "咖啡", "电影", "跑步", "羽毛球", "图书馆", "学习", "夜宵", "拍照", "展览", "citywalk", "桌游", "复习", "健身", "散步"}
	res := []string{activity.Category}
	for _, c := range candidates {
		if strings.Contains(text, strings.ToLower(c)) {
			res = append(res, c)
		}
	}
	return res
}

func isMBTICompatible(a, b string) bool {
	a = strings.ToUpper(a)
	b = strings.ToUpper(b)
	if len(a) < 4 || len(b) < 4 {
		return false
	}
	matches := 0
	for i := 0; i < 4; i++ {
		if a[i] == b[i] {
			matches++
		}
	}
	return matches == 2 || matches == 3
}

func buildInvitationMessage(activity Activity, user User, reasons []string) string {
	mainReason := "兴趣与活动较匹配"
	if len(reasons) > 0 {
		mainReason = reasons[0]
	}
	return fmt.Sprintf("嗨 %s，我刚发布了《%s》，系统觉得你很适合参与：%s。一起加入这次邀约吧！", user.Nickname, activity.Title, mainReason)
}

func reasonsToJSON(reasons []string) string {
	b, _ := json.Marshal(reasons)
	return string(b)
}
