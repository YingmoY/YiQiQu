package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func handleCreateReview(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		RevieweeID uint   `json:"reviewee_id" binding:"required"`
		IsAttended bool   `json:"is_attended"`
		IsPunctual bool   `json:"is_punctual"`
		Score      int    `json:"score" binding:"required,min=1,max=5"`
		Comment    string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "评分必须在 1-5 之间且参数完整"})
		return
	}
	var activity Activity
	if err := db.First(&activity, actID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "活动不存在"})
		return
	}
	if activity.Status != "已完成" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "活动尚未结束，无法进行互评"})
		return
	}
	if !canAccessActivityChat(activity.ID, req.RevieweeID) || !canAccessActivityChat(activity.ID, userID.(uint)) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "评价双方必须属于该活动"})
		return
	}
	if req.RevieweeID == userID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "不能评价自己"})
		return
	}
	if strings.TrimSpace(req.Comment) != "" {
		res, err := filterSensitiveText("review_comment", activity.ID, userID.(uint), req.Comment)
		if err == nil {
			if res.Rejected {
				c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "评价内容包含敏感词，请修改后提交", "matched_words": res.MatchedWords})
				return
			}
			req.Comment = res.CleanText
		}
	}
	review := Review{ActivityID: activity.ID, ReviewerID: userID.(uint), RevieweeID: req.RevieweeID, IsAttended: req.IsAttended, IsPunctual: req.IsPunctual, Score: req.Score, Comment: req.Comment}
	if err := db.Create(&review).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "您已评价过此用户，请勿重复评价"})
		return
	}
	recalculateReputation(req.RevieweeID)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "评价提交成功"})
}

func handleGetMyActivityReviews(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	var reviews []Review
	db.Where("activity_id = ? AND reviewer_id = ?", actID, userID).Order("id DESC").Find(&reviews)
	items := []gin.H{}
	for _, review := range reviews {
		var reviewee User
		db.First(&reviewee, review.RevieweeID)
		hydrateUser(&reviewee)
		items = append(items, gin.H{"review": review, "reviewee": reviewee})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": items})
}

func recalculateReputation(userID uint) {
	var reviews []Review
	db.Where("reviewee_id = ?", userID).Find(&reviews)
	if len(reviews) == 0 {
		return
	}
	attended, punctual, totalScore := 0, 0, 0
	for _, r := range reviews {
		if r.IsAttended {
			attended++
		}
		if r.IsPunctual {
			punctual++
		}
		totalScore += r.Score
	}
	total := len(reviews)
	attendanceRate := float64(attended) / float64(total) * 100
	punctualityRate := float64(punctual) / float64(total) * 100
	avgScore := float64(totalScore) / float64(total)
	reputationScore := 100 - (total-attended)*10 - (total-punctual)*3
	if avgScore < 4 {
		reputationScore -= int((4 - avgScore) * 5)
	}
	if reputationScore < 0 {
		reputationScore = 0
	}
	db.Model(&UserReputation{}).Where("user_id = ?", userID).Updates(UserReputation{ReputationScore: reputationScore, AttendanceRate: attendanceRate, PunctualityRate: punctualityRate})
}

func handleCreateReport(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		TargetType string `json:"target_type" binding:"required"`
		TargetID   uint   `json:"target_id" binding:"required"`
		Reason     string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "举报目标和原因为必填项"})
		return
	}
	if strings.TrimSpace(req.Reason) != "" {
		res, err := filterSensitiveText("report_reason", req.TargetID, userID.(uint), req.Reason)
		if err == nil {
			if res.Rejected {
				c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "举报原因包含敏感词，请修改后提交", "matched_words": res.MatchedWords})
				return
			}
			req.Reason = res.CleanText
		}
	}
	report := Report{ReporterID: userID.(uint), TargetType: req.TargetType, TargetID: req.TargetID, Reason: req.Reason, Status: "待处理"}
	if err := db.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "举报提交失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "举报已成功受理，我们将尽快核实处理"})
}

func handleGetLeaderboard(c *gin.Context) {
	school := c.Query("school")
	if school == "" {
		school = "复旦大学"
	}
	var snapshot LeaderboardSnapshot
	if err := db.Where("school = ? AND ranking_type = ?", school, "reputation").Order("id DESC").First(&snapshot).Error; err == nil {
		var data interface{}
		if json.Unmarshal([]byte(snapshot.RankData), &data) == nil {
			c.JSON(http.StatusOK, gin.H{"code": 200, "data": data})
			return
		}
	}
	var reps []UserReputation
	db.Order("reputation_score DESC").Limit(10).Find(&reps)
	list := []gin.H{}
	for i, rep := range reps {
		var u User
		if err := db.First(&u, rep.UserID).Error; err == nil && !u.IsBanned {
			list = append(list, gin.H{"rank": i + 1, "nickname": u.Nickname, "avatar_color": u.AvatarColor, "score": rep.ReputationScore, "major": u.Major, "mbti": u.MBTI})
		}
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": list})
}

func startCacheRefresher() {
	for {
		time.Sleep(5 * time.Minute)
		var acts []Activity
		db.Where("status = ?", "招募中").Find(&acts)
		for _, act := range acts {
			var creator User
			db.First(&creator, act.CreatorID)
			var rep UserReputation
			db.Where("user_id = ?", act.CreatorID).First(&rep)
			var joined int64
			db.Model(&Application{}).Where("activity_id = ? AND status = ?", act.ID, "已通过").Count(&joined)
			db.Save(&ActivityFeedCache{ActivityID: act.ID, CreatorNickname: creator.Nickname, CreatorAvatarColor: creator.AvatarColor, CreatorReputation: rep.ReputationScore, JoinedCount: int(joined) + 1, CachedAt: time.Now()})
		}
	}
}
