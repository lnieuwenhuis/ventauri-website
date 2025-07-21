package seeders

import (
	"log"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedTeamMembers(db *gorm.DB) {
	// Check if team members already exist
	var count int64
	db.Model(&models.TeamMember{}).Count(&count)
	if count > 0 {
		return
	}

	// Get team roles from database
	var teamRoles []models.TeamRoles
	db.Find(&teamRoles)
	if len(teamRoles) == 0 {
		log.Println("No team roles found, cannot seed team members")
		return
	}

	// Create a map for easy role lookup
	roleMap := make(map[string]uuid.UUID)
	for _, role := range teamRoles {
		roleMap[strings.ToLower(role.Name)] = role.ID
	}

	// Create 10 placeholder team members
	teamMembers := []models.TeamMember{
		{
			FirstName:   "John",
			LastName:    "Smith",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["driver"],
			Nationality: "American",
			Picture:     "placeholder-avatar-1.jpg",
		},
		{
			FirstName:   "Maria",
			LastName:    "Garcia",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["engineer"],
			Nationality: "Spanish",
			Picture:     "placeholder-avatar-2.jpg",
		},
		{
			FirstName:   "Alex",
			LastName:    "Johnson",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["mechanic"],
			Nationality: "British",
			Picture:     "placeholder-avatar-3.jpg",
		},
		{
			FirstName:   "Sophie",
			LastName:    "Mueller",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["strategist"],
			Nationality: "German",
			Picture:     "placeholder-avatar-4.jpg",
		},
		{
			FirstName:   "Luca",
			LastName:    "Rossi",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["driver"],
			Nationality: "Italian",
			Picture:     "placeholder-avatar-5.jpg",
		},
		{
			FirstName:   "Emma",
			LastName:    "Anderson",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["engineer"],
			Nationality: "Swedish",
			Picture:     "placeholder-avatar-6.jpg",
		},
		{
			FirstName:   "Carlos",
			LastName:    "Rodriguez",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["engineer"],
			Nationality: "Mexican",
			Picture:     "placeholder-avatar-7.jpg",
		},
		{
			FirstName:   "Yuki",
			LastName:    "Tanaka",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["driver"],
			Nationality: "Japanese",
			Picture:     "placeholder-avatar-8.jpg",
		},
		{
			FirstName:   "Pierre",
			LastName:    "Dubois",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["mechanic"],
			Nationality: "French",
			Picture:     "placeholder-avatar-9.jpg",
		},
		{
			FirstName:   "Sarah",
			LastName:    "Williams",
			Bio:         "This is placeholder data for demonstration purposes only. Replace with real team member information.",
			RoleID:      roleMap["manager"],
			Nationality: "Australian",
			Picture:     "placeholder-avatar-10.jpg",
		},
	}

	createdCount := 0
	for _, member := range teamMembers {
		if err := db.Create(&member).Error; err != nil {
			log.Printf("Failed to create team member %s %s: %v", member.FirstName, member.LastName, err)
		} else {
			createdCount++
		}
	}
	log.Printf("Created %d team members", createdCount)
}