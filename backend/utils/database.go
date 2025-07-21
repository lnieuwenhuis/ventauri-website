package utils

import (
	"log"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/seeders"
)

// Helper function to create activity records
func CreateActivity(db *gorm.DB, userID *uuid.UUID, activityType models.ActivityType, description string, entityType *string, entityID *string, metadata *string) error {
	activity := models.Activity{
		UserID:      userID,
		Type:        activityType,
		Description: description,
		EntityType:  entityType,
		EntityID:    entityID,
		Metadata:    metadata,
	}
	
	return db.Create(&activity).Error
}

// ParseInt converts a string to int with a default value if conversion fails
func ParseInt(s string, defaultValue int) int {
	if s == "" {
		return defaultValue
	}
	
	value, err := strconv.Atoi(s)
	if err != nil {
		return defaultValue
	}
	
	return value
}

func StringPtr(s string) *string {
	return &s
}

func InitDatabase() *gorm.DB {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Failed to load .env file")
	}

	// Get environment variables
	dbHost := os.Getenv("MARIADB_HOST")
	dbPort := os.Getenv("MARIADB_PORT")
	dbUser := os.Getenv("MARIADB_USER")
	dbPassword := os.Getenv("MARIADB_PASSWORD")
	dbName := os.Getenv("MARIADB_DATABASE")

	// Create connection string
	dsn := dbUser + ":" + dbPassword + "@tcp(" + dbHost + ":" + dbPort + ")/" + dbName + "?charset=utf8mb4&parseTime=True&loc=Local"

	// Connect to database
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database")
	}

	log.Println("Successfully connected to database")
	return db
}

func MigrateDatabase(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Category{},
		&models.Product{},
		&models.ProductVariant{},
		&models.Address{},
		&models.PaymentMethod{},
		&models.Order{},
		&models.Cart{},
		&models.Review{},
		&models.Coupon{},
		&models.Wishlist{},
		&models.Activity{},
		&models.TeamRoles{},
		&models.TeamMember{},
		&models.Competition{},
	)
}

func SeedDatabase(db *gorm.DB) {
	seeders.SeedAll(db)
}