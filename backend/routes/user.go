package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupUserRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	
	// Regular user routes
	users := router.Group("/api/users")
	users.Use(auth.AuthMiddleware())
	{
		users.GET("/profile", getUserProfile(db))
		users.PUT("/profile", updateUserProfile(db))
		users.POST("/change-password", changePassword(db))
	}
	
	// Admin routes
	admin := router.Group("/api/admin/users")
	admin.Use(auth.AdminMiddleware()) 
	{
		admin.GET("/", getAllUsers(db))
		admin.POST("/", createUser(db))
		admin.GET("/:id", getUserByID(db))
		admin.PUT("/:id", updateUser(db))
		admin.DELETE("/:id", deleteUser(db))
		admin.PUT("/:id/status", toggleUserStatus(db))
	}
}

// Add the new createUser handler function
func createUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			FirstName string           `json:"firstName" binding:"required"`
			LastName  string           `json:"lastName" binding:"required"`
			Phone     string           `json:"phone"`
			Email     string           `json:"email" binding:"required,email"`
			Password  string           `json:"password" binding:"required,min=8"`
			Role      models.UserRole  `json:"role"`
			IsActive  bool             `json:"isActive"`
		}
		
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		// Check if email is already taken
		var existingUser models.User
		if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		}
		
		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		
		hashedPasswordStr := string(hashedPassword)
		user := models.User{
			FirstName: req.FirstName,
			LastName:  req.LastName,
			Phone:     req.Phone,
			Email:     req.Email,
			Password:  &hashedPasswordStr,
			Role:      req.Role,
			IsActive:  req.IsActive,
		}
		
		// Set default role if not provided
		if user.Role == "" {
			user.Role = models.UserRoleUser
		}
		
		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		
		// Add activity tracking
		utils.CreateActivity(db, &user.ID, models.ActivityUserRegistered, "New user created by admin", utils.StringPtr("user"), utils.StringPtr(user.ID.String()), nil)
		
		// Remove sensitive information before returning
		user.Password = nil
		c.JSON(http.StatusCreated, gin.H{"data": user})
	}
}

// Add these new handler functions
func getAllUsers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var users []models.User
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		
		query := db.Model(&models.User{})
		
		if search != "" {
			query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ?", 
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		var total int64
		query.Count(&total)
		
		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Order("created_at DESC").Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
			return
		}
		
		// Remove sensitive information
		for i := range users {
			users[i].Password = nil
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data": users,
			"total": total,
			"page": utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getUserByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var user models.User
		
		if err := db.Preload("Addresses").Preload("Orders").Preload("PaymentMethods").First(&user, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		
		user.Password = nil
		c.JSON(http.StatusOK, gin.H{"data": user})
	}
}

func updateUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var user models.User
		
		if err := db.First(&user, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		
		var req struct {
			FirstName string           `json:"firstName"`
			LastName  string           `json:"lastName"`
			Phone     string           `json:"phone"`
			Email     string           `json:"email"`
			Role      models.UserRole  `json:"role"`
			IsActive  bool             `json:"isActive"`
		}
		
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		// Check if email is already taken by another user
		var existingUser models.User
		if err := db.Where("email = ? AND id != ?", req.Email, id).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		}
		
		user.FirstName = req.FirstName
		user.LastName = req.LastName
		user.Phone = req.Phone
		user.Email = req.Email
		user.Role = req.Role
		user.IsActive = req.IsActive
		
		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityUserUpdated, "User profile updated by admin", utils.StringPtr("user"), utils.StringPtr(user.ID.String()), nil)
		
		user.Password = nil
		c.JSON(http.StatusOK, gin.H{"data": user})
	}
}

func deleteUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		if err := db.Delete(&models.User{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityUserDeleted, "User deleted by admin", utils.StringPtr("user"), utils.StringPtr(id), nil)
		
		c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
	}
}

func toggleUserStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var user models.User
		
		if err := db.First(&user, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		
		user.IsActive = !user.IsActive
		
		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
			return
		}
		
		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		status := "activated"
		if !user.IsActive {
			status = "deactivated"
		}
		utils.CreateActivity(db, &currentUser.ID, models.ActivityUserUpdated, "User "+status+" by admin", utils.StringPtr("user"), utils.StringPtr(user.ID.String()), nil)
		
		user.Password = nil
		c.JSON(http.StatusOK, gin.H{"data": user})
	}
}

func getUserProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var userProfile models.User

		if err := db.Preload("Addresses").Preload("PaymentMethods").First(&userProfile, "id = ?", user.ID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Remove sensitive information
		userProfile.Password = nil

		c.JSON(http.StatusOK, gin.H{"data": userProfile})
	}
}

func updateUserProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var req struct {
			FirstName string `json:"firstName" binding:"required"`
			LastName  string `json:"lastName" binding:"required"`
			Phone     string `json:"phone"`
			Email     string `json:"email" binding:"required,email"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if email is already taken by another user
		var existingUser models.User
		if err := db.Where("email = ? AND id != ?", req.Email, user.ID).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		}

		// Update user fields
		user.FirstName = req.FirstName
		user.LastName = req.LastName
		user.Phone = req.Phone
		user.Email = req.Email

		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}

		// Remove sensitive information before returning
		user.Password = nil
		c.JSON(http.StatusOK, gin.H{"data": user})
	}
}

func changePassword(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var req struct {
			CurrentPassword string `json:"currentPassword" binding:"required"`
			NewPassword     string `json:"newPassword" binding:"required,min=8"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Verify current password (only for users with password, not OAuth users)
		if user.Password != nil {
			if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(req.CurrentPassword)); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
				return
			}
		}

		// Hash new password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		hashedPasswordStr := string(hashedPassword)
		user.Password = &hashedPasswordStr

		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
	}
}