package seeders

import (
	"fmt"
	"log"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedAddresses(db *gorm.DB) {
	// Check if addresses already exist
	var count int64
	db.Model(&models.Address{}).Count(&count)
	if count > 0 {
		return
	}

	// Get users from database
	var users []models.User
	db.Find(&users)
	if len(users) < 15 {
		log.Println("Not enough users found, skipping address seeding")
		return
	}

	streets := []string{"Main Street", "Oak Avenue", "Pine Road", "Elm Drive", "Maple Lane"}
	cities := []string{"Springfield", "Riverside", "Franklin", "Georgetown", "Madison"}
	states := []string{"CA", "NY", "TX", "FL", "IL"}

	addressCount := 0
	// Create 2-3 addresses per user (total ~30-45 addresses, limit to 15)
	for i, user := range users {
		if addressCount >= 15 {
			break
		}
		numAddresses := 1
		if i < 10 { // First 10 users get 1 address, others get 1
			numAddresses = 1
		}
		for j := 0; j < numAddresses && addressCount < 15; j++ {
			address := models.Address{
				UserID:    user.ID,
				Street:    fmt.Sprintf("%d %s", 100+(i*10)+j, streets[j%len(streets)]),
				City:      cities[i%len(cities)],
				State:     states[i%len(states)],
				ZipCode:   fmt.Sprintf("%05d", 10000+(i*100)+j),
				Country:   "USA",
				IsDefault: j == 0, // First address is default
			}

			if err := db.Create(&address).Error; err != nil {
				log.Printf("Failed to create seed address: %v", err)
			} else {
				addressCount++
			}
		}
	}
	log.Printf("Created %d addresses", addressCount)
}