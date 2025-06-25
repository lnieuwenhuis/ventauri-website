package routes

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupOrderRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	orders := router.Group("/api/orders")
	orders.Use(auth.AuthMiddleware())
	{
		orders.GET("/", getUserOrders(db))
		orders.GET("/:id", getOrder(db))
		orders.POST("/", createOrder(db))
		orders.PUT("/:id/cancel", cancelOrder(db))
	}

	// Admin routes
	adminOrders := router.Group("/api/admin/orders")
	adminOrders.Use(auth.AdminMiddleware())
	{
		adminOrders.GET("/", getAllOrders(db))
		adminOrders.PUT("/:id/status", updateOrderStatus(db))
		adminOrders.GET("/:id", getOrderAdmin(db))
		adminOrders.DELETE("/:id", deleteOrderAdmin(db))
	}
}

func getUserOrders(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var orders []models.Order
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		if err := db.Where("user_id = ?", user.ID).Preload("Product").Preload("ProductVariant").Preload("ShippingAddress").Preload("BillingAddress").Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": orders})
	}
}

func getOrder(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var order models.Order

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).Preload("Product").Preload("ProductVariant").Preload("ShippingAddress").Preload("BillingAddress").Preload("PaymentMethod").First(&order).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": order})
	}
}

func createOrder(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var req struct {
			Items             []struct {
				ProductID        string  `json:"productId" binding:"required"`
				ProductVariantID *string `json:"productVariantId,omitempty"`
				Quantity         int     `json:"quantity" binding:"required,min=1"`
			} `json:"items" binding:"required,min=1"`
			ShippingAddressID string  `json:"shippingAddressId" binding:"required"`
			BillingAddressID  string  `json:"billingAddressId" binding:"required"`
			PaymentMethodID   *string `json:"paymentMethodId,omitempty"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Start transaction
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		var orders []models.Order
		var totalAmount float64

		// Create orders for each item
		for _, item := range req.Items {
			productID, err := uuid.Parse(item.ProductID)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
				return
			}

			// Get product
			var product models.Product
			if err := tx.First(&product, "id = ?", productID).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
				return
			}

			itemPrice := product.Price
			var variantID *uuid.UUID

			// Handle variant if specified
			if item.ProductVariantID != nil {
				varID, err := uuid.Parse(*item.ProductVariantID)
				if err != nil {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid variant ID"})
					return
				}
				variantID = &varID

				var variant models.ProductVariant
				if err := tx.First(&variant, "id = ? AND product_id = ?", varID, productID).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusNotFound, gin.H{"error": "Product variant not found"})
					return
				}
				itemPrice += variant.PriceAdjust
			}

			subtotal := itemPrice * float64(item.Quantity)
			tax := subtotal * 0.1 // 10% tax
			shipping := 5.99 // Fixed shipping
			total := subtotal + tax + shipping
			totalAmount += total

			// Generate order number
			orderNumber := fmt.Sprintf("ORD-%d-%s", time.Now().Unix(), uuid.New().String()[:8])

			shippingAddrID, _ := uuid.Parse(req.ShippingAddressID)
			billingAddrID, _ := uuid.Parse(req.BillingAddressID)

			order := models.Order{
				UserID:            user.ID,
				ProductID:         productID,
				ProductVariantID:  variantID,
				Quantity:          item.Quantity,
				Subtotal:          subtotal,
				Tax:               tax,
				Shipping:          shipping,
				Total:             total,
				Status:            "pending",
				OrderNumber:       orderNumber,
				ShippingAddressID: shippingAddrID,
				BillingAddressID:  billingAddrID,
			}

			if req.PaymentMethodID != nil {
				paymentID, _ := uuid.Parse(*req.PaymentMethodID)
				order.PaymentMethodID = &paymentID
			}

			if err := tx.Create(&order).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
				return
			}

			orders = append(orders, order)
		}

		// Clear cart after successful order
		tx.Where("user_id = ?", user.ID).Delete(&models.Cart{})

		tx.Commit()
		c.JSON(http.StatusCreated, gin.H{
			"data": orders,
			"totalAmount": totalAmount,
		})
	}
}

func cancelOrder(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var order models.Order

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&order).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		if order.Status != "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel order with status: " + order.Status})
			return
		}

		order.Status = "cancelled"
		if err := db.Save(&order).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": order})
	}
}

// Admin functions
func getAllOrders(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var orders []models.Order
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		status := c.Query("status")
		
		// Build query with proper preloading
		query := db.Model(&models.Order{}).
			Preload("User").
			Preload("Product").
			Preload("BillingAddress").
			Preload("ShippingAddress")
		
		if search != "" {
			query = query.Joins("LEFT JOIN users ON orders.user_id = users.id").
				Joins("LEFT JOIN products ON orders.product_id = products.id").
				Where(`(orders.order_number ILIKE ? OR 
					users.email ILIKE ? OR 
					users.first_name ILIKE ? OR 
					users.last_name ILIKE ? OR 
					products.name ILIKE ?)`, 
					"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		if status != "" && status != "all" {
			query = query.Where("orders.status = ?", status)
		}
		
		// Count total with same filters
		var total int64
		countQuery := db.Model(&models.Order{})
		if search != "" {
			countQuery = countQuery.Joins("LEFT JOIN users ON orders.user_id = users.id").
				Joins("LEFT JOIN products ON orders.product_id = products.id").
				Where(`(orders.order_number ILIKE ? OR 
					users.email ILIKE ? OR 
					users.first_name ILIKE ? OR 
					users.last_name ILIKE ? OR 
					products.name ILIKE ?)`, 
					"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		if status != "" && status != "all" {
			countQuery = countQuery.Where("orders.status = ?", status)
		}
		if err := countQuery.Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count orders"})
			return
		}
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Order("orders.created_at DESC").
			Offset(offset).
			Limit(utils.ParseInt(limit, 10)).
			Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": orders,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func updateOrderStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req struct {
			Status string `json:"status" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var order models.Order
		if err := db.First(&order, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		order.Status = req.Status
		if err := db.Save(&order).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": order})
	}
}

// Add these admin handler functions
func getOrderAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var order models.Order
		
		if err := db.Preload("User").Preload("Product").Preload("ProductVariant").Preload("ShippingAddress").Preload("BillingAddress").Preload("PaymentMethod").First(&order, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": order})
	}
}

func deleteOrderAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		if err := db.Delete(&models.Order{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete order"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "Order deleted successfully"})
	}
}