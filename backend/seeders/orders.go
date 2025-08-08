package seeders

import (
	"fmt"
	"log"

	"ventauri-merch/models"

	"gorm.io/gorm"
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
	var productVariants []models.ProductVariant
	var addresses []models.Address
	var paymentMethods []models.PaymentMethod

	db.Find(&users)
	db.Find(&products)
	db.Find(&productVariants)
	db.Find(&addresses)
	db.Find(&paymentMethods)

	if len(users) < 15 || len(products) < 10 || len(addresses) < 15 || len(paymentMethods) < 15 {
		log.Println("Not enough data found for order seeding")
		return
	}

	statuses := []string{"pending", "processing", "shipped", "delivered", "completed", "cancelled"}
	orderCount := 0

	// Create 15 orders with multiple items each
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

		// Create order with 2-4 items
		numItems := 2 + (i % 3) // 2-4 items per order

		// Calculate order totals
		var orderSubtotal float64
		var orderItems []models.OrderItem

		for j := 0; j < numItems; j++ {
			productIndex := (i*3 + j) % len(products)
			product := products[productIndex]

			// Find a variant for this product (if any exist)
			var variant *models.ProductVariant
			for _, v := range productVariants {
				if v.ProductID == product.ID {
					variant = &v
					break
				}
			}

			quantity := 1 + (j % 3) // 1-3 quantity
			unitPrice := product.Price
			if variant != nil {
				unitPrice += variant.PriceAdjust
			}
			subtotal := unitPrice * float64(quantity)
			orderSubtotal += subtotal

			orderItem := models.OrderItem{
				ProductID:        product.ID,
				ProductVariantID: &variant.ID,
				Quantity:         quantity,
				UnitPrice:        unitPrice,
				Subtotal:         subtotal,
			}
			orderItems = append(orderItems, orderItem)
		}

		tax := orderSubtotal * 0.08
		shipping := 5.99
		total := orderSubtotal + tax + shipping

		order := models.Order{
			UserID:            user.ID,
			Subtotal:          orderSubtotal,
			Tax:               tax,
			Shipping:          shipping,
			Total:             total,
			Status:            statuses[i%len(statuses)],
			ShippingAddressID: userAddress.ID,
			BillingAddressID:  userAddress.ID,
			PaymentMethodID:   &userPayment.ID,
			OrderNumber:       fmt.Sprintf("ORD-%03d", i+1),
		}

		// Create the order first
		if err := db.Create(&order).Error; err != nil {
			log.Printf("Failed to create seed order for user %s: %v", user.ID, err)
			continue
		}

		// Then create the order items
		for _, item := range orderItems {
			item.OrderID = order.ID
			if err := db.Create(&item).Error; err != nil {
				log.Printf("Failed to create order item for order %s: %v", order.ID, err)
			}
		}

		orderCount++
		if orderCount >= 15 {
			break
		}
	}
	log.Printf("Created %d orders", orderCount)
}
