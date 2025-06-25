package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupAddressRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	addresses := router.Group("/api/addresses")
	addresses.Use(auth.AuthMiddleware())
	{
		addresses.GET("/", getUserAddresses(db))
		addresses.POST("/", createAddress(db))
		addresses.PUT("/:id", updateAddress(db))
		addresses.DELETE("/:id", deleteAddress(db))
		addresses.PUT("/:id/default", setDefaultAddress(db))
	}

	// Admin routes
	adminAddresses := router.Group("/api/admin/addresses")
	adminAddresses.Use(auth.AdminMiddleware())
	{
		adminAddresses.GET("/", getAllAddresses(db))
		adminAddresses.GET("/:id", getAddressByID(db))
		adminAddresses.PUT("/:id", updateAddressAdmin(db))
		adminAddresses.DELETE("/:id", deleteAddressAdmin(db))
		adminAddresses.PUT("/:id/status", toggleAddressStatus(db))
	}
}

// Add these admin handler functions
func getAllAddresses(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var addresses []models.Address
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		
		query := db.Model(&models.Address{}).Preload("User")
		
		if search != "" {
			query = query.Joins("JOIN users ON addresses.user_id = users.id").Where(
				"addresses.street ILIKE ? OR addresses.city ILIKE ? OR addresses.state ILIKE ? OR addresses.country ILIKE ? OR users.first_name ILIKE ? OR users.last_name ILIKE ?", 
				"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		var total int64
		query.Count(&total)
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&addresses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch addresses"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": addresses,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getAddressByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var address models.Address
		
		if err := db.Preload("User").First(&address, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}

func updateAddressAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var address models.Address
		
		if err := db.First(&address, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}
		
		if err := c.ShouldBindJSON(&address); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		if err := db.Save(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}

func deleteAddressAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		if err := db.Delete(&models.Address{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete address"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "Address deleted successfully"})
	}
}

func getUserAddresses(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var addresses []models.Address

		if err := db.Where("user_id = ?", user.ID).Order("is_default DESC, created_at DESC").Find(&addresses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch addresses"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": addresses})
	}
}

func createAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var address models.Address
		if err := c.ShouldBindJSON(&address); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		address.UserID = user.ID

		// If this is the first address, make it default
		var count int64
		db.Model(&models.Address{}).Where("user_id = ?", user.ID).Count(&count)
		if count == 0 {
			address.IsDefault = true
		}

		if err := db.Create(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create address"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": address})
	}
}

func updateAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var address models.Address

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&address).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		var req struct {
			Street  string `json:"street" binding:"required"`
			City    string `json:"city" binding:"required"`
			State   string `json:"state" binding:"required"`
			ZipCode string `json:"zipCode" binding:"required"`
			Country string `json:"country" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		address.Street = req.Street
		address.City = req.City
		address.State = req.State
		address.ZipCode = req.ZipCode
		address.Country = req.Country

		if err := db.Save(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}

func deleteAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var address models.Address

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&address).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		if err := db.Delete(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete address"})
			return
		}

		// If this was the default address, set another one as default
		if address.IsDefault {
			var newDefault models.Address
			if err := db.Where("user_id = ? AND id != ?", user.ID, id).First(&newDefault).Error; err == nil {
				newDefault.IsDefault = true
				db.Save(&newDefault)
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Address deleted successfully"})
	}
}

func setDefaultAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var address models.Address

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&address).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		// Start transaction
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Remove default from all other addresses
		if err := tx.Model(&models.Address{}).Where("user_id = ?", user.ID).Update("is_default", false).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update default address"})
			return
		}

		// Set this address as default
		address.IsDefault = true
		if err := tx.Save(&address).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default address"})
			return
		}

		tx.Commit()
		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}

// Add new status toggle function
func toggleAddressStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var address models.Address
		
		if err := db.First(&address, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}
		
		address.IsActive = !address.IsActive
		
		if err := db.Save(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address status"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}