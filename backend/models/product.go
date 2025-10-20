package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
    ID          uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
    CreatedAt   time.Time      `gorm:"autoCreateTime;index:idx_product_active_created,priority:2" json:"createdAt"`
    UpdatedAt   time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
    DeletedAt   gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	Name        string         `gorm:"index:idx_product_name_search" json:"name"`
	Price       float64        `gorm:"index:idx_product_price_range" json:"price"`
	Images      string         `gorm:"type:json" json:"images"`
	Options     string         `gorm:"type:json" json:"options"`
	CategoryID  uuid.UUID      `gorm:"type:char(36);index:idx_product_category_active,priority:1" json:"categoryId"`
	Description string         `gorm:"type:text;index:idx_product_desc_search" json:"description"`
	SKU         string         `gorm:"unique;index:idx_product_sku" json:"sku"`
	Weight      float64        `json:"weight"`
	IsActive    bool           `gorm:"default:true;index:idx_product_active_created,priority:1;index:idx_product_category_active,priority:2" json:"isActive"`
	// Size configuration - JSON array of enabled sizes
	EnabledSizes string `gorm:"type:json" json:"enabledSizes"`
	// Shipping prices - JSON array of numbers (e.g., [4.99, 7.99, 12.99])
	ShippingPrices string `gorm:"type:json" json:"shippingPrices"`

	Category Category         `gorm:"foreignKey:CategoryID" json:"category"`
	Variants []ProductVariant `gorm:"foreignKey:ProductID" json:"variants"`
	Reviews  []Review         `gorm:"foreignKey:ProductID" json:"reviews"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (p *Product) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return
}

// GetAverageRating calculates the average rating for this product
func (p *Product) GetAverageRating(db *gorm.DB) float64 {
	var avg float64
	db.Model(&Review{}).Where("product_id = ? AND is_approved = ?", p.ID, true).Select("AVG(rating)").Scan(&avg)
	return avg
}

// GetReviewCount returns the total number of approved reviews
func (p *Product) GetReviewCount(db *gorm.DB) int64 {
	var count int64
	db.Model(&Review{}).Where("product_id = ? AND is_approved = ?", p.ID, true).Count(&count)
	return count
}
