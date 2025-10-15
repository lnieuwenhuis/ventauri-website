package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OrderItem represents a single line item within an Order
type OrderItem struct {
    ID        uuid.UUID `gorm:"type:char(36);primary_key" json:"id"`
    CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
    UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	OrderID          uuid.UUID  `gorm:"type:char(36);index" json:"order_id"`
	ProductID        uuid.UUID  `gorm:"type:char(36);index" json:"product_id"`
	ProductVariantID *uuid.UUID `gorm:"type:char(36);index" json:"product_variant_id,omitempty"`
	Quantity         int        `json:"quantity"`
	UnitPrice        float64    `json:"unit_price"`
	Subtotal         float64    `json:"subtotal"`

	// Relations
	Product        Product         `gorm:"foreignKey:ProductID" json:"product"`
	ProductVariant *ProductVariant `gorm:"foreignKey:ProductVariantID" json:"product_variant,omitempty"`
}

func (oi *OrderItem) BeforeCreate(tx *gorm.DB) (err error) {
	if oi.ID == uuid.Nil {
		oi.ID = uuid.New()
	}
	return
}
