package seeders

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedUsers(db *gorm.DB) {
	// Check if users already exist
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		return
	}

	// Hash passwords
	adminPassword := hashPassword("password")
	userPassword := hashPassword("password")

	users := []models.User{
		{
			Email:     "admin@ventauri.com",
			Password:  &adminPassword,
			Role:      models.UserRoleAdmin,
			FirstName: "Admin",
			LastName:  "Admin",
			Phone:     "0123456789",
			IsActive:  true,
		},
	}

	// Create 14 regular users
	for i := 1; i <= 14; i++ {
		users = append(users, models.User{
			Email:     fmt.Sprintf("user%d@ventauri.com", i),
			Password:  &userPassword,
			Role:      models.UserRoleUser,
			FirstName: fmt.Sprintf("User%d", i),
			LastName:  fmt.Sprintf("LastName%d", i),
			Phone:     fmt.Sprintf("012345678%d", i%10),
			IsActive:  true,
		})
	}

	createdCount := 0
	for _, user := range users {
		if err := db.Create(&user).Error; err != nil {
			log.Printf("Failed to create user %s: %v", user.Email, err)
		} else {
			createdCount++
		}
	}
	log.Printf("Created %d users", createdCount)
}

// Helper function
func hashPassword(password string) string {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}
	return string(hashed)
}