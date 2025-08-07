package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupPaymentRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	payments := router.Group("/api/payment-methods")
	payments.Use(auth.AuthMiddleware())
	{
		payments.GET("/", getPaymentMethods(db))
		payments.POST("/", createPaymentMethod(db))
		payments.PUT("/:id", updatePaymentMethod(db))
		payments.DELETE("/:id", deletePaymentMethod(db))
		payments.PUT("/:id/default", setDefaultPaymentMethod(db))
	}

	// Admin routes
	adminPayments := router.Group("/api/admin/payment-methods")
	adminPayments.Use(auth.AdminMiddleware())
	{
		adminPayments.GET("/", getAllPaymentMethods(db))
		adminPayments.GET("/:id", getPaymentMethodByID(db))
		adminPayments.PUT("/:id", updatePaymentMethodAdmin(db))
		adminPayments.DELETE("/:id", deletePaymentMethodAdmin(db))
		adminPayments.PUT("/:id/status", togglePaymentMethodStatus(db))
	}

	// Stripe checkout endpoints
	checkout := router.Group("/api/checkout")
	checkout.Use(auth.AuthMiddleware())
	{
		checkout.POST("/create-payment-intent", createStripePaymentIntent(db))
		checkout.GET("/publishable-key", getStripePublishableKey())
		checkout.GET("/confirm", confirmStripePayment(db))
	}

	// Webhook (no auth)
	router.POST("/api/stripe/webhook", stripeWebhookHandler(db))
}

// Add new status toggle function
func togglePaymentMethodStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.First(&paymentMethod, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		paymentMethod.IsActive = !paymentMethod.IsActive

		if err := db.Save(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment method status"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}

// --- Stripe Integration ---

type createPaymentIntentRequest struct {
	Items []struct {
		ProductID        string  `json:"productId"`
		ProductVariantID *string `json:"productVariantId,omitempty"`
		Quantity         int     `json:"quantity"`
	} `json:"items"`
	ShippingAddressID string   `json:"shippingAddressId"`
	BillingAddressID  string   `json:"billingAddressId"`
	CouponCode        *string  `json:"couponCode,omitempty"`
	ExistingOrderIDs  []string `json:"existingOrderIds,omitempty"`
}

type createPaymentIntentResponse struct {
	ClientSecret string   `json:"clientSecret"`
	Amount       int64    `json:"amount"`
	Currency     string   `json:"currency"`
	OrderIDs     []string `json:"orderIds"`
}

// Placeholder Stripe client. We will call Stripe via REST to avoid extra deps.
func createStripePaymentIntent(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)

		// Guard: stripe secret must be present
		stripeSecret := os.Getenv("STRIPE_SECRET_KEY")
		if stripeSecret == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing STRIPE_SECRET_KEY"})
			return
		}

		var req createPaymentIntentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Reuse createOrder cost computation without marking paid yet
		// We will create pending orders mirroring routes.createOrder calculation
		// Note: currency is USD by default
		currency := strings.ToLower(os.Getenv("STRIPE_CURRENCY"))
		if currency == "" {
			currency = "usd"
		}

		// Build orders inside tx but do not mark paid
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		var orderIDs []string
		var totalAmount float64

		// If client supplies existing order IDs, reuse them and compute total from DB
		if len(req.ExistingOrderIDs) > 0 {
			for _, idStr := range req.ExistingOrderIDs {
				var order models.Order
				if err := tx.Where("id = ? AND user_id = ?", idStr, user.ID).First(&order).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID in existingOrderIds"})
					return
				}
				orderIDs = append(orderIDs, order.ID.String())
				totalAmount += order.Total
			}
		} else {
			for _, item := range req.Items {
				// We will call existing order price calc by mimicking logic here to avoid import cycles
				// Fetch product price
				productUUID, parseProductErr := uuid.Parse(item.ProductID)
				if parseProductErr != nil {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
					return
				}
				var product models.Product
				if err := tx.First(&product, "id = ?", productUUID).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
					return
				}

				itemPrice := product.Price
				var variantID *uuid.UUID
				if item.ProductVariantID != nil {
					var variant models.ProductVariant
					varID, parseVariantErr := uuid.Parse(*item.ProductVariantID)
					if parseVariantErr != nil {
						tx.Rollback()
						c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid variant ID"})
						return
					}
					if err := tx.First(&variant, "id = ? AND product_id = ?", varID, product.ID).Error; err != nil {
						tx.Rollback()
						c.JSON(http.StatusNotFound, gin.H{"error": "Product variant not found"})
						return
					}
					itemPrice += variant.PriceAdjust
					variantID = &varID
				}

				if item.Quantity <= 0 {
					item.Quantity = 1
				}

				subtotal := itemPrice * float64(item.Quantity)
				tax := subtotal * 0.1
				shipping := 5.99
				total := subtotal + tax + shipping
				totalAmount += total

				// Resolve address IDs: use provided or default user's address
				var shippingAddrID uuid.UUID
				var billingAddrID uuid.UUID
				if strings.TrimSpace(req.ShippingAddressID) != "" {
					var parseShipErr error
					shippingAddrID, parseShipErr = uuid.Parse(req.ShippingAddressID)
					if parseShipErr != nil {
						tx.Rollback()
						c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid shipping address ID"})
						return
					}
				} else {
					var addr models.Address
					if err := tx.Where("user_id = ?", user.ID).Order("is_default DESC, created_at DESC").First(&addr).Error; err == nil {
						shippingAddrID = addr.ID
					} else {
						// create a minimal placeholder address
						placeholder := models.Address{
							UserID:    user.ID,
							Street:    "Unknown",
							City:      "Unknown",
							State:     "",
							ZipCode:   "00000",
							Country:   "US",
							IsDefault: true,
							IsActive:  true,
						}
						if err := tx.Create(&placeholder).Error; err != nil {
							tx.Rollback()
							c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create default address"})
							return
						}
						shippingAddrID = placeholder.ID
					}
				}
				if strings.TrimSpace(req.BillingAddressID) != "" {
					var parseBillErr error
					billingAddrID, parseBillErr = uuid.Parse(req.BillingAddressID)
					if parseBillErr != nil {
						tx.Rollback()
						c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid billing address ID"})
						return
					}
				} else {
					var addr models.Address
					if err := tx.Where("user_id = ?", user.ID).Order("is_default DESC, created_at DESC").First(&addr).Error; err == nil {
						billingAddrID = addr.ID
					} else {
						billingAddrID = shippingAddrID
					}
				}

				orderNumber := fmt.Sprintf("ORD-%d-%s", time.Now().Unix(), uuid.New().String()[:8])

				order := models.Order{
					UserID:            user.ID,
					ProductID:         product.ID,
					ProductVariantID:  variantID,
					Quantity:          item.Quantity,
					Subtotal:          subtotal,
					Tax:               tax,
					Shipping:          shipping,
					Total:             total,
					Status:            "pending",
					OrderNumber:       orderNumber,
					ShippingAddressID: shippingAddrID,
					BillingAddressID:  billingAddrID,
				}

				if err := tx.Create(&order).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
					return
				}
				orderIDs = append(orderIDs, order.ID.String())
			}
		}

		amountInCents := int64(totalAmount * 100)
		if amountInCents < 50 {
			amountInCents = 50
		}

		// Create PaymentIntent via Stripe REST API
		// curl -X POST https://api.stripe.com/v1/payment_intents -u sk_test: -d amount=2000 -d currency=usd -d automatic_payment_methods[enabled]=true
		values := url.Values{}
		values.Set("amount", strconv.FormatInt(amountInCents, 10))
		values.Set("currency", currency)
		values.Set("automatic_payment_methods[enabled]", "true")

		reqBody := strings.NewReader(values.Encode())
		httpReq, _ := http.NewRequest("POST", "https://api.stripe.com/v1/payment_intents", reqBody)
		httpReq.Header.Set("Authorization", "Bearer "+stripeSecret)
		httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

		resp, err := http.DefaultClient.Do(httpReq)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to reach Stripe"})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			tx.Rollback()
			c.JSON(http.StatusBadGateway, gin.H{"error": "Stripe error creating payment intent"})
			return
		}

		var stripePI struct {
			ID           string `json:"id"`
			ClientSecret string `json:"client_secret"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&stripePI); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to parse Stripe response"})
			return
		}

		// Save PaymentIntent ID on all orders in this checkout batch
		for _, idStr := range orderIDs {
			var order models.Order
			if err := tx.First(&order, "id = ?", idStr).Error; err == nil {
				order.StripePaymentIntentID = &stripePI.ID
				if err := tx.Save(&order).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to attach PI to orders"})
					return
				}
			}
		}

		tx.Commit()

		c.JSON(http.StatusOK, createPaymentIntentResponse{
			ClientSecret: stripePI.ClientSecret,
			Amount:       amountInCents,
			Currency:     currency,
			OrderIDs:     orderIDs,
		})
	}
}

func getStripePublishableKey() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := os.Getenv("STRIPE_PUBLISHABLE_KEY")
		if key == "" {
			key = "pk_test_XXXXXXXXXXXXXXXXXXXXXXXX" // placeholder
		}
		c.JSON(http.StatusOK, gin.H{"publishableKey": key})
	}
}

// removed custom url encoding; using net/url.Values

// Optional: confirm endpoint for client polling or manual confirmation handling
func confirmStripePayment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		piID := c.Query("payment_intent")
		if strings.TrimSpace(piID) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "payment_intent is required"})
			return
		}
		// Verify status with Stripe and update accordingly (fallback if webhook fails)
		stripeSecret := os.Getenv("STRIPE_SECRET_KEY")
		if stripeSecret == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing STRIPE_SECRET_KEY"})
			return
		}

		httpReq, _ := http.NewRequest("GET", "https://api.stripe.com/v1/payment_intents/"+piID, nil)
		httpReq.Header.Set("Authorization", "Bearer "+stripeSecret)
		resp, err := http.DefaultClient.Do(httpReq)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to reach Stripe"})
			return
		}
		defer resp.Body.Close()

		var stripePI struct {
			ID     string `json:"id"`
			Status string `json:"status"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&stripePI); err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to parse Stripe response"})
			return
		}

		// Update orders if succeeded
		if stripePI.Status == "succeeded" {
			var orders []models.Order
			if err := db.Where("stripe_payment_intent_id = ?", piID).Find(&orders).Error; err == nil {
				for _, order := range orders {
					if order.Status == "pending" {
						order.Status = "processing"
						_ = db.Save(&order).Error
					}
				}
			}
		}

		// Return updated orders
		var updated []models.Order
		_ = db.Where("stripe_payment_intent_id = ?", piID).Order("created_at DESC").Find(&updated).Error
		c.JSON(http.StatusOK, gin.H{"data": updated, "payment_intent_status": stripePI.Status})
	}
}

func stripeWebhookHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// For simplicity, accept event without signature verification here. In production, verify with STRIPE_WEBHOOK_SECRET
		var event struct {
			Type string `json:"type"`
			Data struct {
				Object struct {
					ID     string `json:"id"`
					Status string `json:"status"`
				} `json:"object"`
			} `json:"data"`
		}
		if err := c.ShouldBindJSON(&event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}

		if event.Type == "payment_intent.succeeded" {
			piID := event.Data.Object.ID
			// Mark related orders as processing
			var orders []models.Order
			if err := db.Where("stripe_payment_intent_id = ?", piID).Find(&orders).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update orders"})
				return
			}
			for _, order := range orders {
				// Transition Pending -> Processing only
				if order.Status == "pending" {
					order.Status = "processing"
					_ = db.Save(&order).Error
				}
			}

			// Clear cart for the user associated to these orders
			var order models.Order
			if err := db.Where("stripe_payment_intent_id = ?", piID).First(&order).Error; err == nil {
				_ = db.Where("user_id = ?", order.UserID).Delete(&models.Cart{}).Error
			}
		}

		c.JSON(http.StatusOK, gin.H{"received": true})
	}
}

// Add these admin handler functions
func getAllPaymentMethods(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var paymentMethods []models.PaymentMethod
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")

		query := db.Model(&models.PaymentMethod{}).Preload("User")

		if search != "" {
			query = query.Joins("JOIN users ON payment_methods.user_id = users.id").Where(
				"users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR payment_methods.provider ILIKE ? OR payment_methods.last4 ILIKE ? OR payment_methods.holder_name ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}

		var total int64
		query.Count(&total)

		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&paymentMethods).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment methods"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  paymentMethods,
			"total": total,
			"page":  utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getPaymentMethodByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.Preload("User").First(&paymentMethod, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}

func updatePaymentMethodAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.First(&paymentMethod, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		if err := c.ShouldBindJSON(&paymentMethod); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment method"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}

func deletePaymentMethodAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		if err := db.Delete(&models.PaymentMethod{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment method"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Payment method deleted successfully"})
	}
}

func getPaymentMethods(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var paymentMethods []models.PaymentMethod

		if err := db.Where("user_id = ? AND is_active = ?", user.ID, true).Order("is_default DESC, created_at DESC").Find(&paymentMethods).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment methods"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": paymentMethods})
	}
}

func createPaymentMethod(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var paymentMethod models.PaymentMethod
		if err := c.ShouldBindJSON(&paymentMethod); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		paymentMethod.UserID = user.ID

		// If this is the first payment method, make it default
		var count int64
		db.Model(&models.PaymentMethod{}).Where("user_id = ? AND is_active = ?", user.ID, true).Count(&count)
		if count == 0 {
			paymentMethod.IsDefault = true
		}

		if err := db.Create(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment method"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": paymentMethod})
	}
}

func updatePaymentMethod(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		var req struct {
			Type        models.PaymentMethodType `json:"type"`
			Provider    string                   `json:"provider"`
			Last4       string                   `json:"last4"`
			ExpiryMonth int                      `json:"expiryMonth,omitempty"`
			ExpiryYear  int                      `json:"expiryYear,omitempty"`
			HolderName  string                   `json:"holderName"`
			Token       string                   `json:"token,omitempty"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update fields
		paymentMethod.Type = req.Type
		paymentMethod.Provider = req.Provider
		paymentMethod.Last4 = req.Last4
		paymentMethod.ExpiryMonth = req.ExpiryMonth
		paymentMethod.ExpiryYear = req.ExpiryYear
		paymentMethod.HolderName = req.HolderName
		paymentMethod.Token = req.Token

		if err := db.Save(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment method"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}

func deletePaymentMethod(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		// Soft delete by setting is_active to false
		paymentMethod.IsActive = false
		if err := db.Save(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment method"})
			return
		}

		// If this was the default payment method, set another one as default
		if paymentMethod.IsDefault {
			var newDefault models.PaymentMethod
			if err := db.Where("user_id = ? AND is_active = ? AND id != ?", user.ID, true, id).First(&newDefault).Error; err == nil {
				newDefault.IsDefault = true
				db.Save(&newDefault)
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Payment method deleted successfully"})
	}
}

func setDefaultPaymentMethod(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var paymentMethod models.PaymentMethod

		if err := db.Where("id = ? AND user_id = ? AND is_active = ?", id, user.ID, true).First(&paymentMethod).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
			return
		}

		// Start transaction
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Remove default from all other payment methods
		if err := tx.Model(&models.PaymentMethod{}).Where("user_id = ? AND is_active = ?", user.ID, true).Update("is_default", false).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update default payment method"})
			return
		}

		// Set this payment method as default
		paymentMethod.IsDefault = true
		if err := tx.Save(&paymentMethod).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default payment method"})
			return
		}

		tx.Commit()
		c.JSON(http.StatusOK, gin.H{"data": paymentMethod})
	}
}
