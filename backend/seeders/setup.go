package seeders

import (
	"log"

	"gorm.io/gorm"
)

// SeedAll runs all seeders in the correct order
func SeedAll(db *gorm.DB) {
    log.Println("🌱 Starting database seeding...")
    
    SeedUsers(db)
    SeedCategories(db)
    // Ensure size options exist before products and variants
    SeedSizeOptions(db)
    SeedProducts(db)
    SeedProductVariants(db)
    SeedAddresses(db)
	SeedPaymentMethods(db)
	SeedOrders(db)
	SeedReviews(db)
	SeedCoupons(db)
	SeedWishlists(db)
	SeedTeamRoles(db)
	SeedTeamMembers(db)
	SeedCompetitions(db)
	
	log.Println("✅ Database seeding completed!")
}