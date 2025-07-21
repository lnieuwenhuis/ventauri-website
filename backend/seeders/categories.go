package seeders

import (
	"log"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedCategories(db *gorm.DB) {
	// Check if categories already exist
	var count int64
	db.Model(&models.Category{}).Count(&count)
	if count > 0 {
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

	createdCount := 0
	for _, category := range categories {
		if err := db.Create(&category).Error; err != nil {
			log.Printf("Failed to create category %s: %v", category.Name, err)
		} else {
			createdCount++
		}
	}
	log.Printf("Created %d categories", createdCount)
}