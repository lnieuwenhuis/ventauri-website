package routes

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupCompetitionRoutes(router *gin.Engine, db *gorm.DB) {
	competitions := router.Group("/api/competitions")
	{
		// Public routes
		competitions.GET("/", getCompetitions(db))
		competitions.GET("/championship-stats", getChampionshipStats(db))
		competitions.GET("/:id", getCompetition(db))
	}

	// Protected admin routes
	auth := utils.NewAuthService(db)
	adminCategories := router.Group("/api/admin/competitions")
	adminCategories.Use(auth.AdminMiddleware())
	{
		adminCategories.POST("/", createCompetition(db))
		adminCategories.PUT("/:id", updateCompetition(db))
		adminCategories.DELETE("/:id", deleteCompetition(db))
		adminCategories.PUT("/:id/status", toggleCompetitionStatus(db))
		adminCategories.GET("/", getAllCompetitionsAdmin(db))
		adminCategories.GET("/:id", getCompetitionAdmin(db))
		adminCategories.POST("/tracks", createTrack(db))
		adminCategories.PUT("/tracks/:id", updateTrack(db))
		adminCategories.PUT("/tracks/:id/status", toggleTrackStatus(db))
		adminCategories.DELETE("/tracks/:id", deleteTrack(db))
	}
}

func getCompetitions(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var competitions []models.Competition
		if err := db.Where("is_active = ?", true).Find(&competitions).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch competitions"})
			return
		}
		
		// Preload personnel for each competition
		for i := range competitions {
			if err := preloadPersonnelForCompetition(db, &competitions[i]); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to preload personnel data"})
				return
			}
		}
		
		c.JSON(http.StatusOK, competitions)
	}
}

func getCompetition(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var competition models.Competition
		if err := db.Where("id = ?", id).First(&competition).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
			return
		}
		
		// Preload personnel data
		if err := preloadPersonnelForCompetition(db, &competition); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to preload personnel data"})
			return
		}
		
		c.JSON(http.StatusOK, competition)
	}
}

func getAllCompetitionsAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var competitions []models.Competition
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")

		query := db.Model(&models.Competition{})

		if search != "" {
			query = query.Where("name ILIKE ? OR desc ILIKE ?", "%"+search+"%", "%"+search+"%")
		}

		var total int64
		query.Count(&total)

		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Order("created_at desc").Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&competitions).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch competitions"})
			return
		}
		
		// Preload personnel for each competition
		for i := range competitions {
			if err := preloadPersonnelForCompetition(db, &competitions[i]); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to preload personnel data"})
				return
			}
		}
		
		c.JSON(http.StatusOK, gin.H{
			"data":  competitions,
			"total": total,
			"page":  utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getCompetitionAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var competition models.Competition

		if err := db.First(&competition, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
			return
		}
		
		// Preload personnel data
		if err := preloadPersonnelForCompetition(db, &competition); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to preload personnel data"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"data": competition})
	}
}

func createCompetition(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var competition models.Competition
		if err := c.ShouldBindJSON(&competition); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&competition).Error; err!= nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create competition"})
			return
		}

		// Activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCompetitionCreated, "New competition '" + competition.Name + "' created", utils.StringPtr(competition.ID.String()), utils.StringPtr(competition.ID.String()), nil)

		c.JSON(http.StatusCreated, competition)
	}
}

func updateCompetition(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var competition models.Competition

		if err := db.Where("id = ?", id).First(&competition).Error; err!= nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
			return
		}

		if err := c.ShouldBindJSON(&competition); err!= nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&competition).Error; err!= nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update competition"})
			return
		}
		// Activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCompetitionUpdated, "Competition '" + competition.Name + "' updated", utils.StringPtr(competition.ID.String()), utils.StringPtr(competition.ID.String()), nil)
		c.JSON(http.StatusOK, competition)
	}
}

func deleteCompetition(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var competition models.Competition

		db.First(&competition, "id = ?", id)
		if err := db.Where("id =?", id).Delete(&competition).Error; err!= nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete competition"})
			return
		}
		// Activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCompetitionDeleted, "Competition '" + competition.Name + "' deleted", utils.StringPtr(competition.ID.String()), utils.StringPtr(competition.ID.String()), nil)
		c.JSON(http.StatusOK, gin.H{"message": "Competition deleted"})
	}
}

func toggleCompetitionStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var competition models.Competition
		if err := db.Where("id =?", id).First(&competition).Error; err!= nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
			return
		}
		if competition.IsActive  {
			competition.IsActive = false
		}
		if !competition.IsActive {
			competition.IsActive = true
		}

		if err := db.Save(&competition).Error; err!= nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update competition status"})
			return
		}
		// Activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityCompetitionUpdated, "Competition '" + competition.Name + "' status updated", utils.StringPtr(competition.ID.String()), utils.StringPtr(competition.ID.String()), nil)
		c.JSON(http.StatusOK, competition)
	}
}

func createTrack(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		competitionID := c.Query("competition_id")
		if competitionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "competition_id is required"})
			return
		}

		var track models.Track
		if err := c.ShouldBindJSON(&track); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate UUID for the new track
		track.ID = uuid.New()

		// Find the competition
		var competition models.Competition
		if err := db.Where("id = ?", competitionID).First(&competition).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
			return
		}

		// Add track to the schedule
		competition.Schedule = append(competition.Schedule, track)

		// Save the competition
		if err := db.Save(&competition).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create track"})
			return
		}

		// Activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTrackCreated, "New track '"+track.Name+"' created", utils.StringPtr(track.ID.String()), utils.StringPtr(competition.ID.String()), nil)

		c.JSON(http.StatusCreated, track)
	}
}

func updateTrack(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		trackID := c.Param("id")
		competitionID := c.Query("competition_id")
		if competitionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "competition_id is required"})
			return
		}

		var updatedTrack models.Track
		if err := c.ShouldBindJSON(&updatedTrack); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Find the competition
		var competition models.Competition
		if err := db.Where("id = ?", competitionID).First(&competition).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
			return
		}

		// Find and update the track in the schedule
		trackFound := false
		for i, track := range competition.Schedule {
			if track.ID.String() == trackID {
				updatedTrack.ID = track.ID // Preserve the original ID
				competition.Schedule[i] = updatedTrack
				trackFound = true
				break
			}
		}

		if !trackFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Track not found"})
			return
		}

		// Save the competition
		if err := db.Save(&competition).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update track"})
			return
		}

		// Activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTrackUpdated, "Track '"+updatedTrack.Name+"' updated", utils.StringPtr(updatedTrack.ID.String()), utils.StringPtr(competition.ID.String()), nil)

		c.JSON(http.StatusOK, updatedTrack)
	}
}

func toggleTrackStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		trackID := c.Param("id")
		competitionID := c.Query("competition_id")
		if competitionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "competition_id is required"})
			return
		}

		// Find the competition
		var competition models.Competition
		if err := db.Where("id = ?", competitionID).First(&competition).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
			return
		}

		// Find and cycle the track status
		trackFound := false
		var updatedTrack models.Track
		for i, track := range competition.Schedule {
			if track.ID.String() == trackID {
				// Cycle through status: past -> next -> future -> past
				switch track.Status {
				case "past":
					competition.Schedule[i].Status = "next"
				case "next":
					competition.Schedule[i].Status = "future"
				case "future":
					competition.Schedule[i].Status = "past"
				default:
					competition.Schedule[i].Status = "next"
				}
				updatedTrack = competition.Schedule[i]
				trackFound = true
				break
			}
		}

		if !trackFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Track not found"})
			return
		}

		// Save the competition
		if err := db.Save(&competition).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update track status"})
			return
		}

		// Activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTrackUpdated, "Track '"+updatedTrack.Name+"' status updated to "+updatedTrack.Status, utils.StringPtr(updatedTrack.ID.String()), utils.StringPtr(competition.ID.String()), nil)

		c.JSON(http.StatusOK, updatedTrack)
	}
}

func deleteTrack(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		trackID := c.Param("id")
		competitionID := c.Query("competition_id")
		if competitionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "competition_id is required"})
			return
		}

		// Find the competition
		var competition models.Competition
		if err := db.Where("id = ?", competitionID).First(&competition).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
			return
		}

		// Find and remove the track from the schedule
		trackFound := false
		var deletedTrack models.Track
		for i, track := range competition.Schedule {
			if track.ID.String() == trackID {
				deletedTrack = track
				// Remove track from slice
				competition.Schedule = append(competition.Schedule[:i], competition.Schedule[i+1:]...)
				trackFound = true
				break
			}
		}

		if !trackFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Track not found"})
			return
		}

		// Save the competition
		if err := db.Save(&competition).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete track"})
			return
		}

		// Activity tracking
		currentUser, _ := utils.GetCurrentUser(c)
		utils.CreateActivity(db, &currentUser.ID, models.ActivityTrackDeleted, "Track '"+deletedTrack.Name+"' deleted", utils.StringPtr(deletedTrack.ID.String()), utils.StringPtr(competition.ID.String()), nil)

		c.JSON(http.StatusOK, gin.H{"message": "Track deleted"})
	}
}

func preloadPersonnelForCompetition(db *gorm.DB, competition *models.Competition) error {
	for i := range competition.Schedule {
		track := &competition.Schedule[i]
		if len(track.Personnel) > 0 {
			var TeamMembers []models.TeamMember
			if err := db.Preload("Role").Where("id IN ?", track.Personnel).Find(&TeamMembers).Error; err != nil {
				return err
			}
			track.PersonnelData = TeamMembers
		}
	}
	return nil
}

type ChampionshipStats struct {
	RaceWins          int    `json:"raceWins"`
	PodiumFinishes    int    `json:"podiumFinishes"`
	ChampionshipPos   int    `json:"championshipPosition"`
	CompetitionName   string `json:"competitionName"`
}

func getChampionshipStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var competition models.Competition
		
		// Get the most recently updated active competition
		if err := db.Where("is_active = ?", true).Order("updated_at desc").First(&competition).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "No active competitions found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch competition"})
			return
		}
		
		// Calculate championship statistics
		raceWins := 0
		podiumFinishes := 0
		
		// Count wins and podiums from completed races
		for _, track := range competition.Schedule {
			if track.Status == "past" {
				for _, result := range track.Results {
					if result.RacePosition == 1 {
						raceWins++
					}
					if result.RacePosition <= 3 && result.RacePosition > 0 {
						podiumFinishes++
					}
				}
			}
		}
		
		// Create championship stats response
		stats := ChampionshipStats{
			RaceWins:          raceWins,
			PodiumFinishes:    podiumFinishes,
			ChampionshipPos:   competition.Position,
			CompetitionName:   competition.Name,
		}
		
		// Default championship position to 3 if not set
		if stats.ChampionshipPos == 0 {
			stats.ChampionshipPos = 3
		}
		
		c.JSON(http.StatusOK, stats)
	}
}
