package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupAuthRoutes(router *gin.Engine, db *gorm.DB) {
	authService := utils.NewAuthService(db)

	auth := router.Group("/api/auth")
	{
		auth.POST("/signin/social", authService.SignInSocial)
		auth.GET("/callback/google", authService.GoogleCallback)
		auth.GET("/session", authService.GetSession)
		auth.POST("/logout", authService.SignOut)
	}

	// Protected routes (authenticated users)
	protected := router.Group("/api/protected")
	protected.Use(authService.AuthMiddleware())
	{
		protected.GET("/profile", func(c *gin.Context) {
			user, _ := utils.GetCurrentUser(c)
			c.JSON(200, gin.H{"user": user})
		})
	}

	// Admin-only routes
	admin := router.Group("/api/admin")
	admin.Use(authService.AdminMiddleware())
	{
		admin.GET("/users", func(c *gin.Context) {
			// Get all users - admin only
			var users []models.User
			if err := db.Find(&users).Error; err != nil {
				c.JSON(500, gin.H{"error": "Failed to fetch users"})
				return
			}
			c.JSON(200, gin.H{"users": users})
		})
		
		admin.PUT("/users/:id/role", func(c *gin.Context) {
			// Update user role - admin only
			userID := c.Param("id")
			var req struct {
				Role models.UserRole `json:"role"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": "Invalid request"})
				return
			}
			
			if err := db.Model(&models.User{}).Where("id = ?", userID).Update("role", req.Role).Error; err != nil {
				c.JSON(500, gin.H{"error": "Failed to update user role"})
				return
			}
			
			c.JSON(200, gin.H{"success": true})
		})
	}
}