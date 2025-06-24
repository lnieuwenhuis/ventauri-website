package routes

import (
	"net/http"
	"strconv"

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

// Admin handlers
func createProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var product models.Product
		if err := c.ShouldBindJSON(&product); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": product})
	}
}

func updateProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var product models.Product

		if err := db.First(&product, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}

		if err := c.ShouldBindJSON(&product); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": product})
	}
}

func deleteProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&models.Product{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
			return
		}

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
		
		query := db.Model(&models.Product{}).Preload("Category").Preload("Variants")
		
		if search != "" {
			query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
		}
		
		var total int64
		query.Count(&total)
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&products).Error; err != nil {
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
		
		c.JSON(http.StatusOK, gin.H{"message": "Product status updated successfully", "data": product})
	}
}