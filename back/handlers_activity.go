package main

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ActivityRespItem struct {
	Activity
	CreatorNickname       string   `json:"creator_nickname"`
	CreatorAvatarColor    string   `json:"creator_avatar_color"`
	CreatorReputation     int      `json:"creator_reputation"`
	JoinedCount           int      `json:"joined_count"`
	RecommendationScore   float64  `json:"recommendation_score"`
	RecommendationReasons []string `json:"recommendation_reasons"`
}

func handleGetActivities(c *gin.Context) {
	userID, _ := c.Get("user_id")
	category := c.Query("category")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	var viewer User
	db.First(&viewer, userID)
	hydrateUser(&viewer)
	var acts []Activity
	query := db.Model(&Activity{})
	if category != "" && category != "全部" {
		query = query.Where("category = ?", category)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("created_at DESC").Find(&acts)
	respList := []ActivityRespItem{}
	for _, act := range acts {
		var creator User
		if err := db.First(&creator, act.CreatorID).Error; err != nil || creator.IsBanned {
			continue
		}
		if isBlockedBetween(viewer.ID, creator.ID) {
			continue
		}
		var rep UserReputation
		db.Where("user_id = ?", act.CreatorID).First(&rep)
		var joined int64
		db.Model(&Application{}).Where("activity_id = ? AND status = ?", act.ID, "已通过").Count(&joined)
		rec := scoreActivityForUser(act, viewer, creator, rep, int(joined)+1)
		respList = append(respList, ActivityRespItem{Activity: act, CreatorNickname: creator.Nickname, CreatorAvatarColor: creator.AvatarColor, CreatorReputation: rep.ReputationScore, JoinedCount: int(joined) + 1, RecommendationScore: rec.Score, RecommendationReasons: rec.Reasons})
	}
	sort.Slice(respList, func(i, j int) bool { return respList[i].RecommendationScore > respList[j].RecommendationScore })
	total := len(respList)
	start := (page - 1) * limit
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": respList[start:end], "total": total})
}

func handleCreateActivity(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		Title           string    `json:"title" binding:"required,max=100"`
		Category        string    `json:"category" binding:"required"`
		Location        string    `json:"location" binding:"required"`
		StartTime       time.Time `json:"start_time" binding:"required"`
		MaxParticipants int       `json:"max_participants" binding:"required,min=2,max=10"`
		Description     string    `json:"description"`
		AutoApprove     bool      `json:"auto_approve"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数验证不通过，请检查最大人数和必填项"})
		return
	}
	fields := map[string]*string{"activity_title": &req.Title, "activity_location": &req.Location, "activity_description": &req.Description}
	for scene, value := range fields {
		if strings.TrimSpace(*value) == "" {
			continue
		}
		res, err := filterSensitiveText(scene, 0, userID.(uint), *value)
		if err == nil {
			if res.Rejected {
				c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "活动内容包含敏感词，请修改后发布", "matched_words": res.MatchedWords})
				return
			}
			*value = res.CleanText
		}
	}
	activity := Activity{CreatorID: userID.(uint), Title: req.Title, Category: req.Category, Location: req.Location, StartTime: req.StartTime, MaxParticipants: req.MaxParticipants, Description: req.Description, AutoApprove: req.AutoApprove, Status: "招募中"}
	if err := db.Create(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "发布邀约失败"})
		return
	}
	db.Model(&UserReputation{}).Where("user_id = ?", userID).UpdateColumn("total_activities", gorm.Expr("total_activities + 1"))
	recommended := recommendInvitees(activity, 6)
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": gin.H{"activity": activity, "recommended_invitees": recommended}})
}

func handleGetActivityDetail(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	var activity Activity
	if err := db.First(&activity, actID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "活动不存在"})
		return
	}
	var creator User
	db.First(&creator, activity.CreatorID)
	hydrateUser(&creator)
	var rep UserReputation
	db.Where("user_id = ?", activity.CreatorID).First(&rep)
	var apps []Application
	db.Where("activity_id = ? AND status = ?", activity.ID, "已通过").Find(&apps)
	participants := []User{}
	for _, app := range apps {
		var member User
		if err := db.First(&member, app.ApplicantID).Error; err == nil {
			hydrateUser(&member)
			participants = append(participants, member)
		}
	}
	appStatus := "未申请"
	var myApp Application
	if err := db.Where("activity_id = ? AND applicant_id = ?", activity.ID, userID).First(&myApp).Error; err == nil {
		appStatus = myApp.Status
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": gin.H{"activity": activity, "creator": creator, "reputation": rep, "participants": participants, "application_status": appStatus}})
}

func handleUpdateActivityStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "缺少状态参数"})
		return
	}
	var activity Activity
	if err := db.First(&activity, actID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "活动不存在"})
		return
	}
	if activity.CreatorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "无权操作此活动，仅发起人可修改状态"})
		return
	}
	activity.Status = req.Status
	db.Save(&activity)
	systemMsg := fmt.Sprintf("活动状态变更为 [%s]", req.Status)
	db.Create(&ChatMessage{ActivityID: activity.ID, SenderID: 1, MessageType: "system", Content: systemMsg})
	broadcastToRoom(activity.ID, "system", systemMsg, 1)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "活动状态更新成功", "status": activity.Status})
}

func handleApplyActivity(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Message string `json:"message"`
	}
	_ = c.ShouldBindJSON(&req)
	var activity Activity
	if err := db.First(&activity, actID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "活动不存在"})
		return
	}
	if activity.Status != "招募中" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "该活动已截止招募"})
		return
	}
	if strings.TrimSpace(req.Message) != "" {
		res, err := filterSensitiveText("application_message", activity.ID, userID.(uint), req.Message)
		if err == nil {
			if res.Rejected {
				c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "报名留言包含敏感词，请修改后提交", "matched_words": res.MatchedWords})
				return
			}
			req.Message = res.CleanText
		}
	}
	if activity.CreatorID == userID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "发起人无需报名自己创建的活动"})
		return
	}
	if isBlockedBetween(activity.CreatorID, userID.(uint)) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "你与发起人存在黑名单关系，无法报名"})
		return
	}
	var existing Application
	if err := db.Where("activity_id = ? AND applicant_id = ?", activity.ID, userID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "您已提交过报名申请，请勿重复操作"})
		return
	}
	status := "待审批"
	if activity.AutoApprove {
		status = "已通过"
	}
	application := Application{ActivityID: activity.ID, ApplicantID: userID.(uint), Message: req.Message, Status: status}
	if err := db.Create(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "报名申请提交失败"})
		return
	}
	if status == "已通过" {
		afterApplicationApproved(activity, userID.(uint))
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "报名申请处理成功", "status": status})
}

func handleGetApplications(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	var activity Activity
	if err := db.First(&activity, actID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "活动不存在"})
		return
	}
	if activity.CreatorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "无权查看此申请列表"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": buildApplicationItems(activity.ID)})
}

func handleApproveApplication(c *gin.Context) {
	userID, _ := c.Get("user_id")
	appID, _ := strconv.Atoi(c.Param("appId"))
	var app Application
	if err := db.First(&app, appID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "申请记录不存在"})
		return
	}
	var activity Activity
	db.First(&activity, app.ActivityID)
	if activity.CreatorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "无权操作，仅发起人可审批"})
		return
	}
	if app.Status != "待审批" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "该申请已被处理"})
		return
	}
	app.Status = "已通过"
	db.Save(&app)
	afterApplicationApproved(activity, app.ApplicantID)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "审批通过成功"})
}

func handleRejectApplication(c *gin.Context) {
	userID, _ := c.Get("user_id")
	appID, _ := strconv.Atoi(c.Param("appId"))
	var app Application
	if err := db.First(&app, appID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "申请记录不存在"})
		return
	}
	var activity Activity
	db.First(&activity, app.ActivityID)
	if activity.CreatorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "无权操作，仅发起人可审批"})
		return
	}
	if app.Status != "待审批" {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "该申请已被处理"})
		return
	}
	app.Status = "已拒绝"
	db.Save(&app)
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "已拒绝该申请"})
}

func handleGetRecommendedInvitees(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	var activity Activity
	if err := db.First(&activity, actID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "活动不存在"})
		return
	}
	if activity.CreatorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "仅发起人可查看推荐邀请对象"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": recommendInvitees(activity, limit)})
}

func handleGenerateInvitations(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		InviteeIDs []uint `json:"invitee_ids"`
		Limit      int    `json:"limit"`
	}
	_ = c.ShouldBindJSON(&req)
	var activity Activity
	if err := db.First(&activity, actID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "活动不存在"})
		return
	}
	if activity.CreatorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "仅发起人可生成邀请"})
		return
	}
	recs := recommendInvitees(activity, req.Limit)
	selected := map[uint]bool{}
	for _, id := range req.InviteeIDs {
		selected[id] = true
	}
	created := []ActivityInvitation{}
	for _, rec := range recs {
		if len(selected) > 0 && !selected[rec.User.ID] {
			continue
		}
		inv := ActivityInvitation{ActivityID: activity.ID, InviterID: userID.(uint), InviteeID: rec.User.ID, Score: rec.Score, Reasons: reasonsToJSON(rec.Reasons), Message: rec.Message, Status: "已生成"}
		if err := db.Where("activity_id = ? AND invitee_id = ?", activity.ID, rec.User.ID).FirstOrCreate(&inv).Error; err == nil {
			hydrateInvitation(&inv)
			created = append(created, inv)
		}
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "智能邀请已生成", "data": created})
}

func handleGetMyCreatedActivities(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var acts []Activity
	db.Where("creator_id = ?", userID).Order("id DESC").Find(&acts)
	items := []gin.H{}
	for _, act := range acts {
		items = append(items, gin.H{"activity": act, "applications": buildApplicationItems(act.ID)})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": items})
}

func handleGetMyAppliedActivities(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var apps []Application
	db.Where("applicant_id = ?", userID).Order("id DESC").Find(&apps)
	items := []gin.H{}
	for _, app := range apps {
		var act Activity
		if err := db.First(&act, app.ActivityID).Error; err == nil {
			items = append(items, gin.H{"application": app, "activity": act})
		}
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": items})
}

func handleGetMyInvitations(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var invs []ActivityInvitation
	db.Where("invitee_id = ? OR inviter_id = ?", userID, userID).Order("id DESC").Find(&invs)
	items := []gin.H{}
	for _, inv := range invs {
		hydrateInvitation(&inv)
		var act Activity
		db.First(&act, inv.ActivityID)
		items = append(items, gin.H{"invitation": inv, "activity": act})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": items})
}

func afterApplicationApproved(activity Activity, applicantID uint) {
	db.Model(&UserReputation{}).Where("user_id = ?", applicantID).UpdateColumn("total_activities", gorm.Expr("total_activities + 1"))
	var applicant User
	db.First(&applicant, applicantID)
	sysMsg := fmt.Sprintf("欢迎 %s 加入队伍！", applicant.Nickname)
	db.Create(&ChatMessage{ActivityID: activity.ID, SenderID: 1, MessageType: "system", Content: sysMsg})
	broadcastToRoom(activity.ID, "system", sysMsg, 1)
}

func buildApplicationItems(activityID uint) []gin.H {
	var apps []Application
	db.Where("activity_id = ?", activityID).Order("id DESC").Find(&apps)
	list := []gin.H{}
	for _, app := range apps {
		var user User
		db.First(&user, app.ApplicantID)
		hydrateUser(&user)
		var rep UserReputation
		db.Where("user_id = ?", app.ApplicantID).First(&rep)
		list = append(list, gin.H{"id": app.ID, "applicant": user, "reputation": rep, "message": app.Message, "status": app.Status, "created_at": app.CreatedAt})
	}
	return list
}
