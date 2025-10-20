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

func SetupReviewRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	reviews := router.Group("/api/reviews")
	reviews.Use(auth.AuthMiddleware())
	{
		reviews.POST("/", createReview(db))
		reviews.GET("/my", getUserReviews(db))
		reviews.PUT("/:id", updateReview(db))
		reviews.DELETE("/:id", deleteReview(db))
		reviews.POST("/:id/helpful", markReviewHelpful(db))
	}

	// Admin routes
	adminReviews := router.Group("/api/admin/reviews")
	adminReviews.Use(auth.AdminMiddleware())
	{
		adminReviews.GET("/", getAllReviews(db))
		adminReviews.PUT("/:id/approve", approveReview(db))
		adminReviews.PUT("/:id/reject", rejectReview(db))
		adminReviews.PUT("/:id/status", toggleReviewStatus(db))
		adminReviews.DELETE("/:id", deleteReviewAdmin(db))
	}
}

func createReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var req struct {
			ProductID string `json:"productId" binding:"required"`
			OrderID   string `json:"orderId" binding:"required"`
			Rating    int    `json:"rating" binding:"required,min=1,max=5"`
			Title     string `json:"title" binding:"required"`
			Comment   string `json:"comment" binding:"required"`
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

		orderID, err := uuid.Parse(req.OrderID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		// Verify user owns the order and it's delivered or completed, and the product is part of that order
		var order models.Order
		if err := db.Where("id = ? AND user_id = ? AND status IN ?", orderID, user.ID, []string{"delivered", "completed"}).First(&order).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot review this product - order not found or not delivered/completed"})
			return
		}

		// Ensure the requested product exists in the order items
		var orderItem models.OrderItem
		if err := db.Where("order_id = ? AND product_id = ?", order.ID, productID).First(&orderItem).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot review this product - item not found in order"})
			return
		}

		// Check if review already exists
		var existingReview models.Review
		if err := db.Where("user_id = ? AND product_id = ? AND order_id = ?", user.ID, productID, orderID).First(&existingReview).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Review already exists for this product"})
			return
		}

		review := models.Review{
			UserID:     user.ID,
			ProductID:  productID,
			OrderID:    orderID,
			Rating:     req.Rating,
			Title:      req.Title,
			Comment:    req.Comment,
			IsVerified: true,
			IsApproved: true,
		}

		if err := db.Create(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
			return
		}
		
		// Add activity tracking
		utils.CreateActivity(db, &user.ID, models.ActivityReviewCreated, "New review created for product", utils.StringPtr("review"), utils.StringPtr(review.ID.String()), nil)

		c.JSON(http.StatusCreated, gin.H{"data": review})
	}
}

func getUserReviews(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var reviews []models.Review
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		if err := db.Where("user_id = ?", user.ID).Preload("Product").Order("created_at DESC").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": reviews})
	}
}

func updateReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var req struct {
			Rating  int    `json:"rating" binding:"required,min=1,max=5"`
			Title   string `json:"title" binding:"required"`
			Comment string `json:"comment" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var review models.Review
		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&review).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
			return
		}

		review.Rating = req.Rating
		review.Title = req.Title
		review.Comment = req.Comment
		review.IsApproved = true

		if err := db.Save(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": review})
	}
}

func deleteReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).Delete(&models.Review{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete review"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Review deleted successfully"})
	}
}

func markReviewHelpful(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var review models.Review

		if err := db.First(&review, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
			return
		}

		review.HelpfulCount++
		if err := db.Save(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": review})
	}
}

// Admin functions
func getAllReviews(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var reviews []models.Review
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit
		search := c.Query("search")

		query := db.Preload("User").Preload("Product")
		
		// Add search functionality
		if search != "" {
			query = query.Joins("LEFT JOIN users ON users.id = reviews.user_id").
				Joins("LEFT JOIN products ON products.id = reviews.product_id").
				Where("reviews.title ILIKE ? OR reviews.comment ILIKE ? OR users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR products.name ILIKE ?",
					"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		approved := c.Query("approved")
		if approved != "" {
			isApproved := approved == "true"
			query = query.Where("is_approved = ?", isApproved)
		}

		// Get total count
		var total int64
		query.Model(&models.Review{}).Count(&total)

		if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&reviews).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  reviews,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	}
}

func approveReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var review models.Review

		if err := db.First(&review, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
			return
		}

		review.IsApproved = true
		if err := db.Save(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve review"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityReviewApproved, "Review approved by admin", utils.StringPtr("review"), utils.StringPtr(review.ID.String()), nil)

		c.JSON(http.StatusOK, gin.H{"data": review})
	}
}

func rejectReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var review models.Review

		if err := db.First(&review, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
			return
		}

		review.IsApproved = false
		if err := db.Save(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject review"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": review})
	}
}

// Add these new functions at the end of the file
func toggleReviewStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var review models.Review

		if err := db.First(&review, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
			return
		}

		review.IsApproved = !review.IsApproved
		if err := db.Save(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review status"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": review})
	}
}

func deleteReviewAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		if err := db.Delete(&models.Review{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete review"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Review deleted successfully"})
	}
}