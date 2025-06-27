package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupCategoryRoutes(router *gin.Engine, db *gorm.DB) {
	categories := router.Group("/api/categories")
	{
		// Public routes
		categories.GET("/", getCategories(db))
		categories.GET("/:id", getCategory(db))
	}

	// Protected admin routes
	auth := utils.NewAuthService(db)
	adminCategories := router.Group("/api/admin/categories")
	adminCategories.Use(auth.AdminMiddleware()) 
	{
		adminCategories.POST("/", createCategory(db))
		adminCategories.PUT("/:id", updateCategory(db))
		adminCategories.DELETE("/:id", deleteCategory(db))
		adminCategories.PUT("/:id/status", toggleCategoryStatus(db)) 
		adminCategories.GET("/", getAllCategoriesAdmin(db))
		adminCategories.GET("/:id", getCategoryAdmin(db))
	}
}

func getCategories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var categories []models.Category
		if err := db.Preload("Products").Find(&categories).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": categories})
	}
}

func getCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var category models.Category

		if err := db.Preload("Products").First(&category, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": category})
	}
}

func createCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var category models.Category
		if err := c.ShouldBindJSON(&category); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&category).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCategoryCreated, "New category '"+category.Name+"' created", utils.StringPtr("category"), utils.StringPtr(category.ID.String()), nil)
		
		c.JSON(http.StatusCreated, gin.H{"data": category})
	}
}

func updateCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var category models.Category

		if err := db.First(&category, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
			return
		}

		if err := c.ShouldBindJSON(&category); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&category).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCategoryUpdated, "Category '"+category.Name+"' updated", utils.StringPtr("category"), utils.StringPtr(category.ID.String()), nil)

		c.JSON(http.StatusOK, gin.H{"data": category})
	}
}

func deleteCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		// Get category name before deletion
		var category models.Category
		db.First(&category, "id = ?", id)
		
		if err := db.Delete(&models.Category{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		// Line 130 - fix:
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCategoryDeleted, "Category '"+category.Name+"' deleted", utils.StringPtr("category"), utils.StringPtr(id), nil)

		c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
	}
}

// Add these admin handler functions
func getAllCategoriesAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var categories []models.Category
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		
		query := db.Model(&models.Category{}).Preload("Products")
		
		if search != "" {
			query = query.Where("name ILIKE ? OR description ILIKE ?", 
				"%"+search+"%", "%"+search+"%")
		}
		
		var total int64
		query.Count(&total)
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Order("created_at DESC").Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&categories).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": categories,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getCategoryAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var category models.Category
		
		if err := db.Preload("Products").First(&category, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": category})
	}
}

func toggleCategoryStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var category models.Category
		
		if err := db.First(&category, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
			return
		}
		
		category.IsActive = !category.IsActive
		
		if err := db.Save(&category).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category status"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "Category status updated successfully", "data": category})
	}
}