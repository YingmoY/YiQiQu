package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func handleGetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}
	hydrateUser(&user)
	var reputation UserReputation
	db.Where("user_id = ?", user.ID).First(&reputation)
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": gin.H{"user": user, "reputation": reputation}})
}

func handleUpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		Nickname     string   `json:"nickname"`
		AvatarColor  string   `json:"avatar_color"`
		School       string   `json:"school"`
		Major        string   `json:"major"`
		Bio          string   `json:"bio"`
		MBTI         string   `json:"mbti"`
		MBTISource   string   `json:"mbti_source"`
		SocialEnergy int      `json:"social_energy"`
		Interests    []string `json:"interests"`
		Tags         []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数格式错误"})
		return
	}
	var user User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}
	profileFields := map[string]*string{"profile_nickname": &req.Nickname, "profile_school": &req.School, "profile_major": &req.Major, "profile_bio": &req.Bio}
	for scene, value := range profileFields {
		if strings.TrimSpace(*value) == "" {
			continue
		}
		res, err := filterSensitiveText(scene, 0, userID.(uint), *value)
		if err == nil {
			if res.Rejected {
				c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "个人资料包含敏感词，请修改后保存", "matched_words": res.MatchedWords})
				return
			}
			*value = res.CleanText
		}
	}
	if len(req.Tags) > 0 {
		for i := range req.Tags {
			res, err := filterSensitiveText("profile_tag", 0, userID.(uint), req.Tags[i])
			if err == nil {
				if res.Rejected {
					c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "标签包含敏感词，请修改后保存", "matched_words": res.MatchedWords})
					return
				}
				req.Tags[i] = res.CleanText
			}
		}
	}
	if req.Nickname != "" {
		user.Nickname = req.Nickname
	}
	if req.AvatarColor != "" {
		user.AvatarColor = req.AvatarColor
	}
	if req.School != "" {
		user.School = req.School
	}
	if req.Major != "" {
		user.Major = req.Major
	}
	if req.Bio != "" {
		user.Bio = req.Bio
	}
	if req.MBTI != "" {
		user.MBTI = strings.ToUpper(req.MBTI)
	}
	if req.MBTISource != "" {
		user.MBTISource = req.MBTISource
	}
	if req.SocialEnergy > 0 {
		user.SocialEnergy = req.SocialEnergy
	}
	if req.Interests != nil {
		user.Interests = toJSONString(req.Interests)
	}
	if req.Tags != nil {
		user.Tags = toJSONString(req.Tags)
	}
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "个人资料更新失败"})
		return
	}
	hydrateUser(&user)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "个人资料更新成功", "data": user})
}

func handleGetOtherProfile(c *gin.Context) {
	targetID, _ := strconv.Atoi(c.Param("id"))
	userID, _ := c.Get("user_id")
	if isBlockedBetween(userID.(uint), uint(targetID)) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "你与该用户存在黑名单关系，无法查看资料"})
		return
	}
	var user User
	if err := db.First(&user, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}
	hydrateUser(&user)
	var reputation UserReputation
	db.Where("user_id = ?", targetID).First(&reputation)
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": gin.H{"user": user, "reputation": reputation}})
}

func handleGetBlacklist(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var blocks []UserBlock
	db.Where("blocker_id = ?", userID).Order("id DESC").Find(&blocks)
	type Item struct {
		UserBlock
		BlockedUser User `json:"blocked_user"`
	}
	list := []Item{}
	for _, block := range blocks {
		var u User
		if err := db.First(&u, block.BlockedID).Error; err == nil {
			hydrateUser(&u)
			list = append(list, Item{UserBlock: block, BlockedUser: u})
		}
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": list})
}

func handleBlockUser(c *gin.Context) {
	userID, _ := c.Get("user_id")
	targetID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)
	if targetID <= 0 || uint(targetID) == userID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "不能拉黑自己"})
		return
	}
	var target User
	if err := db.First(&target, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}
	if strings.TrimSpace(req.Reason) != "" {
		res, err := filterSensitiveText("block_reason", uint(targetID), userID.(uint), req.Reason)
		if err == nil {
			if res.Rejected {
				c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "拉黑原因包含敏感词，请修改后提交", "matched_words": res.MatchedWords})
				return
			}
			req.Reason = res.CleanText
		}
	}
	block := UserBlock{BlockerID: userID.(uint), BlockedID: uint(targetID), Reason: req.Reason}
	if err := db.Where("blocker_id = ? AND blocked_id = ?", userID, targetID).FirstOrCreate(&block).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "拉黑失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "已加入黑名单"})
}

func handleUnblockUser(c *gin.Context) {
	userID, _ := c.Get("user_id")
	targetID, _ := strconv.Atoi(c.Param("id"))
	db.Where("blocker_id = ? AND blocked_id = ?", userID, targetID).Delete(&UserBlock{})
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "已移出黑名单"})
}

func handleSubmitMBTITest(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		Answers []int `json:"answers" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || len(req.Answers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请提交测试答案"})
		return
	}
	axes := []int{0, 0, 0, 0}
	for i, answer := range req.Answers {
		if answer >= 0 {
			axes[i%4]++
		} else {
			axes[i%4]--
		}
	}
	result := ""
	if axes[0] >= 0 {
		result += "E"
	} else {
		result += "I"
	}
	if axes[1] >= 0 {
		result += "S"
	} else {
		result += "N"
	}
	if axes[2] >= 0 {
		result += "T"
	} else {
		result += "F"
	}
	if axes[3] >= 0 {
		result += "J"
	} else {
		result += "P"
	}
	answersJSON, _ := json.Marshal(req.Answers)
	db.Create(&MBTITestResult{UserID: userID.(uint), Answers: string(answersJSON), Result: result, CreatedAt: time.Now()})
	db.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{"mbti": result, "mbti_source": "test"})
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "MBTI 在线测试完成", "data": gin.H{"mbti": result}})
}

func isBlockedBetween(a, b uint) bool {
	var count int64
	db.Model(&UserBlock{}).Where("(blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)", a, b, b, a).Count(&count)
	return count > 0
}

func hasBlocked(blocker, blocked uint) bool {
	var block UserBlock
	return db.Where("blocker_id = ? AND blocked_id = ?", blocker, blocked).First(&block).Error == nil
}

func visibleUsersQuery() *gorm.DB {
	return db.Model(&User{}).Where("is_banned = ?", false)
}
