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
	ProductID   uuid.UUID      `gorm:"type:char(36)" json:"productId"`
	SKU         string         `gorm:"unique" json:"sku"`
	Size        string         `json:"size"`
	Color       string         `json:"color"`
	Stock       int            `json:"stock"`
	PriceAdjust float64        `gorm:"default:0" json:"priceAdjust"` // Price difference from base product
	Weight      float64        `json:"weight"`
	IsActive    bool           `gorm:"default:true" json:"isActive"`
	Images      []string       `gorm:"type:json" json:"images"` // Variant-specific images
	
	// Relationships
	Product     Product        `gorm:"foreignKey:ProductID" json:"product"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (pv *ProductVariant) BeforeCreate(tx *gorm.DB) (err error) {
	if pv.ID == uuid.Nil {
		pv.ID = uuid.New()
	}
	return
}