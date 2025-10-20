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

// Helper: region detection and shipping price parsing
var euCodes = map[string]bool{
	"AT": true, "BE": true, "BG": true, "HR": true, "CY": true, "CZ": true, "DK": true, "EE": true,
	"FI": true, "FR": true, "DE": true, "GR": true, "HU": true, "IE": true, "IT": true, "LV": true,
	"LT": true, "LU": true, "MT": true, "NL": true, "PL": true, "PT": true, "RO": true, "SK": true,
	"SI": true, "ES": true, "SE": true,
}

var euNames = map[string]bool{
	"AUSTRIA": true, "BELGIUM": true, "BULGARIA": true, "CROATIA": true, "CYPRUS": true, "CZECH REPUBLIC": true,
	"CZECHIA": true, "DENMARK": true, "ESTONIA": true, "FINLAND": true, "FRANCE": true, "GERMANY": true,
	"GREECE": true, "HUNGARY": true, "IRELAND": true, "ITALY": true, "LATVIA": true, "LITHUANIA": true,
	"LUXEMBOURG": true, "MALTA": true, "NETHERLANDS": true, "POLAND": true, "PORTUGAL": true, "ROMANIA": true,
	"SLOVAKIA": true, "SLOVENIA": true, "SPAIN": true, "SWEDEN": true,
}

func normalizeLabel(lbl string) string {
	l := strings.TrimSpace(strings.ToUpper(lbl))
	if l == "UK" { return "UK" }
	if l == "EU" { return "EU" }
	if l == "WW" || strings.HasPrefix(l, "WORLD") { return "Worldwide" }
	return strings.TrimSpace(lbl)
}

func regionForCountry(country string) string {
	c := strings.TrimSpace(strings.ToUpper(country))
	if c == "GB" || c == "UK" || c == "UNITED KINGDOM" { return "UK" }
	if euCodes[c] || euNames[c] { return "EU" }
	return "Worldwide"
}

func shippingForProduct(spStr, region string, qty int) float64 {
	if strings.TrimSpace(spStr) == "" || qty <= 0 { return 0 }
	var arr []interface{}
	if err := json.Unmarshal([]byte(spStr), &arr); err != nil { return 0 }
	if len(arr) == 0 { return 0 }

	// Case 1: numeric array [UK, EU, Worldwide]
	allNums := true
	for _, v := range arr {
		if _, ok := v.(float64); !ok { allNums = false; break }
	}
	if allNums {
		idx := 2
		if region == "UK" { idx = 0 } else if region == "EU" { idx = 1 }
		if idx < len(arr) { if p, ok := arr[idx].(float64); ok { return p * float64(qty) } }
		return 0
	}

	// Case 2: array of objects with label/key and price/value
	for _, v := range arr {
		m, ok := v.(map[string]interface{})
		if !ok { continue }
		rawLbl := m["label"]
		if rawLbl == nil { rawLbl = m["key"] }
		lbl := ""
		switch t := rawLbl.(type) {
		case string:
			lbl = t
		default:
			lbl = fmt.Sprintf("%v", t)
		}
		if normalizeLabel(lbl) == region {
			raw := m["price"]
			if raw == nil { raw = m["value"] }
			switch p := raw.(type) {
			case float64:
				return p * float64(qty)
			case string:
				if f, err := strconv.ParseFloat(p, 64); err == nil { return f * float64(qty) }
			}
			break
		}
	}
	return 0
}

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
        Options          json.RawMessage `json:"options"`
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
		// Track coupon metadata to attach to PaymentIntent
		var piHasCoupon bool
		var piCouponCode string
		var piCouponDiscount float64
		var piCouponType string

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
			// Create a single order with multiple items
			// Resolve address IDs first
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
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Shipping address required"})
					return
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
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Billing address required"})
					return
				}
			}

			// Load shipping address to determine region
			var shippingAddrRec models.Address
			shipRegion := "Worldwide"
			if err := tx.First(&shippingAddrRec, "id = ?", shippingAddrID).Error; err == nil {
				shipRegion = regionForCountry(shippingAddrRec.Country)
			}

			orderNumber := fmt.Sprintf("ORD-%d-%s", time.Now().Unix(), uuid.New().String()[:8])
			order := models.Order{
				UserID:            user.ID,
				Subtotal:          0,
				Tax:               0,
				Shipping:          0,
				Total:             0,
				Status:            "pending",
				OrderNumber:       orderNumber,
				ShippingAddressID: shippingAddrID,
				BillingAddressID:  billingAddrID,
				ShippingEstimate:  shipRegion,
			}
			if err := tx.Create(&order).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
				return
			}
			orderIDs = append(orderIDs, order.ID.String())

			// Build items and accumulate totals
			for _, item := range req.Items {
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

				unitPrice := product.Price
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
					unitPrice += variant.PriceAdjust
					variantID = &varID
				}
				if item.Quantity <= 0 {
					item.Quantity = 1
				}
				lineSubtotal := unitPrice * float64(item.Quantity)

				orderItem := models.OrderItem{
					OrderID:          order.ID,
					ProductID:        product.ID,
					ProductVariantID: variantID,
					Quantity:         item.Quantity,
					UnitPrice:        unitPrice,
					Subtotal:         lineSubtotal,
					Options:          string(item.Options),
				}
				if err := tx.Create(&orderItem).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order item"})
					return
				}
				order.Subtotal += lineSubtotal
				// Accumulate shipping from product's shippingPrices using shipping region
				order.Shipping += shippingForProduct(product.ShippingPrices, shipRegion, item.Quantity)
			}

			// Apply coupon if provided and valid
			var appliedCoupon *models.Coupon
			couponDiscount := 0.0
			if req.CouponCode != nil && strings.TrimSpace(*req.CouponCode) != "" {
				code := strings.TrimSpace(*req.CouponCode)
				var cp models.Coupon
				if err := tx.Where("code = ? AND is_active = ?", code, true).First(&cp).Error; err == nil {
					now := time.Now()
					if !now.Before(cp.StartDate) && !now.After(cp.EndDate) && (order.Subtotal+order.Shipping) >= cp.MinOrderAmount {
						// Check global usage limit
						if cp.UsageLimit == nil || cp.UsageCount < *cp.UsageLimit {
							// Check per-user usage
							var userUsageCount int64
							tx.Model(&models.CouponUsage{}).Where("coupon_id = ? AND user_id = ?", cp.ID, user.ID).Count(&userUsageCount)
							if cp.UserUsageLimit == nil || userUsageCount < int64(*cp.UserUsageLimit) {
								// Compute discount
								switch cp.Type {
								case models.CouponTypeFreeShipping:
									// Waive shipping; record waived amount as discount
									couponDiscount = order.Shipping
									order.Shipping = 0
								case models.CouponTypePercentage:
									couponDiscount = (order.Subtotal + order.Shipping) * (cp.Value / 100)
									if cp.MaxDiscount != nil && couponDiscount > *cp.MaxDiscount {
										couponDiscount = *cp.MaxDiscount
									}
								case models.CouponTypeFixed:
									couponDiscount = cp.Value
									if couponDiscount > (order.Subtotal + order.Shipping) {
										couponDiscount = (order.Subtotal + order.Shipping)
									}
								}
								appliedCoupon = &cp
							}
						}
					}
				}
			}

			// Tax currently 0; totals include shipping minus coupon discount
			order.Tax = 0
			order.Total = order.Subtotal + order.Shipping - couponDiscount
			if err := tx.Save(&order).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finalize order totals"})
				return
			}
			totalAmount += order.Total

			// Capture coupon info for PI metadata
			if appliedCoupon != nil {
				piHasCoupon = true
				piCouponCode = appliedCoupon.Code
				piCouponDiscount = couponDiscount
				piCouponType = string(appliedCoupon.Type)
			}
		}

		amountInCents := int64(totalAmount * 100)
		if amountInCents < 50 {
			amountInCents = 50
		}

		// Create PaymentIntent via Stripe REST API
		values := url.Values{}
		values.Set("amount", strconv.FormatInt(amountInCents, 10))
		values.Set("currency", currency)
		values.Set("automatic_payment_methods[enabled]", "true")
		// Attach helpful metadata for webhook processing
		values.Set("metadata[order_ids]", strings.Join(orderIDs, ","))
		if piHasCoupon {
			values.Set("metadata[coupon_code]", piCouponCode)
			values.Set("metadata[coupon_discount]", fmt.Sprintf("%.2f", piCouponDiscount))
			values.Set("metadata[coupon_type]", piCouponType)
			values.Set("metadata[user_id]", user.ID.String())
		}

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
					ID       string            `json:"id"`
					Status   string            `json:"status"`
					Metadata map[string]string `json:"metadata"`
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

			// Record coupon usage if coupon metadata present
			md := event.Data.Object.Metadata
			if md != nil {
				code := strings.TrimSpace(md["coupon_code"])
				if code != "" {
					var coupon models.Coupon
					if err := db.Where("code = ?", code).First(&coupon).Error; err == nil {
						// Parse discount amount if provided
						discount := 0.0
						if s := md["coupon_discount"]; s != "" {
							if v, err := strconv.ParseFloat(s, 64); err == nil {
								discount = v
							}
						}
						// Create usage rows per order if not already recorded
						for _, order := range orders {
							var exists int64
							db.Model(&models.CouponUsage{}).Where("coupon_id = ? AND order_id = ?", coupon.ID, order.ID).Count(&exists)
							if exists == 0 {
								cu := models.CouponUsage{CouponID: coupon.ID, UserID: order.UserID, OrderID: order.ID, Discount: discount}
								_ = db.Create(&cu).Error
								// Increment aggregate usage count
								_ = db.Model(&models.Coupon{}).Where("id = ?", coupon.ID).UpdateColumn("usage_count", gorm.Expr("usage_count + ?", 1)).Error
							}
						}
					}
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
