package seeders

import (
	"log"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedWishlists(db *gorm.DB) {
	// Check if wishlists already exist
	var count int64
	db.Model(&models.Wishlist{}).Count(&count)
	if count > 0 {
		return
	}

	// Get required data from database
	var users []models.User
	var products []models.Product

	db.Find(&users)
	db.Find(&products)

	if len(users) < 10 || len(products) < 10 {
		log.Println("Not enough users or products found for wishlist seeding")
		return
	}

	wishlistCount := 0
	// Create 15 wishlist entries with multiple products per user
	for i := 1; i < len(users) && wishlistCount < 15; i++ { // Skip admin user
		user := users[i]
		// Each user gets 2-4 wishlist items
		numItems := 2 + (i % 3)
		for j := 0; j < numItems && wishlistCount < 15; j++ {
			productIndex := (i*3 + j) % len(products)
			wishlist := models.Wishlist{
				UserID:    user.ID,
				ProductID: products[productIndex].ID,
			}

			if err := db.Create(&wishlist).Error; err != nil {
				log.Printf("Failed to create seed wishlist entry: %v", err)
			} else {
				wishlistCount++
			}
		}
	}
	log.Printf("Created %d wishlist entries", wishlistCount)
}