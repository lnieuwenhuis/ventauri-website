package seeders

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"ventauri-merch/models"

	"gorm.io/gorm"
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

	variants := []struct {
		title       string
		description string
	}{
		{"Classic Red", "Bold red color"},
		{"Navy Blue", "Deep navy blue"},
		{"Jet Black", "Pure black"},
		{"Crisp White", "Clean white"},
		{"Forest Green", "Rich green"},
	}
	// Use active sizes from DB (defaults to full range if empty)
	sizes := models.GetAvailableSizes(db)
	if len(sizes) == 0 {
		sizes = []string{"2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL"}
	}

	createdCount := 0
	for _, product := range products {
		// Determine enabled sizes for this product
		var enabledSizes []string
		if strings.TrimSpace(product.EnabledSizes) != "" {
			_ = json.Unmarshal([]byte(product.EnabledSizes), &enabledSizes)
		}
		if len(enabledSizes) == 0 {
			enabledSizes = sizes
		}

		// Seed up to 5 variants per product respecting enabled sizes
		limit := 5
		if len(enabledSizes) < limit {
			limit = len(enabledSizes)
		}

		for j := 0; j < limit && createdCount < 75; j++ {
			variantData := variants[j%len(variants)]
			size := enabledSizes[j]
			variant := models.ProductVariant{
				ProductID:   product.ID,
				SKU:         fmt.Sprintf("%s-%s-%s", product.SKU, size, strings.ToUpper(variantData.title[:3])),
				Size:        size,
				Title:       variantData.title,
				Description: variantData.description,
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
