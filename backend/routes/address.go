package routes

import (
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"ventauri-merch/models"
	"ventauri-merch/utils"
)

func SetupAddressRoutes(router *gin.Engine, db *gorm.DB) {
	auth := utils.NewAuthService(db)
	addresses := router.Group("/api/addresses")
	addresses.Use(auth.AuthMiddleware())
	{
		addresses.GET("/", getUserAddresses(db))
		addresses.POST("/", createAddress(db))
		addresses.PUT("/:id", updateAddress(db))
		addresses.DELETE("/:id", deleteAddress(db))
		addresses.PUT("/:id/default", setDefaultAddress(db))
		// Resolve address helper
		addresses.GET("/resolve", resolveAddress())
	}

	// Admin routes
	adminAddresses := router.Group("/api/admin/addresses")
	adminAddresses.Use(auth.AdminMiddleware())
	{
		adminAddresses.GET("/", getAllAddresses(db))
		adminAddresses.GET("/:id", getAddressByID(db))
		adminAddresses.PUT("/:id", updateAddressAdmin(db))
		adminAddresses.DELETE("/:id", deleteAddressAdmin(db))
		adminAddresses.PUT("/:id/status", toggleAddressStatus(db))
	}
}

// Add these admin handler functions
func getAllAddresses(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var addresses []models.Address
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "10")
		search := c.Query("search")

		query := db.Model(&models.Address{}).Preload("User")

		if search != "" {
			query = query.Joins("JOIN users ON addresses.user_id = users.id").Where(
				"addresses.street ILIKE ? OR addresses.city ILIKE ? OR addresses.state ILIKE ? OR addresses.country ILIKE ? OR users.first_name ILIKE ? OR users.last_name ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		}

		var total int64
		query.Count(&total)

		offset := (utils.ParseInt(page, 1) - 1) * utils.ParseInt(limit, 10)
		if err := query.Offset(offset).Limit(utils.ParseInt(limit, 10)).Find(&addresses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch addresses"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  addresses,
			"total": total,
			"page":  utils.ParseInt(page, 1),
			"limit": utils.ParseInt(limit, 10),
		})
	}
}

func getAddressByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var address models.Address

		if err := db.Preload("User").First(&address, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}

func updateAddressAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var address models.Address

		if err := db.First(&address, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		if err := c.ShouldBindJSON(&address); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}

func deleteAddressAdmin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		if err := db.Delete(&models.Address{}, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete address"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Address deleted successfully"})
	}
}

func getUserAddresses(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var addresses []models.Address

		if err := db.Where("user_id = ?", user.ID).Order("is_default DESC, created_at DESC").Find(&addresses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch addresses"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": addresses})
	}
}

// resolveAddress queries an external API (placeholder) using country + postal + number to suggest address fields.
// Set ADDRESS_RESOLVER_URL and ADDRESS_RESOLVER_KEY to enable; otherwise returns 501.
func resolveAddress() gin.HandlerFunc {
	return func(c *gin.Context) {
		country := c.Query("country")
		postal := c.Query("postal")
		number := c.Query("number")

		if country == "" || postal == "" || number == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "country, postal and number are required"})
			return
		}

		// Preferred external resolver if configured
		resolverURL := os.Getenv("ADDRESS_RESOLVER_URL")
		resolverKey := os.Getenv("ADDRESS_RESOLVER_KEY")
		geoapifyKey := os.Getenv("GEOAPIFY_API_KEY")
		// First priority: Geoapify if available (good global coverage, free tier), except NL where PDOK is superior
		if geoapifyKey != "" && !strings.EqualFold(country, "NL") {
			gq := url.Values{}
			gq.Set("text", number+" "+postal)
			gq.Set("filter", "countrycode:"+strings.ToLower(country))
			gq.Set("limit", "1")
			gq.Set("apiKey", geoapifyKey)
			greq, _ := http.NewRequest("GET", "https://api.geoapify.com/v1/geocode/search?"+gq.Encode(), nil)
			greq.Header.Set("User-Agent", "ventauri-merch/1.0")
			gresp, err := http.DefaultClient.Do(greq)
			if err == nil && gresp != nil {
				defer gresp.Body.Close()
				var gj struct {
					Features []struct {
						Properties struct {
							Street      string `json:"street"`
							City        string `json:"city"`
							State       string `json:"state"`
							Postcode    string `json:"postcode"`
							CountryCode string `json:"country_code"`
						} `json:"properties"`
					} `json:"features"`
				}
				if err := json.NewDecoder(gresp.Body).Decode(&gj); err == nil && len(gj.Features) > 0 {
					p := gj.Features[0].Properties
					data := map[string]any{
						"street": p.Street,
						"city":   p.City,
						"state":  p.State,
						"zipCode": func() string {
							if p.Postcode != "" {
								return p.Postcode
							}
							return postal
						}(),
						"country": strings.ToUpper(func() string {
							if p.CountryCode != "" {
								return p.CountryCode
							}
							return country
						}()),
					}
					c.JSON(http.StatusOK, gin.H{"data": data})
					return
				}
			}
		}
		if resolverURL != "" {
			values := url.Values{}
			values.Set("country", country)
			values.Set("postal", postal)
			values.Set("number", number)
			req, _ := http.NewRequest("GET", resolverURL+"?"+values.Encode(), nil)
			if resolverKey != "" {
				req.Header.Set("Authorization", "Bearer "+resolverKey)
			}
			req.Header.Set("User-Agent", "ventauri-merch/1.0")
			resp, err := http.DefaultClient.Do(req)
			if err == nil && resp != nil {
				defer resp.Body.Close()
				if resp.StatusCode >= 200 && resp.StatusCode < 300 {
					var data map[string]any
					if err := json.NewDecoder(resp.Body).Decode(&data); err == nil {
						c.JSON(http.StatusOK, gin.H{"data": data})
						return
					}
				}
			}
			// fallthrough to built-in resolver if external fails
		}

		// Built-in resolver:
		// - NL: PDOK BAG Locatieserver (postcode + huisnummer)
		// - Others: Nominatim (fills city/state/country best-effort from postal)
		if strings.EqualFold(country, "NL") {
			q := url.Values{}
			// Prefer strict filters for NL BAG search
			// Docs: https://www.pdok.nl/introductie/-/article/bag-locatieserver
			q.Add("fq", "type:adres")
			q.Add("fq", "postcode:"+postal)
			q.Add("fq", "huisnummer:"+number)
			q.Set("rows", "1")
			req, _ := http.NewRequest("GET", "https://geodata.nationaalgeoregister.nl/locatieserver/v3/free?"+q.Encode(), nil)
			req.Header.Set("User-Agent", "ventauri-merch/1.0")
			resp, err := http.DefaultClient.Do(req)
			if err == nil && resp != nil {
				defer resp.Body.Close()
				var res struct {
					Response struct {
						Docs []map[string]any `json:"docs"`
					} `json:"response"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&res); err == nil && len(res.Response.Docs) > 0 {
					doc := res.Response.Docs[0]
					// Map fields
					data := map[string]any{
						"street":  doc["straatnaam"],
						"city":    doc["woonplaatsnaam"],
						"state":   doc["provincienaam"],
						"zipCode": postal,
						"country": "NL",
					}
					c.JSON(http.StatusOK, gin.H{"data": data})
					return
				}
			}
		}

		// Generic fallback using Nominatim (no key). This may not return street without name; it can still fill city/state.
		nq := url.Values{}
		nq.Set("format", "json")
		nq.Set("addressdetails", "1")
		nq.Set("limit", "1")
		// Use postal code and country code; number may not be used without street, but include in query for context
		nq.Set("q", postal+" "+number+" "+country)
		nreq, _ := http.NewRequest("GET", "https://nominatim.openstreetmap.org/search?"+nq.Encode(), nil)
		nreq.Header.Set("User-Agent", "ventauri-merch/1.0")
		nresp, err := http.DefaultClient.Do(nreq)
		if err == nil && nresp != nil {
			defer nresp.Body.Close()
			var arr []struct {
				Address struct {
					Road     string `json:"road"`
					City     string `json:"city"`
					Town     string `json:"town"`
					Village  string `json:"village"`
					State    string `json:"state"`
					Postcode string `json:"postcode"`
					Country  string `json:"country_code"`
				} `json:"address"`
			}
			if err := json.NewDecoder(nresp.Body).Decode(&arr); err == nil && len(arr) > 0 {
				a := arr[0].Address
				city := a.City
				if city == "" {
					if a.Town != "" {
						city = a.Town
					} else {
						city = a.Village
					}
				}
				data := map[string]any{
					"street": a.Road,
					"city":   city,
					"state":  a.State,
					"zipCode": func() string {
						if a.Postcode != "" {
							return a.Postcode
						}
						return postal
					}(),
					"country": strings.ToUpper(country),
				}
				c.JSON(http.StatusOK, gin.H{"data": data})
				return
			}
		}

		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
	}
}

func createAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		var address models.Address
		if err := c.ShouldBindJSON(&address); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		address.UserID = user.ID

		// If this is the first address, make it default
		var count int64
		db.Model(&models.Address{}).Where("user_id = ?", user.ID).Count(&count)
		if count == 0 {
			address.IsDefault = true
		}

		if err := db.Create(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create address"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"data": address})
	}
}

func updateAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var address models.Address

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&address).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		var req struct {
			Street  string `json:"street" binding:"required"`
			City    string `json:"city" binding:"required"`
			State   string `json:"state" binding:"required"`
			ZipCode string `json:"zipCode" binding:"required"`
			Country string `json:"country" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		address.Street = req.Street
		address.City = req.City
		address.State = req.State
		address.ZipCode = req.ZipCode
		address.Country = req.Country

		if err := db.Save(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}

func deleteAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var address models.Address

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&address).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		if err := db.Delete(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete address"})
			return
		}

		// If this was the default address, set another one as default
		if address.IsDefault {
			var newDefault models.Address
			if err := db.Where("user_id = ? AND id != ?", user.ID, id).First(&newDefault).Error; err == nil {
				newDefault.IsDefault = true
				db.Save(&newDefault)
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Address deleted successfully"})
	}
}

func setDefaultAddress(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, _ := utils.GetCurrentUser(c)
		id := c.Param("id")
		var address models.Address

		if err := db.Where("id = ? AND user_id = ?", id, user.ID).First(&address).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		// Start transaction
		tx := db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Remove default from all other addresses
		if err := tx.Model(&models.Address{}).Where("user_id = ?", user.ID).Update("is_default", false).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update default address"})
			return
		}

		// Set this address as default
		address.IsDefault = true
		if err := tx.Save(&address).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default address"})
			return
		}

		tx.Commit()
		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}

// Add new status toggle function
func toggleAddressStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var address models.Address

		if err := db.First(&address, "id = ?", id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
			return
		}

		address.IsActive = !address.IsActive

		if err := db.Save(&address).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address status"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": address})
	}
}
