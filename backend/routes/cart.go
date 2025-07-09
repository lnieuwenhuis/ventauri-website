package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupCartRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	cart := router.Group("/api/cart")
	cart.Use(auth.AuthMiddleware())
	{
		cart.GET("/", getCart(db))
		cart.POST("/add", addToCart(db))
		cart.PUT("/update/:id", updateCartItem(db))
		cart.DELETE("/remove/:id", removeFromCart(db))
		cart.DELETE("/clear", clearCart(db))
	}

	// Admin routes
	adminCart := router.Group("/api/admin/carts")
	adminCart.Use(auth.AdminMiddleware())
	{
		adminCart.GET("/", getAllCarts(db))
		adminCart.GET("/:id", getCartByID(db))
		adminCart.DELETE("/:id", deleteCartAdmin(db))
		adminCart.DELETE("/user/:userId", clearUserCart(db))
	}
}

// Add these admin handler functions
func getAllCarts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var carts []models.Cart
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		
		query := db.Model(&models.Cart{}).Preload("User").Preload("Product").Preload("Product.Category")
		
		if search != "" {
			query = query.Joins("JOIN users ON carts.user_id = users.id").Joins("JOIN products ON carts.product_id = products.id").Where(
				"users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR products.name ILIKE ?", 
				"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		var total int64
		query.Count(&total)
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&carts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch carts"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": carts,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getCartByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var cart models.Cart
		
		if err := db.Preload("User").Preload("Product").Preload("Product.Category").First(&cart, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Cart item not found"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": cart})
	}
}

func deleteCartAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		if err := db.Delete(&models.Cart{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete cart item"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "Cart item deleted successfully"})
	}
}

func clearUserCart(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("userId")
		
		if err := db.Where("user_id = ?", userID).Delete(&models.Cart{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear user cart"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "User cart cleared successfully"})
	}
}

func getCart(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var cartItems []models.Cart

		if err := db.Where("user_id = ?", user.ID).Preload("Product").Preload("Product.Category").Find(&cartItems).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cart"})
			return
		}

		// Calculate total
		var total float64
		for _, item := range cartItems {
			total += item.Product.Price * float64(item.Quantity)
		}

		c.JSON(http.StatusOK, gin.H{
			"data": cartItems,
			"total": total,
			"itemCount": len(cartItems),
		})
	}
}

func addToCart(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var req struct {
			ProductID string `json:"productId" binding:"required"`
			Quantity  int    `json:"quantity" binding:"required,min=1"`
			Size      string `json:"size"`
			Color     string `json:"color"`
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

		// Check if item with same product, size, and color already exists in cart
		var existingItem models.Cart
		err = db.Where("user_id = ? AND product_id = ? AND size = ? AND color = ?", 
			user.ID, productID, req.Size, req.Color).First(&existingItem).Error

		if err == nil {
			// Item exists, update quantity
			existingItem.Quantity += req.Quantity
			if err := db.Save(&existingItem).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart"})
				return
			}
		} else {
			// Item doesn't exist, create new
			cartItem := models.Cart{
				UserID:    user.ID,
				ProductID: productID,
				Quantity:  req.Quantity,
				Size:      req.Size,
				Color:     req.Color,
			}

			if err := db.Create(&cartItem).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to cart"})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item added to cart successfully"})
	}
}

func updateCartItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var req struct {
			Quantity int `json:"quantity" binding:"required,min=1"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var cartItem models.Cart
		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&cartItem).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Cart item not found"})
			return
		}

		cartItem.Quantity = req.Quantity
		if err := db.Save(&cartItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart item"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": cartItem})
	}
}

func removeFromCart(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).Delete(&models.Cart{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from cart"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item removed from cart"})
	}
}

func clearCart(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)

		if err := db.Where("user_id = ?", user.ID).Delete(&models.Cart{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear cart"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Cart cleared"})
	}
}