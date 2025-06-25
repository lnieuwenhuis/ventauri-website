package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductVariant struct {
	ID          uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt   time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	ProductID   uuid.UUID      `gorm:"type:char(36);index:idx_variant_product_active,priority:1;index:idx_variant_product_size,priority:1" json:"productId"`
	SKU         string         `gorm:"unique;index:idx_variant_sku" json:"sku"`
	Size        string         `gorm:"index:idx_variant_size;index:idx_variant_product_size,priority:2" json:"size"`
	Color       string         `gorm:"index:idx_variant_color" json:"color"`
	Stock       int            `gorm:"index:idx_variant_stock" json:"stock"`
	PriceAdjust float64        `gorm:"default:0" json:"priceAdjust"`
	Weight      float64        `json:"weight"`
	IsActive    bool           `gorm:"default:true;index:idx_variant_product_active,priority:2" json:"isActive"`
	Images      []string       `gorm:"type:json" json:"images"`
	
	Product     Product        `gorm:"foreignKey:ProductID" json:"product"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (pv *ProductVariant) BeforeCreate(tx *gorm.DB) (err error) {
	if pv.ID == uuid.Nil {
		pv.ID = uuid.New()
	}
	return
}