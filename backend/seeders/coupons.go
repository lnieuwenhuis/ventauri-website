package seeders

import (
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedCoupons(db *gorm.DB) {
	// Check if coupons already exist
	var count int64
	db.Model(&models.Coupon{}).Count(&count)
	if count > 0 {
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

	createdCount := 0
	for _, coupon := range coupons {
		if err := db.Create(&coupon).Error; err != nil {
			log.Printf("Failed to create coupon %s: %v", coupon.Code, err)
		} else {
			createdCount++
		}
	}
	log.Printf("Created %d coupons", createdCount)
}