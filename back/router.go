package main

import "github.com/gin-gonic/gin"

func registerRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		api.POST("/auth/send-code", handleSendCode)
		api.POST("/auth/register", handleRegister)
		api.POST("/auth/login", handleLogin)
		api.POST("/auth/refresh", handleRefreshToken)
		api.GET("/leaderboard", handleGetLeaderboard)

		authorized := api.Group("")
		authorized.Use(JWTMiddleware())
		{
			authorized.POST("/auth/logout", handleLogout)

			authorized.GET("/users/profile", handleGetProfile)
			authorized.PUT("/users/profile", handleUpdateProfile)
			authorized.GET("/users/blacklist", handleGetBlacklist)
			authorized.POST("/users/:id/block", handleBlockUser)
			authorized.DELETE("/users/:id/unblock", handleUnblockUser)
			authorized.POST("/users/mbti-test", handleSubmitMBTITest)
			authorized.GET("/users/:id/profile", handleGetOtherProfile)

			authorized.GET("/activities", handleGetActivities)
			authorized.POST("/activities", handleCreateActivity)
			authorized.GET("/activities/:id", handleGetActivityDetail)
			authorized.PUT("/activities/:id", handleUpdateActivityStatus)
			authorized.POST("/activities/:id/apply", handleApplyActivity)
			authorized.GET("/activities/:id/applications", handleGetApplications)
			authorized.GET("/activities/:id/recommended-users", handleGetRecommendedInvitees)
			authorized.POST("/activities/:id/invitations/generate", handleGenerateInvitations)

			authorized.GET("/me/activities/created", handleGetMyCreatedActivities)
			authorized.GET("/me/activities/applied", handleGetMyAppliedActivities)
			authorized.GET("/me/invitations", handleGetMyInvitations)

			authorized.POST("/applications/:appId/approve", handleApproveApplication)
			authorized.POST("/applications/:appId/reject", handleRejectApplication)

			authorized.GET("/activities/:id/messages", handleGetChatMessages)
			authorized.GET("/activities/:id/ws", handleWebSocket)
			authorized.POST("/chat/messages/:id/report", handleReportChatMessage)
			authorized.POST("/chat/users/:id/block", handleBlockChatUser)

			authorized.POST("/activities/:id/reviews", handleCreateReview)
			authorized.GET("/activities/:id/reviews/me", handleGetMyActivityReviews)
			authorized.POST("/reports", handleCreateReport)

			admin := authorized.Group("/admin")
			admin.Use(AdminMiddleware())
			{
				admin.GET("/stats", handleAdminStats)
				admin.GET("/users", handleAdminGetUsers)
				admin.POST("/users/:id/ban", handleAdminBanUser)
				admin.POST("/users/:id/status", handleAdminUpdateUserStatus)
				admin.GET("/activities", handleAdminGetActivities)
				admin.POST("/activities/:id/status", handleAdminUpdateActivityStatus)
				admin.DELETE("/activities/:id", handleAdminDeleteActivity)
				admin.GET("/reports", handleAdminGetReports)
				admin.POST("/reports/:id/resolve", handleAdminResolveReport)
				admin.GET("/sensitive-words", handleAdminGetSensitiveWords)
				admin.POST("/sensitive-words", handleAdminCreateSensitiveWord)
				admin.PUT("/sensitive-words/:id", handleAdminUpdateSensitiveWord)
				admin.DELETE("/sensitive-words/:id", handleAdminDeleteSensitiveWord)
				admin.GET("/sensitive-hits", handleAdminGetSensitiveHits)
				admin.POST("/sensitive-words/check", handleAdminCheckSensitiveText)
			}
		}
	}
}
