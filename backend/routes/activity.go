package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

type RecentActivityResponse struct {
	Activities []models.Activity `json:"activities"`
}

func SetupActivityRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	
	// Admin routes
	admin := router.Group("/api/admin/activities")
	admin.Use(auth.AdminMiddleware())
	{
		admin.GET("/recent", getRecentActivities(db))
	}
}

func getRecentActivities(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var activities []models.Activity
		
		// Get the 5 most recent activities with user information
		if err := db.Preload("User").Order("created_at DESC").Limit(5).Find(&activities).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recent activities"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": RecentActivityResponse{Activities: activities}})
	}
}