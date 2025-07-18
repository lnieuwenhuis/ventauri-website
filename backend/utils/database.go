package utils

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"github.com/joho/godotenv"
	"github.com/google/uuid"
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
	log.Println("🌱 Starting database seeding...")
	
	seedUsers(db)
	seedCategories(db)
	seedProducts(db)
	seedProductVariants(db)
	seedAddresses(db)
	seedPaymentMethods(db)
	seedOrders(db)
	seedReviews(db)
	seedCoupons(db)
	seedWishlists(db)
	seedTeamRoles(db)
	seedTeamMembers(db)
	seedCompetitions(db)
	
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
		{Name: "Jackets", Desc: "Stylish outerwear jackets"},
		{Name: "Pants", Desc: "Comfortable casual pants"},
		{Name: "Shoes", Desc: "Trendy footwear collection"},
		{Name: "Bags", Desc: "Functional and stylish bags"},
		{Name: "Hats", Desc: "Fashionable headwear"},
		{Name: "Socks", Desc: "Comfortable socks for everyday wear"},
		{Name: "Belts", Desc: "Quality leather and fabric belts"},
		{Name: "Watches", Desc: "Stylish timepieces"},
		{Name: "Sunglasses", Desc: "UV protection eyewear"},
		{Name: "Jewelry", Desc: "Fashion jewelry and accessories"},
		{Name: "Tech Accessories", Desc: "Phone cases and tech gear"},
		{Name: "Home Decor", Desc: "Ventauri branded home items"},
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
	if len(categories) == 0 {
		log.Println("No categories found, cannot seed products")
		return
	}

	products := []models.Product{
		// T-Shirts (3 products)
		{
			Name:        "Ventauri Classic T-Shirt",
			Description: "Comfortable cotton t-shirt with Ventauri logo",
			Price:       19.99,
			CategoryID:  categories[0].ID,
			SKU:         "VEN-TSHIRT-001",
			Weight:      0.2,
			Images:      `["tshirt1.jpg", "tshirt2.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Premium T-Shirt",
			Description: "Premium quality organic cotton t-shirt",
			Price:       29.99,
			CategoryID:  categories[0].ID,
			SKU:         "VEN-TSHIRT-002",
			Weight:      0.25,
			Images:      `["tshirt3.jpg", "tshirt4.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Vintage T-Shirt",
			Description: "Retro style vintage t-shirt",
			Price:       24.99,
			CategoryID:  categories[0].ID,
			SKU:         "VEN-TSHIRT-003",
			Weight:      0.22,
			Images:      `["tshirt5.jpg", "tshirt6.jpg"]`,
			IsActive:    true,
		},
		// Hoodies (3 products)
		{
			Name:        "Ventauri Classic Hoodie",
			Description: "Warm and cozy hoodie perfect for cold days",
			Price:       49.99,
			CategoryID:  categories[1].ID,
			SKU:         "VEN-HOODIE-001",
			Weight:      0.8,
			Images:      `["hoodie1.jpg", "hoodie2.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Zip Hoodie",
			Description: "Full zip hoodie with front pockets",
			Price:       59.99,
			CategoryID:  categories[1].ID,
			SKU:         "VEN-HOODIE-002",
			Weight:      0.85,
			Images:      `["hoodie3.jpg", "hoodie4.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Oversized Hoodie",
			Description: "Trendy oversized fit hoodie",
			Price:       54.99,
			CategoryID:  categories[1].ID,
			SKU:         "VEN-HOODIE-003",
			Weight:      0.9,
			Images:      `["hoodie5.jpg", "hoodie6.jpg"]`,
			IsActive:    true,
		},
		// Accessories (2 products)
		{
			Name:        "Ventauri Cap",
			Description: "Stylish cap with embroidered logo",
			Price:       24.99,
			CategoryID:  categories[2].ID,
			SKU:         "VEN-CAP-001",
			Weight:      0.15,
			Images:      `["cap1.jpg", "cap2.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Beanie",
			Description: "Warm knitted beanie for winter",
			Price:       19.99,
			CategoryID:  categories[2].ID,
			SKU:         "VEN-BEANIE-001",
			Weight:      0.1,
			Images:      `["beanie1.jpg", "beanie2.jpg"]`,
			IsActive:    true,
		},
		// Jackets (2 products)
		{
			Name:        "Ventauri Windbreaker",
			Description: "Lightweight windbreaker jacket",
			Price:       79.99,
			CategoryID:  categories[3].ID,
			SKU:         "VEN-JACKET-001",
			Weight:      0.6,
			Images:      `["jacket1.jpg", "jacket2.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Bomber Jacket",
			Description: "Classic bomber style jacket",
			Price:       89.99,
			CategoryID:  categories[3].ID,
			SKU:         "VEN-JACKET-002",
			Weight:      0.7,
			Images:      `["jacket3.jpg", "jacket4.jpg"]`,
			IsActive:    true,
		},
		// Pants (2 products)
		{
			Name:        "Ventauri Joggers",
			Description: "Comfortable cotton joggers",
			Price:       39.99,
			CategoryID:  categories[4].ID,
			SKU:         "VEN-PANTS-001",
			Weight:      0.4,
			Images:      `["pants1.jpg", "pants2.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Cargo Pants",
			Description: "Utility cargo pants with multiple pockets",
			Price:       49.99,
			CategoryID:  categories[4].ID,
			SKU:         "VEN-PANTS-002",
			Weight:      0.5,
			Images:      `["pants3.jpg", "pants4.jpg"]`,
			IsActive:    true,
		},
		// Shoes (2 products)
		{
			Name:        "Ventauri Sneakers",
			Description: "Comfortable everyday sneakers",
			Price:       69.99,
			CategoryID:  categories[5].ID,
			SKU:         "VEN-SHOES-001",
			Weight:      1.2,
			Images:      `["shoes1.jpg", "shoes2.jpg"]`,
			IsActive:    true,
		},
		{
			Name:        "Ventauri Slides",
			Description: "Comfortable slip-on slides",
			Price:       34.99,
			CategoryID:  categories[5].ID,
			SKU:         "VEN-SHOES-002",
			Weight:      0.8,
			Images:      `["shoes3.jpg", "shoes4.jpg"]`,
			IsActive:    true,
		},
		// Bag
		{
			Name:        "Ventauri Backpack",
			Description: "Durable backpack for daily use",
			Price:       59.99,
			CategoryID:  categories[6].ID,
			SKU:         "VEN-BAG-001",
			Weight:      1.0,
			Images:      `["bag1.jpg", "bag2.jpg"]`,
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

	colors := []string{"Red", "Blue", "Black", "White", "Green"}
	sizes := []string{"XS", "S", "M", "L", "XL"}
	variantCount := 0

	// Create 3-5 variants per product
	for i, product := range products {
		numVariants := 3 + (i % 3) // 3-5 variants per product
		for j := 0; j < numVariants && variantCount < 75; j++ { // Limit total variants
			color := colors[j%len(colors)]
			size := sizes[j%len(sizes)]
			variant := models.ProductVariant{
				ProductID:   product.ID,
				SKU:         fmt.Sprintf("%s-%s-%s", product.SKU, size, strings.ToUpper(color[:3])),
				Size:        size,
				Color:       color,
				Stock:       20 + (j * 5),
				PriceAdjust: float64(j * 2),
				Weight:      product.Weight,
				IsActive:    true,
			}

			if err := db.Create(&variant).Error; err != nil {
				log.Printf("Failed to create seed product variant %s: %v", variant.SKU, err)
			} else {
				log.Printf("✅ Created seed product variant: %s", variant.SKU)
				variantCount++
			}
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
				log.Printf("✅ Created seed address for user %s", address.UserID)
				addressCount++
			}
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
			log.Printf("✅ Created seed payment method for user %s", pm.UserID)
			paymentCount++
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

	if len(users) < 15 || len(products) < 10 || len(addresses) < 15 || len(paymentMethods) < 15 {
		log.Println("Not enough data found for order seeding")
		return
	}

	statuses := []string{"pending", "processing", "shipped", "delivered", "completed", "cancelled"}
	orderCount := 0

	// Create 15 orders with multiple products each
	for i := 0; i < 15; i++ {
		userIndex := (i + 1) % len(users) // Skip admin user
		if userIndex == 0 {
			userIndex = 1
		}
		user := users[userIndex]

		// Find user's address and payment method
		var userAddress models.Address
		var userPayment models.PaymentMethod
		db.Where("user_id = ?", user.ID).First(&userAddress)
		db.Where("user_id = ?", user.ID).First(&userPayment)

		// Create order with 2-4 products
		numProducts := 2 + (i % 3) // 2-4 products per order
		for j := 0; j < numProducts; j++ {
			productIndex := (i*3 + j) % len(products)
			product := products[productIndex]
			quantity := 1 + (j % 3) // 1-3 quantity
			subtotal := product.Price * float64(quantity)
			tax := subtotal * 0.08
			shipping := 5.99
			total := subtotal + tax + shipping

			order := models.Order{
				UserID:            user.ID,
				ProductID:         product.ID,
				Quantity:          quantity,
				Subtotal:          subtotal,
				Tax:               tax,
				Shipping:          shipping,
				Total:             total,
				Status:            statuses[i%len(statuses)],
				ShippingAddressID: userAddress.ID,
				BillingAddressID:  userAddress.ID,
				PaymentMethodID:   &userPayment.ID,
				OrderNumber:       fmt.Sprintf("ORD-%03d-%d", i+1, j+1),
			}

			if err := db.Create(&order).Error; err != nil {
				log.Printf("Failed to create seed order for user %s: %v", order.UserID, err)
			} else {
				log.Printf("✅ Created seed order %s for user %s", order.OrderNumber, order.UserID)
				orderCount++
				if orderCount >= 15 {
					return
				}
			}
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
			log.Printf("✅ Created seed review for product %s", review.ProductID)
		}
	}
}

func seedCoupons(db *gorm.DB) {
	// Check if coupons already exist
	var count int64
	db.Model(&models.Coupon{}).Count(&count)
	if count > 0 {
		log.Println("Coupons already exist, skipping coupon seeding")
		return
	}

	// Create 15 sample coupons
	coupons := []models.Coupon{
		{
			Code:           "WELCOME10",
			Name:           "Welcome Discount",
			Description:    "10% off for new customers",
			Type:           models.CouponTypePercentage,
			Value:          10.0,
			MinOrderAmount: 25.0,
			MaxDiscount:    func() *float64 { v := 50.0; return &v }(),
			UsageLimit:     func() *int { v := 100; return &v }(),
			UserUsageLimit: func() *int { v := 1; return &v }(),
			StartDate:      time.Now(),
			EndDate:        time.Now().AddDate(0, 6, 0),
			IsActive:       true,
		},
		{
			Code:           "SAVE20",
			Name:           "Save $20",
			Description:    "$20 off orders over $100",
			Type:           models.CouponTypeFixed,
			Value:          20.0,
			MinOrderAmount: 100.0,
			UsageLimit:     func() *int { v := 50; return &v }(),
			UserUsageLimit: func() *int { v := 2; return &v }(),
			StartDate:      time.Now(),
			EndDate:        time.Now().AddDate(0, 3, 0),
			IsActive:       true,
		},
		{
			Code:           "FREESHIP",
			Name:           "Free Shipping",
			Description:    "Free shipping on all orders",
			Type:           models.CouponTypeFreeShipping,
			Value:          0.0,
			MinOrderAmount: 50.0,
			UsageLimit:     func() *int { v := 200; return &v }(),
			StartDate:      time.Now(),
			EndDate:        time.Now().AddDate(0, 12, 0),
			IsActive:       true,
		},
	}

	// Add 12 more coupons
	for i := 4; i <= 15; i++ {
		couponType := []models.CouponType{models.CouponTypePercentage, models.CouponTypeFixed, models.CouponTypeFreeShipping}[i%3]
		var value float64
		var description string
		var minOrder float64

		switch couponType {
		case models.CouponTypePercentage:
			value = float64(5 + (i % 4) * 5) // 5%, 10%, 15%, 20%
			description = fmt.Sprintf("%.0f%% off your order", value)
			minOrder = float64(20 + (i % 5) * 10)
		case models.CouponTypeFixed:
			value = float64(5 + (i % 6) * 5) // $5, $10, $15, $20, $25, $30
			description = fmt.Sprintf("$%.0f off your order", value)
			minOrder = value * 3
		case models.CouponTypeFreeShipping:
			value = 0.0
			description = "Free shipping on your order"
			minOrder = float64(30 + (i % 4) * 10)
		}

		coupon := models.Coupon{
			Code:           fmt.Sprintf("COUPON%02d", i),
			Name:           fmt.Sprintf("Coupon %d", i),
			Description:    description,
			Type:           couponType,
			Value:          value,
			MinOrderAmount: minOrder,
			UsageLimit:     func() *int { v := 25 + (i % 4) * 25; return &v }(),
			UserUsageLimit: func() *int { v := 1 + (i % 3); return &v }(),
			StartDate:      time.Now(),
			EndDate:        time.Now().AddDate(0, 3+(i%6), 0),
			IsActive:       true,
		}

		if couponType == models.CouponTypePercentage {
			coupon.MaxDiscount = func() *float64 { v := value * 5; return &v }()
		}

		coupons = append(coupons, coupon)
	}

	for _, coupon := range coupons {
		if err := db.Create(&coupon).Error; err != nil {
			log.Printf("Failed to create seed coupon %s: %v", coupon.Code, err)
		} else {
			log.Printf("✅ Created seed coupon: %s", coupon.Code)
		}
	}
}

func seedWishlists(db *gorm.DB) {
	// Check if wishlists already exist
	var count int64
	db.Model(&models.Wishlist{}).Count(&count)
	if count > 0 {
		log.Println("Wishlists already exist, skipping wishlist seeding")
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
				log.Printf("✅ Created seed wishlist entry for user %s, product %s", wishlist.UserID, wishlist.ProductID)
				wishlistCount++
			}
		}
	}
}

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

func seedTeamRoles(db *gorm.DB) {
	// Check if team roles already exist
	var count int64
	db.Model(&models.TeamRoles{}).Count(&count)
	if count > 0 {
		log.Println("Team roles already exist, skipping team roles seeding")
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

	for _, role := range teamRoles {
		if err := db.Create(&role).Error; err != nil {
			log.Printf("Failed to create seed team role %s: %v", role.Name, err)
		} else {
			log.Printf("✅ Created seed team role: %s", role.Name)
		}
	}
}

func seedTeamMembers(db *gorm.DB) {
	// Check if team members already exist
	var count int64
	db.Model(&models.TeamMember{}).Count(&count)
	if count > 0 {
		log.Println("Team members already exist, skipping team member seeding")
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

	for _, member := range teamMembers {
		if err := db.Create(&member).Error; err != nil {
			log.Printf("Failed to create seed team member %s %s: %v", member.FirstName, member.LastName, err)
		} else {
			log.Printf("✅ Created seed team member: %s %s (Role ID: %s)", member.FirstName, member.LastName, member.RoleID)
		}
	}
}

func seedCompetitions(db *gorm.DB) {
	// Check if competitions already exist
	var count int64
	db.Model(&models.Competition{}).Count(&count)
	if count > 0 {
		log.Println("Competitions already exist, skipping competition seeding")
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
		if role.Name == "Driver" {
			drivers = append(drivers, member.ID)
		} else if role.Name == "Engineer" {
			engineers = append(engineers, member.ID)
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
		},
	}

	for _, competition := range competitions {
		if err := db.Create(&competition).Error; err != nil {
			log.Printf("Failed to create seed competition %s: %v", competition.Name, err)
		} else {
			log.Printf("✅ Created seed competition: %s with %d tracks", competition.Name, len(competition.Schedule))
		}
	}
}