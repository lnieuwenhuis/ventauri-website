package utils

import (
	"log"
	"os"
	"strconv"

	"golang.org/x/crypto/bcrypt"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"ventauri-merch/models"
)

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
	)
}

func SeedDatabase(db *gorm.DB) {
	log.Println("🌱 Starting database seeding...")
	
	seedUsers(db)
	seedCategories(db)
	seedProducts(db)
	seedProductVariants(db)
	seedAddresses(db)
	seedPaymentMethods(db)
	seedOrders(db)
	seedReviews(db)
	
	log.Println("✅ Database seeding completed!")
}

func seedUsers(db *gorm.DB) {
	// Check if users already exist
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("Users already exist, skipping user seeding")
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
		{
			Email:     "user@ventauri.com",
			Password:  &userPassword,
			Role:      models.UserRoleUser,
			FirstName: "User",
			LastName:  "User",
			Phone:     "0123456789",
			IsActive:  true,
		},
	}

	for _, user := range users {
		if err := db.Create(&user).Error; err != nil {
			log.Printf("Failed to create seed user %s: %v", user.Email, err)
		} else {
			log.Printf("✅ Created seed user: %s (%s)", user.Email, user.Role)
		}
	}
}

// Add this helper function
func hashPassword(password string) string {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}
	return string(hashed)
}

func seedCategories(db *gorm.DB) {
	// Check if categories already exist
	var count int64
	db.Model(&models.Category{}).Count(&count)
	if count > 0 {
		log.Println("Categories already exist, skipping category seeding")
		return
	}

	categories := []models.Category{
		{Name: "T-Shirts", Desc: "Comfortable cotton t-shirts"},
		{Name: "Hoodies", Desc: "Warm and cozy hoodies"},
		{Name: "Accessories", Desc: "Various merchandise accessories"},
	}

	for _, category := range categories {
		if err := db.Create(&category).Error; err != nil {
			log.Printf("Failed to create seed category %s: %v", category.Name, err)
		} else {
			log.Printf("✅ Created seed category: %s", category.Name)
		}
	}
}

func seedProducts(db *gorm.DB) {
	// Check if products already exist
	var count int64
	db.Model(&models.Product{}).Count(&count)
	if count > 0 {
		log.Println("Products already exist, skipping product seeding")
		return
	}

	// Get categories from database
	var categories []models.Category
	db.Find(&categories)
	if len(categories) < 3 {
		log.Printf("Not enough categories found (%d), need at least 3 for product seeding", len(categories))
		return
	}

	products := []models.Product{
		{
			Name:        "Ventauri Classic T-Shirt",
			Description: "Comfortable cotton t-shirt with Ventauri logo",
			Price:       19.99,
			CategoryID:  categories[0].ID,
			SKU:         "VEN-TSHIRT-001",
			Weight:      0.2,
			Images: 	 `["tshirt1.jpg", "tshirt2.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Hoodie",
			Description: "Warm and cozy hoodie perfect for cold days",
			Price:       49.99,
			CategoryID:  categories[1].ID,
			SKU:         "VEN-HOODIE-001",
			Weight:      0.8,
			Images:      `["tshirt1.jpg", "tshirt2.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Cap",
			Description: "Stylish cap with embroidered logo",
			Price:       24.99,
			CategoryID:  categories[2].ID,
			SKU:         "VEN-CAP-001",
			Weight:      0.15,
			Images:      `["tshirt1.jpg", "tshirt2.jpg"]`,
			IsActive:    true,
		},
	}

	for _, product := range products {
		if err := db.Create(&product).Error; err != nil {
			log.Printf("Failed to create seed product %s: %v", product.Name, err)
		} else {
			log.Printf("✅ Created seed product: %s", product.Name)
		}
	}
}

func seedProductVariants(db *gorm.DB) {
	// Check if product variants already exist
	var count int64
	db.Model(&models.ProductVariant{}).Count(&count)
	if count > 0 {
		log.Println("Product variants already exist, skipping variant seeding")
		return
	}

	// Get products from database
	var products []models.Product
	db.Find(&products)
	if len(products) == 0 {
		log.Println("No products found, skipping variant seeding")
		return
	}

	productVariants := []models.ProductVariant{
		// T-Shirt variants
		{
			ProductID:   products[0].ID,
			SKU:         "VEN-TSHIRT-001-S-RED",
			Size:        "S",
			Color:       "Red",
			Stock:       25,
			PriceAdjust: 0,
			Weight:      0.2,
			IsActive:    true,
		},
		{
			ProductID:   products[0].ID,
			SKU:         "VEN-TSHIRT-001-M-RED",
			Size:        "M",
			Color:       "Red",
			Stock:       30,
			PriceAdjust: 0,
			Weight:      0.2,
			IsActive:    true,
		},
		{
			ProductID:   products[0].ID,
			SKU:         "VEN-TSHIRT-001-L-RED",
			Size:        "L",
			Color:       "Red",
			Stock:       20,
			PriceAdjust: 0,
			Weight:      0.2,
			IsActive:    true,
		},
		// Hoodie variants
		{
			ProductID:   products[1].ID,
			SKU:         "VEN-HOODIE-001-M-BLUE",
			Size:        "M",
			Color:       "Blue",
			Stock:       15,
			PriceAdjust: 0,
			Weight:      0.8,
			IsActive:    true,
		},
		{
			ProductID:   products[1].ID,
			SKU:         "VEN-HOODIE-001-L-BLUE",
			Size:        "L",
			Color:       "Blue",
			Stock:       12,
			PriceAdjust: 0,
			Weight:      0.8,
			IsActive:    true,
		},
	}

	for _, variant := range productVariants {
		if err := db.Create(&variant).Error; err != nil {
			log.Printf("Failed to create seed product variant %s: %v", variant.SKU, err)
		} else {
			log.Printf("✅ Created seed product variant: %s", variant.SKU)
		}
	}
}

func seedAddresses(db *gorm.DB) {
	// Check if addresses already exist
	var count int64
	db.Model(&models.Address{}).Count(&count)
	if count > 0 {
		log.Println("Addresses already exist, skipping address seeding")
		return
	}

	// Get users from database
	var users []models.User
	db.Find(&users)
	if len(users) < 2 {
		log.Println("Not enough users found, skipping address seeding")
		return
	}

	addresses := []models.Address{
		{
			UserID:    users[0].ID,
			Street:    "123 Admin Street",
			City:      "Admin City",
			State:     "AC",
			ZipCode:   "12345",
			Country:   "USA",
			IsDefault: true,
		},
		{
			UserID:    users[1].ID,
			Street:    "456 User Avenue",
			City:      "User City",
			State:     "UC",
			ZipCode:   "67890",
			Country:   "USA",
			IsDefault: true,
		},
	}

	for _, address := range addresses {
		if err := db.Create(&address).Error; err != nil {
			log.Printf("Failed to create seed address: %v", err)
		} else {
			log.Printf("✅ Created seed address for user %s", address.UserID)
		}
	}
}

func seedPaymentMethods(db *gorm.DB) {
	// Check if payment methods already exist
	var count int64
	db.Model(&models.PaymentMethod{}).Count(&count)
	if count > 0 {
		log.Println("Payment methods already exist, skipping payment method seeding")
		return
	}

	// Get users from database
	var users []models.User
	db.Find(&users)
	if len(users) < 2 {
		log.Println("Not enough users found, skipping payment method seeding")
		return
	}

	paymentMethods := []models.PaymentMethod{
		{
			UserID:      users[0].ID,
			Type:        models.PaymentMethodCreditCard,
			Provider:    "Visa",
			Last4:       "1234",
			ExpiryMonth: 12,
			ExpiryYear:  2025,
			HolderName:  "Admin Admin",
			IsDefault:   true,
		},
		{
			UserID:      users[1].ID,
			Type:        models.PaymentMethodCreditCard,
			Provider:    "Mastercard",
			Last4:       "5678",
			ExpiryMonth: 6,
			ExpiryYear:  2026,
			HolderName:  "User User",
			IsDefault:   true,
		},
	}

	for _, pm := range paymentMethods {
		if err := db.Create(&pm).Error; err != nil {
			log.Printf("Failed to create seed payment method: %v", err)
		} else {
			log.Printf("✅ Created seed payment method for user %s", pm.UserID)
		}
	}
}

func seedOrders(db *gorm.DB) {
	// Check if orders already exist
	var count int64
	db.Model(&models.Order{}).Count(&count)
	if count > 0 {
		log.Println("Orders already exist, skipping order seeding")
		return
	}

	// Get required data from database
	var users []models.User
	var products []models.Product
	var addresses []models.Address
	var paymentMethods []models.PaymentMethod

	db.Find(&users)
	db.Find(&products)
	db.Find(&addresses)
	db.Find(&paymentMethods)

	if len(users) < 2 || len(products) < 1 || len(addresses) < 2 || len(paymentMethods) < 2 {
		log.Println("Not enough data found for order seeding")
		return
	}

	orders := []models.Order{
		{
			UserID:            users[0].ID,
			ProductID:         products[0].ID,
			Quantity:          2,
			Subtotal:          39.98,
			Tax:               3.20,
			Shipping:          5.99,
			Total:             49.17,
			Status:            "completed",
			ShippingAddressID: addresses[0].ID,
			BillingAddressID:  addresses[0].ID,
			PaymentMethodID:   &paymentMethods[0].ID,
			OrderNumber:       "ORD-001",
		},
		{
			UserID:            users[1].ID,
			ProductID:         products[1].ID,
			Quantity:          1,
			Subtotal:          49.99,
			Tax:               4.00,
			Shipping:          5.99,
			Total:             59.98,
			Status:            "pending",
			ShippingAddressID: addresses[1].ID,
			BillingAddressID:  addresses[1].ID,
			PaymentMethodID:   &paymentMethods[1].ID,
			OrderNumber:       "ORD-002",
		},
	}

	for _, order := range orders {
		if err := db.Create(&order).Error; err != nil {
			log.Printf("Failed to create seed order for user %s: %v", order.UserID, err)
		} else {
			log.Printf("✅ Created seed order %s for user %s", order.OrderNumber, order.UserID)
		}
	}
}

func seedReviews(db *gorm.DB) {
	// Check if reviews already exist
	var count int64
	db.Model(&models.Review{}).Count(&count)
	if count > 0 {
		log.Println("Reviews already exist, skipping review seeding")
		return
	}

	// Get required data from database
	var users []models.User
	var products []models.Product
	var orders []models.Order

	db.Find(&users)
	db.Find(&products)
	db.Find(&orders)

	if len(users) < 2 || len(products) < 2 || len(orders) < 2 {
		log.Println("Not enough data found for review seeding")
		return
	}

	reviews := []models.Review{
		{
			UserID:     users[1].ID,
			ProductID:  products[0].ID,
			OrderID:    orders[0].ID,
			Rating:     5,
			Title:      "Great product!",
			Comment:    "Really love this item, great quality!",
			IsVerified: true,
			IsApproved: true,
		},
		{
			UserID:     users[1].ID,
			ProductID:  products[1].ID,
			OrderID:    orders[1].ID,
			Rating:     4,
			Title:      "Good value",
			Comment:    "Nice product for the price.",
			IsVerified: true,
			IsApproved: true,
		},
	}

	for _, review := range reviews {
		if err := db.Create(&review).Error; err != nil {
			log.Printf("Failed to create seed review: %v", err)
		} else {
			log.Printf("✅ Created seed review for product %s", review.ProductID)
		}
	}
}