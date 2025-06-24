package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/utils"
)

func SetupAuthRoutes(router *gin.Engine, db *gorm.DB) {
	authService := utils.NewAuthService(db)

	auth := router.Group("/api/auth")
	{
		auth.POST("/signin/social", authService.SignInSocial)
		auth.GET("/callback/google", authService.GoogleCallback)
		auth.GET("/session", authService.GetSession)
		auth.POST("/signout", authService.SignOut)
	}

	// Protected routes example
	protected := router.Group("/api/protected")
	protected.Use(authService.AuthMiddleware())
	{
		protected.GET("/profile", func(c *gin.Context) {
			user, _ := utils.GetCurrentUser(c)
			c.JSON(200, gin.H{"user": user})
		})
	}
}