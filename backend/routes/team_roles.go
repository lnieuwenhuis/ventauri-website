package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupTeamRolesRoutes(router *gin.Engine, db *gorm.DB) {
	// Protected admin routes only
	auth := utils.NewAuthService(db)
	adminTeamRoles := router.Group("/api/admin/team-roles")
	adminTeamRoles.Use(auth.AdminMiddleware())
	{
		adminTeamRoles.POST("/", createTeamRole(db))
		adminTeamRoles.PUT("/:id", updateTeamRole(db))
		adminTeamRoles.DELETE("/:id", deleteTeamRole(db))
		adminTeamRoles.GET("/", getAllTeamRolesAdmin(db))
		adminTeamRoles.GET("/:id", getTeamRoleAdmin(db))
	}
}

func createTeamRole(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var teamRole models.TeamRoles
		if err := c.ShouldBindJSON(&teamRole); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&teamRole).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create team role"})
			return
		}

		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTeamRoleCreated, "New team role '"+teamRole.Name+"' created", utils.StringPtr("team_role"), utils.StringPtr(teamRole.ID.String()), nil)

		c.JSON(http.StatusCreated, gin.H{"data": teamRole})
	}
}

func updateTeamRole(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var teamRole models.TeamRoles

		if err := db.First(&teamRole, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team role not found"})
			return
		}

		if err := c.ShouldBindJSON(&teamRole); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&teamRole).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update team role"})
			return
		}

		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTeamRoleUpdated, "Team role '"+teamRole.Name+"' updated", utils.StringPtr("team_role"), utils.StringPtr(teamRole.ID.String()), nil)

		c.JSON(http.StatusOK, gin.H{"data": teamRole})
	}
}

func deleteTeamRole(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// Check if any team members are using this role
		var count int64
		if err := db.Model(&models.TeamMember{}).Where("role_id = ?", id).Count(&count).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check role usage"})
			return
		}

		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete role that is assigned to team members"})
			return
		}

		// Get role name before deletion
		var teamRole models.TeamRoles
		db.First(&teamRole, "id = ?", id)

		if err := db.Delete(&models.TeamRoles{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete team role"})
			return
		}

		// Add activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTeamRoleDeleted, "Team role '"+teamRole.Name+"' deleted", utils.StringPtr("team_role"), utils.StringPtr(id), nil)

		c.JSON(http.StatusOK, gin.H{"message": "Team role deleted successfully"})
	}
}

func getAllTeamRolesAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var teamRoles []models.TeamRoles
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")
		sortBy := c.DefaultQuery("sort", "name")

		query := db.Model(&models.TeamRoles{})

		if search != "" {
			query = query.Where("name ILIKE ? OR description ILIKE ?",
				"%"+search+"%", "%"+search+"%")
		}

		var total int64
		query.Count(&total)

		// Handle sorting
		var orderClause string
		switch sortBy {
		case "name":
			orderClause = "name ASC"
		case "newest":
			orderClause = "created_at DESC"
		case "oldest":
			orderClause = "created_at ASC"
		default:
			orderClause = "name ASC"
		}

		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Order(orderClause).Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&teamRoles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch team roles"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  teamRoles,
			"total": total,
			"page":  utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getTeamRoleAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var teamRole models.TeamRoles

		if err := db.First(&teamRole, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team role not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": teamRole})
	}
}