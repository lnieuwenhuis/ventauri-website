package seeders

import (
	"log"

	"ventauri-merch/models"

	"gorm.io/gorm"
)

func SeedProducts(db *gorm.DB) {
	// Check if products already exist
	var count int64
	db.Model(&models.Product{}).Count(&count)
	if count > 0 {
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
			Name:         "Ventauri Classic T-Shirt",
			Description:  "Comfortable cotton t-shirt with Ventauri logo",
			Price:        19.99,
			CategoryID:   categories[0].ID,
			SKU:          "VEN-TSHIRT-001",
			Weight:       0.2,
			Images:       `["tshirt1.jpg", "tshirt2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["XS", "S", "M", "L", "XL"]`,
		},
		{
			Name:         "Ventauri Racing T-Shirt",
			Description:  "Premium racing-inspired t-shirt with team colors",
			Price:        24.99,
			CategoryID:   categories[0].ID,
			SKU:          "VEN-TSHIRT-002",
			Weight:       0.2,
			Images:       `["racing_tshirt1.jpg", "racing_tshirt2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["XS", "S", "M", "L", "XL"]`,
		},
		{
			Name:         "Ventauri Team T-Shirt",
			Description:  "Official team t-shirt worn by crew members",
			Price:        29.99,
			CategoryID:   categories[0].ID,
			SKU:          "VEN-TSHIRT-003",
			Weight:       0.2,
			Images:       `["team_tshirt1.jpg", "team_tshirt2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["XS", "S", "M", "L", "XL"]`,
		},
		// Hoodies (3 products)
		{
			Name:         "Ventauri Classic Hoodie",
			Description:  "Warm and comfortable hoodie with embroidered logo",
			Price:        49.99,
			CategoryID:   categories[1%len(categories)].ID,
			SKU:          "VEN-HOODIE-001",
			Weight:       0.8,
			Images:       `["hoodie1.jpg", "hoodie2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["S", "M", "L", "XL", "2XL"]`,
		},
		{
			Name:         "Ventauri Racing Hoodie",
			Description:  "Premium racing hoodie with team branding",
			Price:        59.99,
			CategoryID:   categories[1%len(categories)].ID,
			SKU:          "VEN-HOODIE-002",
			Weight:       0.8,
			Images:       `["racing_hoodie1.jpg", "racing_hoodie2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["S", "M", "L", "XL", "2XL"]`,
		},
		{
			Name:         "Ventauri Zip-Up Hoodie",
			Description:  "Stylish zip-up hoodie perfect for any weather",
			Price:        54.99,
			CategoryID:   categories[1%len(categories)].ID,
			SKU:          "VEN-HOODIE-003",
			Weight:       0.9,
			Images:       `["zip_hoodie1.jpg", "zip_hoodie2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["S", "M", "L", "XL", "2XL"]`,
		},
		// Caps (2 products)
		{
			Name:         "Ventauri Racing Cap",
			Description:  "Adjustable cap with Ventauri racing logo",
			Price:        24.99,
			CategoryID:   categories[2%len(categories)].ID,
			SKU:          "VEN-CAP-001",
			Weight:       0.1,
			Images:       `["cap1.jpg", "cap2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["S", "M", "L", "XL"]`,
		},
		{
			Name:         "Ventauri Classic Cap",
			Description:  "Classic baseball cap with embroidered logo",
			Price:        19.99,
			CategoryID:   categories[2%len(categories)].ID,
			SKU:          "VEN-CAP-002",
			Weight:       0.1,
			Images:       `["classic_cap1.jpg", "classic_cap2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["S", "M", "L", "XL"]`,
		},
		// Polo Shirts (2 products)
		{
			Name:         "Ventauri Polo Shirt",
			Description:  "Professional polo shirt with subtle branding",
			Price:        34.99,
			CategoryID:   categories[3%len(categories)].ID,
			SKU:          "VEN-POLO-001",
			Weight:       0.3,
			Images:       `["polo1.jpg", "polo2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["XS", "S", "M", "L", "XL"]`,
		},
		{
			Name:         "Ventauri Team Polo",
			Description:  "Official team polo shirt for formal events",
			Price:        39.99,
			CategoryID:   categories[3%len(categories)].ID,
			SKU:          "VEN-POLO-002",
			Weight:       0.3,
			Images:       `["team_polo1.jpg", "team_polo2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["XS", "S", "M", "L", "XL"]`,
		},
		// Jackets (2 products)
		{
			Name:         "Ventauri Racing Jacket",
			Description:  "Lightweight racing jacket with team colors",
			Price:        79.99,
			CategoryID:   categories[4%len(categories)].ID,
			SKU:          "VEN-JACKET-001",
			Weight:       0.6,
			Images:       `["jacket1.jpg", "jacket2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["S", "M", "L", "XL", "2XL"]`,
		},
		{
			Name:         "Ventauri Windbreaker",
			Description:  "Water-resistant windbreaker for outdoor activities",
			Price:        69.99,
			CategoryID:   categories[4%len(categories)].ID,
			SKU:          "VEN-JACKET-002",
			Weight:       0.5,
			Images:       `["windbreaker1.jpg", "windbreaker2.jpg"]`,
			IsActive:     true,
			EnabledSizes: `["S", "M", "L", "XL", "2XL"]`,
		},
	}

	createdCount := 0
	for _, product := range products {
		if err := db.Create(&product).Error; err != nil {
			log.Printf("Failed to create product %s: %v", product.Name, err)
		} else {
			createdCount++
		}
	}
	log.Printf("Created %d products", createdCount)
}
