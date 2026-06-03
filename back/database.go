package main

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func initDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=postgres port=5432 sslmode=disable"
	}

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	err = db.AutoMigrate(
		&User{}, &UserReputation{}, &EmailCode{}, &RefreshSession{},
		&Activity{}, &Application{}, &ActivityInvitation{},
		&UserBlock{}, &MBTITestResult{}, &ChatMessage{}, &Review{}, &Report{},
		&SensitiveWord{}, &SensitiveWordHit{}, &LeaderboardSnapshot{}, &ActivityFeedCache{},
	)
	if err != nil {
		log.Fatalf("Failed to auto migrate tables: %v", err)
	}
	seedSensitiveWords()
	log.Println("Database connection and migration completed successfully.")
}
