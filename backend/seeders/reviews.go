package seeders

import (
	"log"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedReviews(db *gorm.DB) {
	// Check if reviews already exist
	var count int64
	db.Model(&models.Review{}).Count(&count)
	if count > 0 {
		return
	}

	// Get required data from database
	var users []models.User
	var products []models.Product
	var orders []models.Order

	db.Find(&users)
	db.Find(&products)
	db.Find(&orders)

	if len(users) < 10 || len(products) < 10 || len(orders) < 10 {
		log.Println("Not enough data found for review seeding")
		return
	}

	titles := []string{"Great product!", "Good value", "Excellent quality", "Love it!", "Highly recommend", "Perfect fit", "Amazing!", "Worth the price", "Fantastic", "Outstanding"}
	comments := []string{
		"Really love this item, great quality!",
		"Nice product for the price.",
		"Exceeded my expectations!",
		"Perfect for everyday use.",
		"Would definitely buy again.",
		"Great material and design.",
		"Fast shipping and great product.",
		"Exactly what I was looking for.",
		"High quality and comfortable.",
		"Excellent customer service too.",
	}

	reviewCount := 0
	// Create 15 reviews
	for i := 0; i < 15; i++ {
		userIndex := (i + 1) % len(users) // Skip admin
		if userIndex == 0 {
			userIndex = 1
		}
		productIndex := i % len(products)
		orderIndex := i % len(orders)

		review := models.Review{
			UserID:     users[userIndex].ID,
			ProductID:  products[productIndex].ID,
			OrderID:    orders[orderIndex].ID,
			Rating:     4 + (i % 2), // 4 or 5 stars
			Title:      titles[i%len(titles)],
			Comment:    comments[i%len(comments)],
			IsVerified: true,
			IsApproved: true,
		}

		if err := db.Create(&review).Error; err != nil {
			log.Printf("Failed to create seed review: %v", err)
		} else {
			reviewCount++
		}
	}
	log.Printf("Created %d reviews", reviewCount)
}