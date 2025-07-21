package seeders

import (
	"fmt"
	"log"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedPaymentMethods(db *gorm.DB) {
	// Check if payment methods already exist
	var count int64
	db.Model(&models.PaymentMethod{}).Count(&count)
	if count > 0 {
		return
	}

	// Get users from database
	var users []models.User
	db.Find(&users)
	if len(users) < 15 {
		log.Println("Not enough users found, skipping payment method seeding")
		return
	}

	providers := []string{"Visa", "Mastercard", "American Express", "Discover"}
	paymentCount := 0

	// Create 1 payment method per user (15 total)
	for i, user := range users {
		if paymentCount >= 15 {
			break
		}
		pm := models.PaymentMethod{
			UserID:      user.ID,
			Type:        models.PaymentMethodCreditCard,
			Provider:    providers[i%len(providers)],
			Last4:       fmt.Sprintf("%04d", 1000+(i*111)),
			ExpiryMonth: (i%12) + 1,
			ExpiryYear:  2025 + (i % 3),
			HolderName:  fmt.Sprintf("%s %s", user.FirstName, user.LastName),
			IsDefault:   true,
		}

		if err := db.Create(&pm).Error; err != nil {
			log.Printf("Failed to create seed payment method: %v", err)
		} else {
			paymentCount++
		}
	}
	log.Printf("Created %d payment methods", paymentCount)
}