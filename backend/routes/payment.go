package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupPaymentRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	payments := router.Group("/api/payment-methods")
	payments.Use(auth.AuthMiddleware())
	{
		payments.GET("/", getPaymentMethods(db))
		payments.POST("/", createPaymentMethod(db))
		payments.PUT("/:id", updatePaymentMethod(db))
		payments.DELETE("/:id", deletePaymentMethod(db))
		payments.PUT("/:id/default", setDefaultPaymentMethod(db))
	}

	// Admin routes
	adminPayments := router.Group("/api/admin/payment-methods")
	adminPayments.Use(auth.AdminMiddleware())
	{
		adminPayments.GET("/", getAllPaymentMethods(db))
		adminPayments.GET("/:id", getPaymentMethodByID(db))
		adminPayments.PUT("/:id", updatePaymentMethodAdmin(db))
		adminPayments.DELETE("/:id", deletePaymentMethodAdmin(db))
		adminPayments.PUT("/:id/status", togglePaymentMethodStatus(db))
	}
}

// Add new status toggle function
func togglePaymentMethodStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var paymentMethod models.PaymentMethod
		
		if err := db.First(&paymentMethod, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}
		
		paymentMethod.IsActive = !paymentMethod.IsActive
		
		if err := db.Save(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment method status"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}

// Add these admin handler functions
func getAllPaymentMethods(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var paymentMethods []models.PaymentMethod
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		
		query := db.Model(&models.PaymentMethod{}).Preload("User")
		
		if search != "" {
			query = query.Joins("JOIN users ON payment_methods.user_id = users.id").Where(
				"users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR payment_methods.provider ILIKE ? OR payment_methods.last4 ILIKE ? OR payment_methods.holder_name ILIKE ?", 
				"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		var total int64
		query.Count(&total)
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&paymentMethods).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment methods"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": paymentMethods,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getPaymentMethodByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var paymentMethod models.PaymentMethod
		
		if err := db.Preload("User").First(&paymentMethod, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}

func updatePaymentMethodAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var paymentMethod models.PaymentMethod
		
		if err := db.First(&paymentMethod, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}
		
		if err := c.ShouldBindJSON(&paymentMethod); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		if err := db.Save(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment method"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}

func deletePaymentMethodAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		if err := db.Delete(&models.PaymentMethod{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment method"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "Payment method deleted successfully"})
	}
}

func getPaymentMethods(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var paymentMethods []models.PaymentMethod

		if err := db.Where("user_id = ? AND is_active = ?", user.ID, true).Order("is_default DESC, created_at DESC").Find(&paymentMethods).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment methods"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": paymentMethods})
	}
}

func createPaymentMethod(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var paymentMethod models.PaymentMethod
		if err := c.ShouldBindJSON(&paymentMethod); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		paymentMethod.UserID = user.ID

		// If this is the first payment method, make it default
		var count int64
		db.Model(&models.PaymentMethod{}).Where("user_id = ? AND is_active = ?", user.ID, true).Count(&count)
		if count == 0 {
			paymentMethod.IsDefault = true
		}

		if err := db.Create(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment method"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": paymentMethod})
	}
}

func updatePaymentMethod(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		var req struct {
			Type        models.PaymentMethodType `json:"type"`
			Provider    string                   `json:"provider"`
			Last4       string                   `json:"last4"`
			ExpiryMonth int                      `json:"expiryMonth,omitempty"`
			ExpiryYear  int                      `json:"expiryYear,omitempty"`
			HolderName  string                   `json:"holderName"`
			Token       string                   `json:"token,omitempty"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update fields
		paymentMethod.Type = req.Type
		paymentMethod.Provider = req.Provider
		paymentMethod.Last4 = req.Last4
		paymentMethod.ExpiryMonth = req.ExpiryMonth
		paymentMethod.ExpiryYear = req.ExpiryYear
		paymentMethod.HolderName = req.HolderName
		paymentMethod.Token = req.Token

		if err := db.Save(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment method"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}

func deletePaymentMethod(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		// Soft delete by setting is_active to false
		paymentMethod.IsActive = false
		if err := db.Save(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment method"})
			return
		}

		// If this was the default payment method, set another one as default
		if paymentMethod.IsDefault {
			var newDefault models.PaymentMethod
			if err := db.Where("user_id = ? AND is_active = ? AND id != ?", user.ID, true, id).First(&newDefault).Error; err == nil {
				newDefault.IsDefault = true
				db.Save(&newDefault)
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Payment method deleted successfully"})
	}
}

func setDefaultPaymentMethod(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.Where("id = ? AND user_id = ? AND is_active = ?", id, user.ID, true).First(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		// Start transaction
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Remove default from all other payment methods
		if err := tx.Model(&models.PaymentMethod{}).Where("user_id = ? AND is_active = ?", user.ID, true).Update("is_default", false).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update default payment method"})
			return
		}

		// Set this payment method as default
		paymentMethod.IsDefault = true
		if err := tx.Save(&paymentMethod).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default payment method"})
			return
		}

		tx.Commit()
		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}