package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

type DashboardStats struct {
	TotalUsers    int64   `json:"totalUsers"`
	TotalOrders   int64   `json:"totalOrders"`
	TotalRevenue  float64 `json:"totalRevenue"`
	TotalProducts int64   `json:"totalProducts"`
}

func SetupStatsRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	
	// Admin routes
	admin := router.Group("/api/admin/stats")
	admin.Use(auth.AdminMiddleware())
	{
		admin.GET("/dashboard", getDashboardStats(db))
	}
}

func getDashboardStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var stats DashboardStats
		
		// Count total users
		if err := db.Model(&models.User{}).Count(&stats.TotalUsers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
			return
		}
		
		// Count total orders
		if err := db.Model(&models.Order{}).Count(&stats.TotalOrders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count orders"})
			return
		}
		
		// Calculate total revenue from completed orders
		var revenue struct {
			Total float64
		}
		if err := db.Model(&models.Order{}).Select("COALESCE(SUM(total), 0) as total").Where("status IN ?", []string{"completed", "delivered"}).Scan(&revenue).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate revenue"})
			return
		}
		stats.TotalRevenue = revenue.Total
		
		// Count total active products
		if err := db.Model(&models.Product{}).Where("is_active = ?", true).Count(&stats.TotalProducts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count products"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": stats})
	}
}