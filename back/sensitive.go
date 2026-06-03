package main

import (
	"strings"
	"unicode/utf8"

	"gorm.io/gorm"
)

type SensitiveFilterResult struct {
	CleanText    string   `json:"clean_text"`
	MatchedWords []string `json:"matched_words"`
	Action       string   `json:"action"`
	Rejected     bool     `json:"rejected"`
}

func filterSensitiveText(scene string, targetID uint, userID uint, text string) (SensitiveFilterResult, error) {
	result := SensitiveFilterResult{CleanText: text, MatchedWords: []string{}, Action: "pass", Rejected: false}
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return result, nil
	}

	var words []SensitiveWord
	if err := db.Where("is_enabled = ?", true).Order("length(word) DESC").Find(&words).Error; err != nil {
		return result, err
	}
	if len(words) == 0 {
		return result, nil
	}

	lowerText := strings.ToLower(text)
	cleanText := text
	seen := map[string]bool{}
	shouldReject := false
	for _, w := range words {
		word := strings.TrimSpace(w.Word)
		if word == "" {
			continue
		}
		if strings.Contains(lowerText, strings.ToLower(word)) {
			if !seen[word] {
				result.MatchedWords = append(result.MatchedWords, word)
				seen[word] = true
			}
			if w.Action == "reject" {
				shouldReject = true
			}
			mask := strings.Repeat("*", utf8.RuneCountInString(word))
			cleanText = replaceInsensitive(cleanText, word, mask)
			db.Model(&SensitiveWord{}).Where("id = ?", w.ID).UpdateColumn("hit_count", gorm.Expr("hit_count + 1"))
		}
	}

	if len(result.MatchedWords) == 0 {
		return result, nil
	}
	result.CleanText = cleanText
	result.Rejected = shouldReject
	if shouldReject {
		result.Action = "reject"
	} else {
		result.Action = "mask"
	}
	logSensitiveHit(scene, targetID, userID, text, cleanText, result.MatchedWords, result.Action)
	return result, nil
}

func rejectIfSensitive(caller func(int, interface{}), scene string, targetID uint, userID uint, content *string) bool {
	res, err := filterSensitiveText(scene, targetID, userID, *content)
	if err != nil {
		return false
	}
	if res.Rejected {
		caller(400, map[string]interface{}{"code": 400, "message": "内容包含敏感词，请修改后再提交", "matched_words": res.MatchedWords})
		return true
	}
	*content = res.CleanText
	return false
}

func logSensitiveHit(scene string, targetID uint, userID uint, original string, filtered string, words []string, action string) {
	hit := SensitiveWordHit{UserID: userID, Scene: scene, TargetID: targetID, OriginalContent: original, FilteredContent: filtered, MatchedWords: toJSONString(words), Action: action}
	_ = db.Create(&hit).Error
}

func hydrateSensitiveHit(hit *SensitiveWordHit) {
	hit.MatchedWordsArr = parseJSONArray(hit.MatchedWords)
}

func seedSensitiveWords() {
	defaults := []SensitiveWord{
		{Word: "诈骗", Category: "安全", Action: "reject", IsEnabled: true},
		{Word: "博彩", Category: "违法", Action: "reject", IsEnabled: true},
		{Word: "代考", Category: "校园违规", Action: "reject", IsEnabled: true},
		{Word: "辱骂", Category: "不友善", Action: "mask", IsEnabled: true},
	}
	for _, item := range defaults {
		var existing SensitiveWord
		if err := db.Where("word = ?", item.Word).First(&existing).Error; err != nil {
			_ = db.Create(&item).Error
		}
	}
}

func replaceInsensitive(input, old, replacement string) string {
	if old == "" {
		return input
	}
	lowerInput := strings.ToLower(input)
	lowerOld := strings.ToLower(old)
	var builder strings.Builder
	start := 0
	for {
		idx := strings.Index(lowerInput[start:], lowerOld)
		if idx < 0 {
			builder.WriteString(input[start:])
			break
		}
		idx += start
		builder.WriteString(input[start:idx])
		builder.WriteString(replacement)
		start = idx + len(old)
	}
	return builder.String()
}
