package seeders

import (
	"fmt"
	"log"
	"strings"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedProductVariants(db *gorm.DB) {
	// Check if product variants already exist
	var count int64
	db.Model(&models.ProductVariant{}).Count(&count)
	if count > 0 {
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
	createdCount := 0
	// Create 3-5 variants per product
	for i, product := range products {
		numVariants := 3 + (i % 3) // 3-5 variants per product
		for j := 0; j < numVariants && createdCount < 75; j++ { // Limit total variants
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
				log.Printf("Failed to create variant %s: %v", variant.SKU, err)
			} else {
				createdCount++
			}
		}
	}
	log.Printf("Created %d product variants", createdCount)
}