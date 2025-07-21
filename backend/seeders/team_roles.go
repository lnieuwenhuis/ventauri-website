package seeders

import (
	"log"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedTeamRoles(db *gorm.DB) {
	// Check if team roles already exist
	var count int64
	db.Model(&models.TeamRoles{}).Count(&count)
	if count > 0 {
		return
	}

	// Create 5 team roles
	teamRoles := []models.TeamRoles{
		{
			Name:        "Driver",
			Description: "Professional racing driver responsible for driving the car during races and practice sessions.",
		},
		{
			Name:        "Engineer",
			Description: "Technical engineer responsible for car setup, data analysis, and performance optimization.",
		},
		{
			Name:        "Mechanic",
			Description: "Skilled mechanic responsible for car maintenance, repairs, and pit stop operations.",
		},
		{
			Name:        "Strategist",
			Description: "Race strategist responsible for race planning, tire strategy, and tactical decisions.",
		},
		{
			Name:        "Manager",
			Description: "Team manager responsible for overall team coordination and operations management.",
		},
	}

	createdCount := 0
	for _, role := range teamRoles {
		if err := db.Create(&role).Error; err != nil {
			log.Printf("Failed to create seed team role %s: %v", role.Name, err)
		} else {
			createdCount++
		}
	}
	log.Printf("Created %d team roles", createdCount)
}