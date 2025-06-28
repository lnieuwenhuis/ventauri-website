package routes

import (
	"net/http"
	"strconv"
	"time"
	"fmt"
	"gorm.io/gorm/logger"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupProductRoutes(router *gin.Engine, db *gorm.DB) {
	products := router.Group("/api/products")
	{
		// Public routes
		products.GET("/", getProducts(db))
		products.GET("/:id", getProduct(db))
		products.GET("/category/:categoryId", getProductsByCategory(db))
		products.GET("/search", searchProducts(db))
		products.GET("/:id/variants", getProductVariants(db))
		products.GET("/:id/reviews", getProductReviews(db))
	}

	// Protected admin routes
	auth := utils.NewAuthService(db)
	adminProducts := router.Group("/api/admin/products")
	adminProducts.Use(auth.AdminMiddleware()) 
	{
		adminProducts.POST("/", createProduct(db))
		adminProducts.PUT("/:id", updateProduct(db))
		adminProducts.DELETE("/:id", deleteProduct(db))
		adminProducts.PUT("/:id/status", toggleProductStatus(db)) // Add this line
		adminProducts.POST("/:id/variants", createProductVariant(db))
		adminProducts.PUT("/variants/:variantId", updateProductVariant(db))
		adminProducts.DELETE("/variants/:variantId", deleteProductVariant(db))
		adminProducts.GET("/", getAllProductsAdmin(db))
		adminProducts.GET("/:id", getProductAdmin(db))
	}
}

// Public handlers
func getProducts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var products []models.Product
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		offset := (page - 1) * limit

		query := db.Where("is_active = ?", true).Preload("Category").Preload("Variants")
		
		if err := query.Offset(offset).Limit(limit).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": products})
	}
}

func getProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var product models.Product

		if err := db.Where("id = ? AND is_active = ?", id, true).Preload("Category").Preload("Variants").Preload("Reviews").First(&product).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": product})
	}
}

func getProductsByCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		categoryId := c.Param("categoryId")
		var products []models.Product
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		offset := (page - 1) * limit

		if err := db.Where("category_id = ? AND is_active = ?", categoryId, true).Preload("Category").Preload("Variants").Offset(offset).Limit(limit).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": products})
	}
}

func searchProducts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := c.Query("q")
		if query == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
			return
		}

		var products []models.Product
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		offset := (page - 1) * limit

		searchQuery := "%" + query + "%"
		if err := db.Where("(name LIKE ? OR description LIKE ?) AND is_active = ?", searchQuery, searchQuery, true).Preload("Category").Preload("Variants").Offset(offset).Limit(limit).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search products"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": products})
	}
}

func getProductVariants(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		productId := c.Param("id")
		var variants []models.ProductVariant

		if err := db.Where("product_id = ? AND is_active = ?", productId, true).Find(&variants).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch variants"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": variants})
	}
}

func getProductReviews(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		productId := c.Param("id")
		var reviews []models.Review
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		if err := db.Where("product_id = ? AND is_approved = ?", productId, true).Preload("User").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": reviews})
	}
}

func createProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var product models.Product
		if err := c.ShouldBindJSON(&product); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate SKU if empty
		if product.SKU == "" {
			product.SKU = fmt.Sprintf("SKU-%s", uuid.New().String()[:8])
		}

		if err := db.Create(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
			return
		}
		
		// Fetch the created product with relationships for clean response
		var responseProduct models.Product
		if err := db.Preload("Category").First(&responseProduct, "id = ?", product.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created product"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityProductCreated, "New product '"+product.Name+"' created", utils.StringPtr("product"), utils.StringPtr(product.ID.String()), nil)

		c.JSON(http.StatusCreated, gin.H{"data": responseProduct})
	}
}

func updateProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var existingProduct models.Product

		// First, get the existing product with all its relationships
		if err := db.Preload("Category").Preload("Variants").First(&existingProduct, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}

		// Parse the incoming product data
		var updatedProduct models.Product
		if err := c.ShouldBindJSON(&updatedProduct); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate SKU if empty
		if updatedProduct.SKU == "" {
			// Generate a unique SKU based on product name or ID
			updatedProduct.SKU = fmt.Sprintf("SKU-%s", existingProduct.ID.String()[:8])
		}

		// Preserve the ID and timestamps
		updatedProduct.ID = existingProduct.ID
		updatedProduct.CreatedAt = existingProduct.CreatedAt

		// Start a transaction to ensure data consistency
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Update the main product fields (excluding variants for now)
		productUpdate := models.Product{
			ID:          updatedProduct.ID,
			CreatedAt:   updatedProduct.CreatedAt,
			UpdatedAt:   updatedProduct.UpdatedAt,
			Name:        updatedProduct.Name,
			Price:       updatedProduct.Price,
			Images:      updatedProduct.Images,
			CategoryID:  updatedProduct.CategoryID,
			Description: updatedProduct.Description,
			SKU:         updatedProduct.SKU,
			Weight:      updatedProduct.Weight,
			IsActive:    updatedProduct.IsActive,
		}

		if err := tx.Save(&productUpdate).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
			return
		}

		// Handle variants if they are provided
		if len(updatedProduct.Variants) > 0 {
			// Delete existing variants
			if err := tx.Where("product_id = ?", existingProduct.ID).Delete(&models.ProductVariant{}).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing variants"})
				return
			}

			// Create new variants with fresh IDs
			for i := range updatedProduct.Variants {
				// Clear the ID to let GORM generate a new one
				updatedProduct.Variants[i].ID = uuid.Nil
				updatedProduct.Variants[i].ProductID = updatedProduct.ID
				// Clear timestamps to let GORM handle them
				updatedProduct.Variants[i].CreatedAt = time.Time{}
				updatedProduct.Variants[i].UpdatedAt = time.Time{}
				
				// Generate a unique SKU to avoid empty string duplicates
				if updatedProduct.Variants[i].SKU == "" {
					// Generate a temporary unique SKU using UUID
					updatedProduct.Variants[i].SKU = fmt.Sprintf("TEMP-%s", uuid.New().String())
				} else {
					// If SKU is provided, ensure it's unique
					originalSKU := updatedProduct.Variants[i].SKU
					counter := 1
					for {
						var existingVariant models.ProductVariant
						// Use Session with Logger set to Silent mode to suppress "record not found" logs
						err := db.Session(&gorm.Session{Logger: db.Logger.LogMode(logger.Silent)}).Where("sku = ?", updatedProduct.Variants[i].SKU).First(&existingVariant).Error
						if err == gorm.ErrRecordNotFound {
							// SKU is unique, we can use it
							break
						}
						if err != nil {
							// Handle other potential errors
							tx.Rollback()
							c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking SKU uniqueness"})
							return
						}
						// SKU exists, try with a suffix
						updatedProduct.Variants[i].SKU = fmt.Sprintf("%s-%d", originalSKU, counter)
						counter++
						if counter > 1000 {
							tx.Rollback()
							c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to generate unique SKU"})
							return
						}
					}
				}
				
				if err := tx.Create(&updatedProduct.Variants[i]).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product variants"})
					return
				}
			}
		}

		// Commit the transaction
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
			return
		}
		
		// Fetch the updated product with all relationships for the response
		var responseProduct models.Product
		if err := db.Preload("Category").Preload("Variants", func(db *gorm.DB) *gorm.DB {
			// Only preload variants that actually exist (not zero UUIDs)
			return db.Where("id != ?", "00000000-0000-0000-0000-000000000000")
		}).First(&responseProduct, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated product"})
			return
		}

		// Clean up any nested objects with zero UUIDs
		for i := range responseProduct.Variants {
			// Clear the nested product reference to avoid circular references and zero UUIDs
			responseProduct.Variants[i].Product = models.Product{}
		}

		c.JSON(http.StatusOK, gin.H{"data": responseProduct})
	}
}

func deleteProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		// Get product name before deletion
		var product models.Product
		db.First(&product, "id = ?", id)
		
		if err := db.Delete(&models.Product{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityProductDeleted, "Product '"+product.Name+"' deleted", utils.StringPtr("product"), utils.StringPtr(id), nil)

		c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
	}
}

func createProductVariant(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		productId := c.Param("id")
		var variant models.ProductVariant
		if err := c.ShouldBindJSON(&variant); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		variant.ProductID, _ = uuid.Parse(productId)
		if err := db.Create(&variant).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create variant"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": variant})
	}
}

func updateProductVariant(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		variantId := c.Param("variantId")
		var variant models.ProductVariant

		if err := db.First(&variant, "id = ?", variantId).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Variant not found"})
			return
		}

		if err := c.ShouldBindJSON(&variant); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&variant).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update variant"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": variant})
	}
}

func deleteProductVariant(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		variantId := c.Param("variantId")
		if err := db.Delete(&models.ProductVariant{}, "id = ?", variantId).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete variant"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Variant deleted successfully"})
	}
}

// Add these admin handler functions
func getAllProductsAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var products []models.Product
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		categoryId := c.Query("categoryId")
		
		query := db.Model(&models.Product{}).Preload("Category").Preload("Variants")
		
		if search != "" {
			query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
		}
		
		// Add category filtering
		if categoryId != "" {
			query = query.Where("category_id = ?", categoryId)
		}
		
		var total int64
		query.Count(&total)
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Order("created_at DESC").Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": products,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getProductAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var product models.Product
		
		if err := db.Preload("Category").Preload("Variants").Preload("Reviews").First(&product, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": product})
	}
}

// Add this function after deleteProductVariant
func toggleProductStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var product models.Product
		
		if err := db.First(&product, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		
		product.IsActive = !product.IsActive
		
		if err := db.Save(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product status"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		status := "activated"
		if !product.IsActive {
			status = "deactivated"
		}
		utils.CreateActivity(db, &currentUser.ID, models.ActivityInventoryUpdated, "Product '"+product.Name+"' "+status, utils.StringPtr("product"), utils.StringPtr(product.ID.String()), nil)
		
		c.JSON(http.StatusOK, gin.H{"data": product})
	}
}