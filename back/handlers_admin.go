package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func handleAdminStats(c *gin.Context) {
	var userCount, bannedCount, activityCount, activeActivityCount, reportPendingCount, messageCount, invitationCount int64
	db.Model(&User{}).Count(&userCount)
	db.Model(&User{}).Where("is_banned = ?", true).Count(&bannedCount)
	db.Model(&Activity{}).Count(&activityCount)
	db.Model(&Activity{}).Where("status = ?", "招募中").Count(&activeActivityCount)
	db.Model(&Report{}).Where("status = ?", "待处理").Count(&reportPendingCount)
	db.Model(&ChatMessage{}).Count(&messageCount)
	db.Model(&ActivityInvitation{}).Count(&invitationCount)

	categories := []struct {
		Category string
		Count    int64
	}{}
	db.Model(&Activity{}).Select("category, count(*) as count").Group("category").Scan(&categories)
	trend := []gin.H{}
	for i := 6; i >= 0; i-- {
		day := time.Now().AddDate(0, 0, -i)
		start := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, day.Location())
		end := start.Add(24 * time.Hour)
		var count int64
		db.Model(&Activity{}).Where("created_at >= ? AND created_at < ?", start, end).Count(&count)
		trend = append(trend, gin.H{"date": start.Format("01-02"), "count": count})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": gin.H{"users": userCount, "banned_users": bannedCount, "activities": activityCount, "active_activities": activeActivityCount, "pending_reports": reportPendingCount, "messages": messageCount, "invitations": invitationCount, "category_distribution": categories, "activity_trend": trend}})
}

func handleAdminGetUsers(c *gin.Context) {
	keyword := c.Query("keyword")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "30"))
	if page < 1 {
		page = 1
	}
	query := db.Model(&User{})
	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("nickname ILIKE ? OR email ILIKE ? OR school ILIKE ? OR major ILIKE ?", like, like, like, like)
	}
	var total int64
	query.Count(&total)
	var users []User
	query.Order("id DESC").Offset((page - 1) * limit).Limit(limit).Find(&users)
	items := []gin.H{}
	for _, u := range users {
		hydrateUser(&u)
		var rep UserReputation
		db.Where("user_id = ?", u.ID).First(&rep)
		items = append(items, gin.H{"user": u, "reputation": rep})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": items, "total": total})
}

func handleAdminBanUser(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Banned *bool `json:"banned"`
	}
	_ = c.ShouldBindJSON(&req)
	banned := true
	if req.Banned != nil {
		banned = *req.Banned
	}
	if err := db.Model(&User{}).Where("id = ?", id).Update("is_banned", banned).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "用户状态更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "用户状态已更新"})
}

func handleAdminUpdateUserStatus(c *gin.Context) { handleAdminBanUser(c) }

func handleAdminGetActivities(c *gin.Context) {
	keyword := c.Query("keyword")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "30"))
	query := db.Model(&Activity{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("title ILIKE ? OR category ILIKE ? OR location ILIKE ?", like, like, like)
	}
	var total int64
	query.Count(&total)
	var acts []Activity
	query.Order("id DESC").Offset((page - 1) * limit).Limit(limit).Find(&acts)
	items := []gin.H{}
	for _, act := range acts {
		var creator User
		db.First(&creator, act.CreatorID)
		var apps int64
		db.Model(&Application{}).Where("activity_id = ?", act.ID).Count(&apps)
		items = append(items, gin.H{"activity": act, "creator": creator, "applications": apps})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": items, "total": total})
}

func handleAdminUpdateActivityStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "缺少活动状态"})
		return
	}
	if err := db.Model(&Activity{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "活动状态更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "活动状态已更新"})
}

func handleAdminDeleteActivity(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	db.Delete(&Activity{}, id)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "活动已删除"})
}

func handleAdminGetReports(c *gin.Context) {
	status := c.Query("status")
	query := db.Model(&Report{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	var reports []Report
	query.Order("id DESC").Limit(100).Find(&reports)
	items := []gin.H{}
	for _, report := range reports {
		var reporter User
		db.First(&reporter, report.ReporterID)
		items = append(items, gin.H{"report": report, "reporter": reporter, "target": loadReportTarget(report)})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": items})
}

func handleAdminResolveReport(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Status string `json:"status"`
		Action string `json:"action"`
		Note   string `json:"note"`
	}
	_ = c.ShouldBindJSON(&req)
	if req.Status == "" {
		req.Status = "已处理"
	}
	var report Report
	if err := db.First(&report, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "举报不存在"})
		return
	}
	if req.Action == "ban_user" {
		if report.TargetType == "user" {
			db.Model(&User{}).Where("id = ?", report.TargetID).Update("is_banned", true)
		}
		if report.TargetType == "message" {
			var msg ChatMessage
			if err := db.First(&msg, report.TargetID).Error; err == nil {
				db.Model(&User{}).Where("id = ?", msg.SenderID).Update("is_banned", true)
			}
		}
	}
	if req.Action == "close_activity" && report.TargetType == "activity" {
		db.Model(&Activity{}).Where("id = ?", report.TargetID).Update("status", "已取消")
	}
	db.Model(&report).Updates(map[string]interface{}{"status": req.Status, "updated_at": time.Now()})
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "举报处理完成"})
}

func loadReportTarget(report Report) interface{} {
	switch report.TargetType {
	case "user":
		var u User
		db.First(&u, report.TargetID)
		hydrateUser(&u)
		return u
	case "activity":
		var a Activity
		db.First(&a, report.TargetID)
		return a
	case "message":
		var m ChatMessage
		db.First(&m, report.TargetID)
		return m
	default:
		return gin.H{"id": report.TargetID, "type": report.TargetType}
	}
}

func handleAdminGetSensitiveWords(c *gin.Context) {
	keyword := strings.TrimSpace(c.Query("keyword"))
	category := strings.TrimSpace(c.Query("category"))
	query := db.Model(&SensitiveWord{})
	if keyword != "" {
		query = query.Where("word ILIKE ?", "%"+keyword+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	var words []SensitiveWord
	query.Order("id DESC").Find(&words)
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": words})
}

func handleAdminCreateSensitiveWord(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		Word      string `json:"word" binding:"required"`
		Category  string `json:"category"`
		Action    string `json:"action"`
		IsEnabled *bool  `json:"is_enabled"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "敏感词不能为空"})
		return
	}
	word := strings.TrimSpace(req.Word)
	if word == "" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "敏感词不能为空"})
		return
	}
	category := strings.TrimSpace(req.Category)
	if category == "" {
		category = "通用"
	}
	action := strings.TrimSpace(req.Action)
	if action != "reject" {
		action = "mask"
	}
	enabled := true
	if req.IsEnabled != nil {
		enabled = *req.IsEnabled
	}
	item := SensitiveWord{Word: word, Category: category, Action: action, IsEnabled: enabled, CreatedBy: userID.(uint)}
	if err := db.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "敏感词已存在或保存失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "敏感词已新增", "data": item})
}

func handleAdminUpdateSensitiveWord(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Word      string `json:"word"`
		Category  string `json:"category"`
		Action    string `json:"action"`
		IsEnabled *bool  `json:"is_enabled"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数格式错误"})
		return
	}
	var item SensitiveWord
	if err := db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "敏感词不存在"})
		return
	}
	if strings.TrimSpace(req.Word) != "" {
		item.Word = strings.TrimSpace(req.Word)
	}
	if strings.TrimSpace(req.Category) != "" {
		item.Category = strings.TrimSpace(req.Category)
	}
	if req.Action == "reject" {
		item.Action = "reject"
	} else if req.Action == "mask" {
		item.Action = "mask"
	}
	if req.IsEnabled != nil {
		item.IsEnabled = *req.IsEnabled
	}
	if err := db.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "敏感词更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "敏感词已更新", "data": item})
}

func handleAdminDeleteSensitiveWord(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	db.Delete(&SensitiveWord{}, id)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "敏感词已删除"})
}

func handleAdminGetSensitiveHits(c *gin.Context) {
	query := db.Model(&SensitiveWordHit{})
	if scene := strings.TrimSpace(c.Query("scene")); scene != "" {
		query = query.Where("scene = ?", scene)
	}
	var hits []SensitiveWordHit
	query.Order("id DESC").Limit(100).Find(&hits)
	items := []gin.H{}
	for _, hit := range hits {
		hydrateSensitiveHit(&hit)
		var user User
		db.First(&user, hit.UserID)
		items = append(items, gin.H{"hit": hit, "user": user})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": items})
}

func handleAdminCheckSensitiveText(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "检测内容不能为空"})
		return
	}
	res, err := filterSensitiveText("admin_check", 0, userID.(uint), req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "敏感词检测失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": res})
}
