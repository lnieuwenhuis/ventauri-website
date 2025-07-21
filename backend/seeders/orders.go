package seeders

import (
	"fmt"
	"log"

	"gorm.io/gorm"
	"ventauri-merch/models"
)

func SeedOrders(db *gorm.DB) {
	// Check if orders already exist
	var count int64
	db.Model(&models.Order{}).Count(&count)
	if count > 0 {
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
				orderCount++
				if orderCount >= 15 {
					return
				}
			}
		}
	}
	log.Printf("Created %d orders", orderCount)
}