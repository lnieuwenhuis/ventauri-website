package seeders

import (
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedCompetitions(db *gorm.DB) {
	// Check if competitions already exist
	var count int64
	db.Model(&models.Competition{}).Count(&count)
	if count > 0 {
		return
	}

	// Get team members for personnel assignment
	var teamMembers []models.TeamMember
	db.Find(&teamMembers)
	
	// Filter drivers and engineers
	var drivers, engineers []uuid.UUID
	for _, member := range teamMembers {
		var role models.TeamRoles
		db.First(&role, "id = ?", member.RoleID)
		switch role.Name {
			case "Driver":
				drivers = append(drivers, member.ID)
			case "Engineer":
				engineers = append(engineers, member.ID)
			default:
				continue
		}
	}

	// Create 5 sample competitions
	competitions := []models.Competition{
		{
			Name:     "Formula Ventauri Championship 2024",
			Desc:     "The premier racing championship featuring the best drivers and teams from around the world.",
			Schedule: models.TrackSlice{
				{
					ID:       uuid.New(),
					Name:     "Monaco Grand Prix",
					DateTime: time.Date(2024, 5, 26, 14, 0, 0, 0, time.UTC),
					Status:   "past",
					Personnel: func() []uuid.UUID {
						if len(drivers) >= 2 && len(engineers) >= 2 {
							return []uuid.UUID{drivers[0], drivers[1], engineers[0], engineers[1]}
						}
						return []uuid.UUID{}
					}(),
					Results: func() []struct {
						Driver        uuid.UUID `json:"driver"`
						QualiPosition int       `json:"quali_position"`
						RacePosition  int       `json:"race_position"`
					} {
						if len(drivers) >= 2 {
							return []struct {
								Driver        uuid.UUID `json:"driver"`
								QualiPosition int       `json:"quali_position"`
								RacePosition  int       `json:"race_position"`
							}{
								{Driver: drivers[0], QualiPosition: 1, RacePosition: 1},
								{Driver: drivers[1], QualiPosition: 2, RacePosition: 2},
							}
						}
						return nil
					}(),
				},
				{
					ID:       uuid.New(),
					Name:     "Silverstone Circuit",
					DateTime: time.Date(2024, 7, 7, 15, 0, 0, 0, time.UTC),
					Status:   "next",
				},
				{
					ID:       uuid.New(),
					Name:     "Spa-Francorchamps",
					DateTime: time.Date(2024, 8, 25, 15, 0, 0, 0, time.UTC),
					Status:   "future",
				},
			},
			IsActive: true,
			Position: 1,
			Points:   0,
		},
		{
			Name:     "Ventauri Sprint Series",
			Desc:     "Fast-paced sprint races featuring shorter distances and intense competition.",
			Schedule: models.TrackSlice{
				{
					ID:       uuid.New(),
					Name:     "Imola Circuit",
					DateTime: time.Date(2024, 4, 21, 13, 30, 0, 0, time.UTC),
					Status:   "past",
					Personnel: func() []uuid.UUID {
						if len(drivers) >= 2 && len(engineers) >= 2 {
							return []uuid.UUID{drivers[0], drivers[1], engineers[0], engineers[1]}
						}
						return []uuid.UUID{}
					}(),
					Results: func() []struct {
						Driver        uuid.UUID `json:"driver"`
						QualiPosition int       `json:"quali_position"`
						RacePosition  int       `json:"race_position"`
					} {
						if len(drivers) >= 2 {
							return []struct {
								Driver        uuid.UUID `json:"driver"`
								QualiPosition int       `json:"quali_position"`
								RacePosition  int       `json:"race_position"`
							}{
								{Driver: drivers[0], QualiPosition: 3, RacePosition: 1},
								{Driver: drivers[1], QualiPosition: 1, RacePosition: 3},
							}
						}
						return nil
					}(),
				},
				{
					ID:       uuid.New(),
					Name:     "Red Bull Ring",
					DateTime: time.Date(2024, 6, 30, 14, 0, 0, 0, time.UTC),
					Status:   "next",
				},
			},
			IsActive: true,
			Position: 2,
			Points:   0,
		},
		{
			Name:     "Ventauri Endurance Cup",
			Desc:     "Long-distance endurance racing testing both driver skill and car reliability.",
			Schedule: models.TrackSlice{
				{
					ID:       uuid.New(),
					Name:     "Le Mans Circuit",
					DateTime: time.Date(2024, 6, 15, 15, 0, 0, 0, time.UTC),
					Status:   "next",
				},
				{
					ID:       uuid.New(),
					Name:     "Nürburgring",
					DateTime: time.Date(2024, 9, 22, 14, 0, 0, 0, time.UTC),
					Status:   "future",
				},
				{
					ID:       uuid.New(),
					Name:     "Sebring International",
					DateTime: time.Date(2024, 3, 16, 12, 0, 0, 0, time.UTC),
					Status:   "past",
					Personnel: func() []uuid.UUID {
						if len(drivers) >= 2 && len(engineers) >= 2 {
							return []uuid.UUID{drivers[0], drivers[1], engineers[0], engineers[1]}
						}
						return []uuid.UUID{}
					}(),
					Results: func() []struct {
						Driver        uuid.UUID `json:"driver"`
						QualiPosition int       `json:"quali_position"`
						RacePosition  int       `json:"race_position"`
					} {
						if len(drivers) >= 2 {
							return []struct {
								Driver        uuid.UUID `json:"driver"`
								QualiPosition int       `json:"quali_position"`
								RacePosition  int       `json:"race_position"`
							}{
								{Driver: drivers[0], QualiPosition: 2, RacePosition: 2},
								{Driver: drivers[1], QualiPosition: 4, RacePosition: 1},
							}
						}
						return nil
					}(),
				},
			},
			IsActive: true,
			Position: 3,
			Points:   0,
		},
		{
			Name:     "Rookie Championship",
			Desc:     "Development series for upcoming drivers to showcase their talent.",
			Schedule: models.TrackSlice{
				{
					ID:       uuid.New(),
					Name:     "Brands Hatch",
					DateTime: time.Date(2024, 5, 12, 13, 0, 0, 0, time.UTC),
					Status:   "past",
					Personnel: func() []uuid.UUID {
						if len(drivers) >= 2 && len(engineers) >= 2 {
							return []uuid.UUID{drivers[0], drivers[1], engineers[0], engineers[1]}
						}
						return []uuid.UUID{}
					}(),
					Results: func() []struct {
						Driver        uuid.UUID `json:"driver"`
						QualiPosition int       `json:"quali_position"`
						RacePosition  int       `json:"race_position"`
					} {
						if len(drivers) >= 2 {
							return []struct {
								Driver        uuid.UUID `json:"driver"`
								QualiPosition int       `json:"quali_position"`
								RacePosition  int       `json:"race_position"`
							}{
								{Driver: drivers[0], QualiPosition: 1, RacePosition: 3},
								{Driver: drivers[1], QualiPosition: 3, RacePosition: 1},
							}
						}
						return nil
					}(),
				},
				{
					ID:       uuid.New(),
					Name:     "Donington Park",
					DateTime: time.Date(2024, 8, 18, 14, 30, 0, 0, time.UTC),
					Status:   "next",
				},
			},
			IsActive: true,
			Position: 4,
			Points:   0,
		},
		{
			Name:     "Historic Ventauri Series",
			Desc:     "Classic car racing featuring vintage Ventauri vehicles from past decades.",
			Schedule: models.TrackSlice{
				{
					ID:       uuid.New(),
					Name:     "Goodwood Circuit",
					DateTime: time.Date(2024, 9, 8, 15, 30, 0, 0, time.UTC),
					Status:   "next",
				},
				{
					ID:       uuid.New(),
					Name:     "Laguna Seca",
					DateTime: time.Date(2024, 10, 13, 16, 0, 0, 0, time.UTC),
					Status:   "future",
				},
				{
					ID:       uuid.New(),
					Name:     "Watkins Glen",
					DateTime: time.Date(2024, 11, 3, 14, 0, 0, 0, time.UTC),
					Status:   "future",
				},
			},
			IsActive: false,
			Position: 5,
			Points:   0,
		},
	}

	createdCount := 0
	for _, competition := range competitions {
		if err := db.Create(&competition).Error; err != nil {
			log.Printf("Failed to create competition %s: %v", competition.Name, err)
		} else {
			createdCount++
		}
	}
	log.Printf("Created %d competitions", createdCount)
}