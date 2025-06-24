package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupWishlistRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	wishlist := router.Group("/api/wishlist")
	wishlist.Use(auth.AuthMiddleware())
	{
		wishlist.GET("/", getWishlist(db))
		wishlist.POST("/", addToWishlist(db))
		wishlist.DELETE("/:id", removeFromWishlist(db))
		wishlist.DELETE("/product/:productId", removeProductFromWishlist(db))
	}

	// Admin routes
	adminWishlist := router.Group("/api/admin/wishlists")
	adminWishlist.Use(auth.AdminMiddleware())
	{
		adminWishlist.GET("/", getAllWishlists(db))
		adminWishlist.GET("/:id", getWishlistByID(db))
		adminWishlist.DELETE("/:id", deleteWishlistAdmin(db))
		adminWishlist.DELETE("/user/:userId", clearUserWishlist(db))
	}
}

// Add these admin handler functions
func getAllWishlists(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var wishlists []models.Wishlist
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		
		query := db.Model(&models.Wishlist{}).Preload("User").Preload("Product").Preload("Product.Category")
		
		if search != "" {
			query = query.Joins("JOIN users ON wishlists.user_id = users.id").Joins("JOIN products ON wishlists.product_id = products.id").Where(
				"users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR products.name ILIKE ?", 
				"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		var total int64
		query.Count(&total)
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&wishlists).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wishlists"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": wishlists,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getWishlistByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var wishlist models.Wishlist
		
		if err := db.Preload("User").Preload("Product").Preload("Product.Category").First(&wishlist, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist item not found"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": wishlist})
	}
}

func deleteWishlistAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		if err := db.Delete(&models.Wishlist{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete wishlist item"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "Wishlist item deleted successfully"})
	}
}

func clearUserWishlist(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("userId")
		
		if err := db.Where("user_id = ?", userID).Delete(&models.Wishlist{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear user wishlist"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "User wishlist cleared successfully"})
	}
}

func getWishlist(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var wishlistItems []models.Wishlist

		if err := db.Where("user_id = ?", user.ID).Preload("Product").Preload("Product.Category").Order("created_at DESC").Find(&wishlistItems).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wishlist"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": wishlistItems,
			"count": len(wishlistItems),
		})
	}
}

func addToWishlist(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var req struct {
			ProductID string `json:"productId" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		productID, err := uuid.Parse(req.ProductID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
			return
		}

		// Check if product exists
		var product models.Product
		if err := db.First(&product, "id = ? AND is_active = ?", productID, true).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}

		// Check if item already exists in wishlist
		var existingItem models.Wishlist
		if err := db.Where("user_id = ? AND product_id = ?", user.ID, productID).First(&existingItem).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Product already in wishlist"})
			return
		}

		// Create new wishlist item
		wishlistItem := models.Wishlist{
			UserID:    user.ID,
			ProductID: productID,
		}

		if err := db.Create(&wishlistItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to wishlist"})
			return
		}

		// Load product data for response
		db.Preload("Product").Preload("Product.Category").First(&wishlistItem, wishlistItem.ID)

		c.JSON(http.StatusCreated, gin.H{"data": wishlistItem})
	}
}

func removeFromWishlist(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).Delete(&models.Wishlist{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from wishlist"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item removed from wishlist"})
	}
}

func removeProductFromWishlist(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		productId := c.Param("productId")

		if err := db.Where("product_id = ? AND user_id = ?", productId, user.ID).Delete(&models.Wishlist{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from wishlist"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Product removed from wishlist"})
	}
}