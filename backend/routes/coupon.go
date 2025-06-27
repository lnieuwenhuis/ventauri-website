package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupCouponRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	
	// Public coupon validation
	coupons := router.Group("/api/coupons")
	coupons.Use(auth.AuthMiddleware())
	{
		coupons.POST("/validate", validateCoupon(db))
	}
	
	// Admin coupon management
	adminCoupons := router.Group("/api/admin/coupons")
	adminCoupons.Use(auth.AdminMiddleware())
	{
		adminCoupons.GET("/", getAllCoupons(db))
		adminCoupons.POST("/", createCoupon(db))
		adminCoupons.PUT("/:id", updateCoupon(db))
		adminCoupons.PUT("/:id/status", toggleCouponStatus(db))
		adminCoupons.DELETE("/:id", deleteCoupon(db))
		adminCoupons.GET("/:id/usage", getCouponUsage(db))
	}
}

// Add this new function
func toggleCouponStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var coupon models.Coupon
		
		if err := db.First(&coupon, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found"})
			return
		}
		
		// Toggle the IsActive status
		coupon.IsActive = !coupon.IsActive
		
		if err := db.Save(&coupon).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update coupon status"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": coupon})
	}
}

func validateCoupon(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var req struct {
			Code        string  `json:"code" binding:"required"`
			OrderTotal  float64 `json:"orderTotal" binding:"required,min=0"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var coupon models.Coupon
		if err := db.Where("code = ? AND is_active = ?", req.Code, true).First(&coupon).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invalid coupon code"})
			return
		}

		// Check if coupon is within valid date range
		now := time.Now()
		if now.Before(coupon.StartDate) || now.After(coupon.EndDate) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon is not valid at this time"})
			return
		}

		// Check minimum order amount
		if req.OrderTotal < coupon.MinOrderAmount {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Order total does not meet minimum requirement",
				"minAmount": coupon.MinOrderAmount,
			})
			return
		}

		// Check usage limits
		if coupon.UsageLimit != nil && coupon.UsageCount >= *coupon.UsageLimit {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon usage limit exceeded"})
			return
		}

		// Check user usage limit
		if coupon.UserUsageLimit != nil {
			var userUsageCount int64
			db.Model(&models.CouponUsage{}).Where("coupon_id = ? AND user_id = ?", coupon.ID, user.ID).Count(&userUsageCount)
			if userUsageCount >= int64(*coupon.UserUsageLimit) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "You have reached the usage limit for this coupon"})
				return
			}
		}

		// Calculate discount
		var discount float64
		switch coupon.Type {
		case models.CouponTypePercentage:
			discount = req.OrderTotal * (coupon.Value / 100)
			if coupon.MaxDiscount != nil && discount > *coupon.MaxDiscount {
				discount = *coupon.MaxDiscount
			}
		case models.CouponTypeFixed:
			discount = coupon.Value
			if discount > req.OrderTotal {
				discount = req.OrderTotal
			}
		case models.CouponTypeFreeShipping:
			discount = 0
		}

		c.JSON(http.StatusOK, gin.H{
			"valid": true,
			"coupon": coupon,
			"discount": discount,
			"finalTotal": req.OrderTotal - discount,
		})
	}
}

func getAllCoupons(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var coupons []models.Coupon
		var total int64
		
		// Get pagination parameters
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		
		// Build query
		query := db.Model(&models.Coupon{})
		
		// Apply search filter
		if search != "" {
			query = query.Where("code ILIKE ? OR name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		// Get total count
		query.Count(&total)
		
		// Apply pagination
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Order("created_at DESC").Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&coupons).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch coupons"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": coupons,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func createCoupon(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var coupon models.Coupon
		if err := c.ShouldBindJSON(&coupon); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if code already exists
		var existingCoupon models.Coupon
		if err := db.Where("code = ?", coupon.Code).First(&existingCoupon).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon code already exists"})
			return
		}

		if err := db.Create(&coupon).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create coupon"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCouponCreated, "New coupon '"+coupon.Code+"' created", utils.StringPtr("coupon"), utils.StringPtr(coupon.ID.String()), nil)
		c.JSON(http.StatusCreated, gin.H{"data": coupon})
	}
}

func updateCoupon(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var coupon models.Coupon

		if err := db.First(&coupon, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found"})
			return
		}

		if err := c.ShouldBindJSON(&coupon); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&coupon).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update coupon"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCouponUpdated, "Coupon '"+coupon.Code+"' updated", utils.StringPtr("coupon"), utils.StringPtr(coupon.ID.String()), nil)
		c.JSON(http.StatusOK, gin.H{"data": coupon})
	}
}

func deleteCoupon(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		// Get coupon code before deletion
		var coupon models.Coupon
		db.First(&coupon, "id = ?", id)
		
		if err := db.Delete(&models.Coupon{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete coupon"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCouponDeleted, "Coupon '"+coupon.Code+"' deleted", utils.StringPtr("coupon"), utils.StringPtr(id), nil)
		c.JSON(http.StatusOK, gin.H{"message": "Coupon deleted successfully"})
	}
}

func getCouponUsage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var usages []models.CouponUsage

		if err := db.Where("coupon_id = ?", id).Preload("User").Preload("Order").Order("created_at DESC").Find(&usages).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch coupon usage"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": usages})
	}
}