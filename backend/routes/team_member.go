package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupTeamMemberRoutes(router *gin.Engine, db *gorm.DB) {
	// Public routes
	teamMembers := router.Group("/api/team-members")
	{
		teamMembers.GET("/", getTeamMembers(db))
		teamMembers.GET("/:id", getTeamMember(db))
		teamMembers.GET("/role/:role", getTeamMembersByRole(db))
		teamMembers.GET("/nationality/:nationality", getTeamMembersByNationality(db))
	}

	// Protected admin routes
	auth := utils.NewAuthService(db)
	adminTeamMembers := router.Group("/api/admin/team-members")
	adminTeamMembers.Use(auth.AdminMiddleware())
	{
		adminTeamMembers.POST("/", createTeamMember(db))
		adminTeamMembers.PUT("/:id", updateTeamMember(db))
		adminTeamMembers.DELETE("/:id", deleteTeamMember(db))
		adminTeamMembers.GET("/", getAllTeamMembersAdmin(db))
		adminTeamMembers.GET("/:id", getTeamMemberAdmin(db))
	}
}

// Public handlers
func getTeamMembers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var teamMembers []models.TeamMember
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		offset := (page - 1) * limit

		// Get query parameters
		search := c.Query("search")
		role := c.Query("role")
		nationality := c.Query("nationality")
		sortBy := c.DefaultQuery("sort", "latest_updated")

		// Start with base query and preload Role
		query := db.Model(&models.TeamMember{}).Preload("Role")

		// Apply search filter
		if search != "" {
			searchQuery := "%" + search + "%"
			query = query.Where("(first_name LIKE ? OR last_name LIKE ? OR bio LIKE ?)", searchQuery, searchQuery, searchQuery)
		}

		// Apply role filter - now using role_id
		if role != "" {
			query = query.Joins("JOIN team_roles ON team_members.role_id = team_roles.id").Where("team_roles.name = ?", role)
		}

		// Apply nationality filter
		if nationality != "" {
			query = query.Where("nationality = ?", nationality)
		}

		// Get total count before pagination
		var total int64
		if err := query.Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count team members"})
			return
		}

		// Apply sorting - update role sorting to use joined table
		switch sortBy {
		case "role":
			query = query.Joins("JOIN team_roles ON team_members.role_id = team_roles.id").Order("team_roles.name ASC, first_name ASC")
		case "nationality":
			query = query.Order("nationality ASC, first_name ASC")
		case "newest":
			query = query.Order("created_at DESC")
		case "oldest":
			query = query.Order("created_at ASC")
		case "name":
			query = query.Order("first_name ASC, last_name ASC")
		default: // "latest_updated"
			query = query.Order("COALESCE(updated_at, created_at) DESC")
		}

		// Apply pagination
		if err := query.Offset(offset).Limit(limit).Find(&teamMembers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch team members"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  teamMembers,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	}
}

func getTeamMember(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var teamMember models.TeamMember

		if err := db.Preload("Role").First(&teamMember, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team member not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": teamMember})
	}
}

func getTeamMembersByRole(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.Param("role")
		var teamMembers []models.TeamMember
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		offset := (page - 1) * limit
		sortBy := c.DefaultQuery("sort", "latest_updated")

		// Update to use role name instead of role string
		query := db.Preload("Role").Joins("JOIN team_roles ON team_members.role_id = team_roles.id").Where("team_roles.name = ?", role)

		// Apply sorting
		switch sortBy {
		case "nationality":
			query = query.Order("nationality ASC, first_name ASC")
		case "newest":
			query = query.Order("team_members.created_at DESC")
		case "oldest":
			query = query.Order("team_members.created_at ASC")
		case "name":
			query = query.Order("first_name ASC, last_name ASC")
		default: // "latest_updated"
			query = query.Order("COALESCE(team_members.updated_at, team_members.created_at) DESC")
		}

		if err := query.Offset(offset).Limit(limit).Find(&teamMembers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch team members"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": teamMembers})
	}
}

func getTeamMembersByNationality(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		nationality := c.Param("nationality")
		var teamMembers []models.TeamMember
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		offset := (page - 1) * limit
		sortBy := c.DefaultQuery("sort", "latest_updated")

		query := db.Preload("Role").Where("nationality = ?", nationality)

		// Apply sorting - update role sorting
		switch sortBy {
		case "role":
			query = query.Joins("JOIN team_roles ON team_members.role_id = team_roles.id").Order("team_roles.name ASC, first_name ASC")
		case "newest":
			query = query.Order("created_at DESC")
		case "oldest":
			query = query.Order("created_at ASC")
		case "name":
			query = query.Order("first_name ASC, last_name ASC")
		default: // "latest_updated"
			query = query.Order("COALESCE(updated_at, created_at) DESC")
		}

		if err := query.Offset(offset).Limit(limit).Find(&teamMembers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch team members"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": teamMembers})
	}
}

// Admin handlers
func createTeamMember(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var teamMember models.TeamMember
		if err := c.ShouldBindJSON(&teamMember); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&teamMember).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create team member"})
			return
		}

		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTeamMemberCreated, "New team member '"+teamMember.FirstName+" "+teamMember.LastName+"' created", utils.StringPtr("team_member"), utils.StringPtr(teamMember.ID.String()), nil)

		c.JSON(http.StatusCreated, gin.H{"data": teamMember})
	}
}

func updateTeamMember(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var teamMember models.TeamMember

		if err := db.Preload("Role").First(&teamMember, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team member not found"})
			return
		}

		if err := c.ShouldBindJSON(&teamMember); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&teamMember).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update team member"})
			return
		}

		// Reload with role for response
		db.Preload("Role").First(&teamMember, "id = ?", id)

		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTeamMemberUpdated, "Team member '"+teamMember.FirstName+" "+teamMember.LastName+"' updated", utils.StringPtr("team_member"), utils.StringPtr(teamMember.ID.String()), nil)

		c.JSON(http.StatusOK, gin.H{"data": teamMember})
	}
}

func deleteTeamMember(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// Get team member name before deletion
		var teamMember models.TeamMember
		db.Preload("Role").First(&teamMember, "id = ?", id)

		if err := db.Delete(&models.TeamMember{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete team member"})
			return
		}

		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTeamMemberDeleted, "Team member '"+teamMember.FirstName+" "+teamMember.LastName+"' deleted", utils.StringPtr("team_member"), utils.StringPtr(id), nil)

		c.JSON(http.StatusOK, gin.H{"message": "Team member deleted successfully"})
	}
}

func getAllTeamMembersAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var teamMembers []models.TeamMember
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit
		search := c.Query("search")
		role := c.Query("role")
		nationality := c.Query("nationality")
		sortBy := c.DefaultQuery("sort", "latest_updated")

		query := db.Model(&models.TeamMember{}).Preload("Role")

		// Apply search filter - update to include role name
		if search != "" {
			searchQuery := "%" + search + "%"
			query = query.Joins("LEFT JOIN team_roles ON team_members.role_id = team_roles.id").Where("first_name ILIKE ? OR last_name ILIKE ? OR bio ILIKE ? OR team_roles.name ILIKE ? OR nationality ILIKE ?",
				searchQuery, searchQuery, searchQuery, searchQuery, searchQuery)
		}

		// Apply role filter - update to use role name
		if role != "" {
			query = query.Joins("JOIN team_roles ON team_members.role_id = team_roles.id").Where("team_roles.name = ?", role)
		}

		// Apply nationality filter
		if nationality != "" {
			query = query.Where("nationality = ?", nationality)
		}

		// Get total count
		var total int64
		query.Count(&total)

		// Apply sorting - update role sorting
		switch sortBy {
		case "name":
			query = query.Order("first_name ASC, last_name ASC")
		case "role":
			query = query.Joins("JOIN team_roles ON team_members.role_id = team_roles.id").Order("team_roles.name ASC, first_name ASC")
		case "nationality":
			query = query.Order("nationality ASC, first_name ASC")
		case "newest":
			query = query.Order("team_members.created_at DESC")
		case "oldest":
			query = query.Order("team_members.created_at ASC")
		default: // "latest_updated"
			query = query.Order("COALESCE(team_members.updated_at, team_members.created_at) DESC")
		}

		if err := query.Offset(offset).Limit(limit).Find(&teamMembers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch team members"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  teamMembers,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	}
}

func getTeamMemberAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var teamMember models.TeamMember

		if err := db.Preload("Role").First(&teamMember, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team member not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": teamMember})
	}
}