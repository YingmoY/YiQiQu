package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"math"
	"math/rand"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("yiqiqu_demo_jwt_secret_key_2026")

func generateTokens(user *User) (string, string, error) {
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID, "role": user.Role, "exp": time.Now().Add(2 * time.Hour).Unix(),
	})
	accessStr, err := accessToken.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID, "exp": time.Now().Add(30 * 24 * time.Hour).Unix(),
	})
	refreshStr, err := refreshToken.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}
	hash := sha256.Sum256([]byte(refreshStr))
	session := RefreshSession{UserID: user.ID, TokenHash: hex.EncodeToString(hash[:]), ExpiresAt: time.Now().Add(30 * 24 * time.Hour), LastUsedAt: time.Now()}
	if err := db.Create(&session).Error; err != nil {
		return "", "", err
	}
	return accessStr, refreshStr, nil
}

func getRandomAvatarColor() string {
	colors := []string{"#FFDE4D", "#FF5F5F", "#4D96FF", "#6BCB77", "#FF6B6B", "#B983FF"}
	rand.Seed(time.Now().UnixNano())
	return colors[rand.Intn(len(colors))]
}

func parseJSONArray(raw string) []string {
	if raw == "" {
		return []string{}
	}
	var arr []string
	if err := json.Unmarshal([]byte(raw), &arr); err != nil {
		return []string{}
	}
	return arr
}

func toJSONString(arr []string) string {
	if arr == nil {
		arr = []string{}
	}
	b, _ := json.Marshal(arr)
	return string(b)
}

func hydrateUser(user *User) {
	user.InterestsArr = parseJSONArray(user.Interests)
	user.TagsArr = parseJSONArray(user.Tags)
}

func hydrateInvitation(inv *ActivityInvitation) {
	inv.ReasonsArr = parseJSONArray(inv.Reasons)
}

func containsString(arr []string, target string) bool {
	target = strings.TrimSpace(strings.ToLower(target))
	if target == "" {
		return false
	}
	for _, item := range arr {
		if strings.TrimSpace(strings.ToLower(item)) == target {
			return true
		}
	}
	return false
}

func overlapCount(a, b []string) int {
	count := 0
	seen := map[string]bool{}
	for _, x := range a {
		key := strings.TrimSpace(strings.ToLower(x))
		if key != "" {
			seen[key] = true
		}
	}
	for _, y := range b {
		key := strings.TrimSpace(strings.ToLower(y))
		if key != "" && seen[key] {
			count++
		}
	}
	return count
}

func absInt(v int) int {
	if v < 0 {
		return -v
	}
	return v
}
func clampFloat(v, min, max float64) float64 { return math.Max(min, math.Min(max, v)) }
