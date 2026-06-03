package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func handleGetChatMessages(c *gin.Context) {
	userID, _ := c.Get("user_id")
	actID, _ := strconv.Atoi(c.Param("id"))
	lastIDStr := c.Query("last_id")
	if !canAccessActivityChat(uint(actID), userID.(uint)) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "未加入该活动队伍，无权查看聊天"})
		return
	}
	query := db.Where("activity_id = ?", actID)
	if lastIDStr != "" {
		lastID, _ := strconv.Atoi(lastIDStr)
		query = query.Where("id < ?", lastID)
	}
	var messages []ChatMessage
	if err := query.Order("id DESC").Limit(50).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "获取聊天记录失败"})
		return
	}
	ordered := make([]gin.H, 0, len(messages))
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		if msg.SenderID != userID.(uint) && isBlockedBetween(userID.(uint), msg.SenderID) {
			continue
		}
		var sender User
		db.First(&sender, msg.SenderID)
		ordered = append(ordered, gin.H{"id": msg.ID, "activity_id": msg.ActivityID, "sender_id": msg.SenderID, "sender_nickname": sender.Nickname, "sender_avatar_color": sender.AvatarColor, "message_type": msg.MessageType, "content": msg.Content, "created_at": msg.CreatedAt})
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "data": ordered})
}

func handleReportChatMessage(c *gin.Context) {
	userID, _ := c.Get("user_id")
	msgID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "举报原因必填"})
		return
	}
	if strings.TrimSpace(req.Reason) != "" {
		res, err := filterSensitiveText("chat_report_reason", uint(msgID), userID.(uint), req.Reason)
		if err == nil {
			if res.Rejected {
				c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "举报原因包含敏感词，请修改后提交", "matched_words": res.MatchedWords})
				return
			}
			req.Reason = res.CleanText
		}
	}
	var msg ChatMessage
	if err := db.First(&msg, msgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "消息不存在"})
		return
	}
	report := Report{ReporterID: userID.(uint), TargetType: "message", TargetID: uint(msgID), Reason: req.Reason, Status: "待处理"}
	if err := db.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "举报提交失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "聊天举报已提交"})
}

func handleBlockChatUser(c *gin.Context) { handleBlockUser(c) }

type Client struct {
	UserID uint
	Conn   *websocket.Conn
	Send   chan []byte
}
type Room struct {
	ActivityID uint
	Clients    map[uint]*Client
}
type MessageHub struct {
	Rooms      map[uint]*Room
	Register   chan *ClientJoin
	Unregister chan *Client
	Broadcast  chan *BroadcastMessage
	mu         sync.Mutex
}
type ClientJoin struct {
	Client     *Client
	ActivityID uint
}
type BroadcastMessage struct {
	ActivityID  uint
	SenderID    uint
	MessageType string
	Content     string
}

var hub = MessageHub{Rooms: make(map[uint]*Room), Register: make(chan *ClientJoin), Unregister: make(chan *Client), Broadcast: make(chan *BroadcastMessage)}

func init() { go hub.run() }

func (h *MessageHub) run() {
	for {
		select {
		case join := <-h.Register:
			h.mu.Lock()
			room, exists := h.Rooms[join.ActivityID]
			if !exists {
				room = &Room{ActivityID: join.ActivityID, Clients: make(map[uint]*Client)}
				h.Rooms[join.ActivityID] = room
			}
			room.Clients[join.Client.UserID] = join.Client
			h.mu.Unlock()
		case client := <-h.Unregister:
			h.mu.Lock()
			for actID, room := range h.Rooms {
				if _, exists := room.Clients[client.UserID]; exists {
					delete(room.Clients, client.UserID)
					close(client.Send)
					if len(room.Clients) == 0 {
						delete(h.Rooms, actID)
					}
					break
				}
			}
			h.mu.Unlock()
		case bMsg := <-h.Broadcast:
			h.mu.Lock()
			room, exists := h.Rooms[bMsg.ActivityID]
			if exists {
				var sender User
				db.First(&sender, bMsg.SenderID)
				payload, _ := json.Marshal(gin.H{"activity_id": bMsg.ActivityID, "sender_id": bMsg.SenderID, "sender_nickname": sender.Nickname, "sender_avatar_color": sender.AvatarColor, "message_type": bMsg.MessageType, "content": bMsg.Content, "created_at": time.Now()})
				for _, client := range room.Clients {
					if bMsg.SenderID != client.UserID && isBlockedBetween(client.UserID, bMsg.SenderID) {
						continue
					}
					select {
					case client.Send <- payload:
					default:
						close(client.Send)
						delete(room.Clients, client.UserID)
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

var upgrader = websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024, CheckOrigin: func(r *http.Request) bool { return true }}

func handleWebSocket(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uint)
	actID, _ := strconv.Atoi(c.Param("id"))
	if !canAccessActivityChat(uint(actID), userID) {
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "未加入该活动队伍，无权进入聊天室"})
		return
	}
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	client := &Client{UserID: userID, Conn: conn, Send: make(chan []byte, 256)}
	hub.Register <- &ClientJoin{Client: client, ActivityID: uint(actID)}
	go client.writePump()
	go client.readPump(uint(actID))
}

func (c *Client) readPump(actID uint) {
	defer func() { hub.Unregister <- c; c.Conn.Close() }()
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		var payload struct {
			MessageType string `json:"message_type"`
			Content     string `json:"content"`
		}
		if err := json.Unmarshal(message, &payload); err != nil {
			continue
		}
		if strings.TrimSpace(payload.Content) == "" {
			continue
		}
		if payload.MessageType == "" {
			payload.MessageType = "text"
		}
		res, err := filterSensitiveText("chat_message", actID, c.UserID, payload.Content)
		if err == nil {
			if res.Rejected {
				notice, _ := json.Marshal(gin.H{"message_type": "system", "content": "消息包含敏感词，未发送成功", "created_at": time.Now()})
				select {
				case c.Send <- notice:
				default:
				}
				continue
			}
			payload.Content = res.CleanText
		}
		msg := ChatMessage{ActivityID: actID, SenderID: c.UserID, MessageType: payload.MessageType, Content: payload.Content}
		db.Create(&msg)
		hub.Broadcast <- &BroadcastMessage{ActivityID: actID, SenderID: c.UserID, MessageType: payload.MessageType, Content: payload.Content}
	}
}

func (c *Client) writePump() {
	defer func() { c.Conn.Close() }()
	for message := range c.Send {
		_ = c.Conn.WriteMessage(websocket.TextMessage, message)
	}
}

func broadcastToRoom(actID uint, msgType, content string, senderID uint) {
	hub.Broadcast <- &BroadcastMessage{ActivityID: actID, SenderID: senderID, MessageType: msgType, Content: content}
}

func canAccessActivityChat(actID, userID uint) bool {
	var activity Activity
	if err := db.First(&activity, actID).Error; err != nil {
		return false
	}
	if activity.CreatorID == userID {
		return true
	}
	var app Application
	return db.Where("activity_id = ? AND applicant_id = ? AND status = ?", actID, userID, "已通过").First(&app).Error == nil
}
