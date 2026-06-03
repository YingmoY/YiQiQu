package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func handleSendCode(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "邮箱格式不正确"})
		return
	}
	if !strings.HasSuffix(req.Email, allowedEmail) {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": fmt.Sprintf("仅允许后缀为 %s 的高校学生邮箱注册", allowedEmail)})
		return
	}
	rand.Seed(time.Now().UnixNano())
	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	log.Printf("[DEMO CODE] 验证码发送至邮箱 %s: %s", req.Email, code)
	if err := db.Create(&EmailCode{Email: req.Email, Code: code, Purpose: "register", ExpiresAt: time.Now().Add(10 * time.Minute)}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "系统错误，生成验证码失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "验证码已成功发送（演示版验证码可查看控制台或输入 123456）", "data": gin.H{"demo_code": code}})
}

func handleRegister(c *gin.Context) {
	var req struct {
		Email        string   `json:"email" binding:"required,email"`
		Password     string   `json:"password" binding:"required,min=6"`
		Code         string   `json:"code" binding:"required"`
		Nickname     string   `json:"nickname" binding:"required"`
		School       string   `json:"school" binding:"required"`
		Major        string   `json:"major" binding:"required"`
		MBTI         string   `json:"mbti"`
		SocialEnergy int      `json:"social_energy"`
		Interests    []string `json:"interests"`
		Tags         []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数不符合规范或密码长度不足 6 位"})
		return
	}
	if req.Code != "123456" {
		var emailCode EmailCode
		if err := db.Where("email = ? AND code = ? AND purpose = ? AND is_used = ? AND expires_at > ?", req.Email, req.Code, "register", false, time.Now()).First(&emailCode).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "验证码无效或已过期"})
			return
		}
		db.Model(&emailCode).Update("is_used", true)
	}
	var existing User
	if err := db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "该邮箱已被注册"})
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
		return
	}
	if req.MBTI == "" {
		req.MBTI = "INFP"
	}
	if req.SocialEnergy <= 0 {
		req.SocialEnergy = 50
	}
	if len(req.Tags) == 0 {
		req.Tags = req.Interests
	}
	user := User{Email: req.Email, PasswordHash: string(hashedPassword), Nickname: req.Nickname, AvatarColor: getRandomAvatarColor(), School: req.School, Major: req.Major, MBTI: req.MBTI, MBTISource: "manual", SocialEnergy: req.SocialEnergy, Interests: toJSONString(req.Interests), Tags: toJSONString(req.Tags), Role: "user", LastActiveAt: time.Now()}
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "注册失败，请稍后重试"})
		return
	}
	db.Create(&UserReputation{UserID: user.ID, ReputationScore: 100, AttendanceRate: 100, PunctualityRate: 100})
	access, refresh, err := generateTokens(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "生成登录令牌失败"})
		return
	}
	hydrateUser(&user)
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": gin.H{"access_token": access, "refresh_token": refresh, "user": user}})
}

func handleLogin(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "邮箱或密码不能为空"})
		return
	}
	var user User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "邮箱或密码错误"})
		return
	}
	if user.IsBanned {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "账号已被管理员封禁"})
		return
	}
	access, refresh, err := generateTokens(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "生成令牌失败"})
		return
	}
	hydrateUser(&user)
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": gin.H{"access_token": access, "refresh_token": refresh, "user": user}})
}

func handleRefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "缺少刷新令牌"})
		return
	}
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) { return jwtSecret, nil })
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "刷新令牌已失效，请重新登录"})
		return
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "解析令牌失败"})
		return
	}
	userID := uint(claims["user_id"].(float64))
	hash := sha256.Sum256([]byte(req.RefreshToken))
	var session RefreshSession
	if err := db.Where("token_hash = ? AND is_revoked = ? AND expires_at > ?", hex.EncodeToString(hash[:]), false, time.Now()).First(&session).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "会话已过期或已被撤销"})
		return
	}
	var user User
	if err := db.First(&user, userID).Error; err != nil || user.IsBanned {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "用户不存在或已被封禁"})
		return
	}
	db.Model(&session).Update("is_revoked", true)
	access, refresh, err := generateTokens(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "刷新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": gin.H{"access_token": access, "refresh_token": refresh}})
}

func handleLogout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&req)
	if req.RefreshToken != "" {
		hash := sha256.Sum256([]byte(req.RefreshToken))
		db.Model(&RefreshSession{}).Where("token_hash = ?", hex.EncodeToString(hash[:])).Update("is_revoked", true)
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "已退出登录"})
}
