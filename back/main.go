package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

var allowedEmail = "@fudan.edu.cn"

func main() {
	initDB()
	if envEmail := os.Getenv("ALLOWED_EMAIL_SUFFIX"); envEmail != "" {
		allowedEmail = envEmail
	}
	go startCacheRefresher()

	r := gin.Default()
	r.Use(corsMiddleware())
	registerRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
