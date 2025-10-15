package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductVariant struct {
    ID          uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
    CreatedAt   time.Time      `gorm:"autoCreateTime" json:"createdAt"`
    UpdatedAt   time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
    DeletedAt   gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	ProductID   uuid.UUID      `gorm:"type:char(36);index:idx_variant_product_active,priority:1;index:idx_variant_product_size,priority:1" json:"productId"`
	SKU         string         `gorm:"unique;index:idx_variant_sku" json:"sku"`
	Size        string         `gorm:"index:idx_variant_size;index:idx_variant_product_size,priority:2" json:"size"`
	Title       string         `gorm:"index:idx_variant_title" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Stock       int            `gorm:"index:idx_variant_stock" json:"stock"`
	PriceAdjust float64        `gorm:"default:0" json:"priceAdjust"`
	Weight      float64        `json:"weight"`
	IsActive    bool           `gorm:"default:true;index:idx_variant_product_active,priority:2" json:"isActive"`
	Images      []string       `gorm:"type:json" json:"images"`

	Product Product `gorm:"foreignKey:ProductID" json:"product"`
}

// Size constants for consistent sizing across the application
const (
	Size2XS = "2XS"
	SizeXS  = "XS"
	SizeS   = "S"
	SizeM   = "M"
	SizeL   = "L"
	SizeXL  = "XL"
	Size2XL = "2XL"
)

// GetAvailableSizes returns all available size options
func GetAvailableSizes() []string {
	return []string{Size2XS, SizeXS, SizeS, SizeM, SizeL, SizeXL, Size2XL}
}

// IsValidSize checks if a size is valid
func IsValidSize(size string) bool {
	sizes := GetAvailableSizes()
	for _, s := range sizes {
		if s == size {
			return true
		}
	}
	return false
}

// BeforeCreate will set a UUID rather than numeric ID.
func (pv *ProductVariant) BeforeCreate(tx *gorm.DB) (err error) {
	if pv.ID == uuid.Nil {
		pv.ID = uuid.New()
	}
	// Generate SKU if not provided
	if pv.SKU == "" {
		pv.SKU = fmt.Sprintf("VAR-%s-%s", pv.ProductID.String()[:8], pv.Size)
	}
	return
}
