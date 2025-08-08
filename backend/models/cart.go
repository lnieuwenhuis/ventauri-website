package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Cart struct {
	ID               uuid.UUID  `gorm:"type:char(36);primary_key;default:(UUID())" json:"id"`
	CreatedAt        time.Time  `gorm:"default:current_timestamp;index:idx_cart_created" json:"createdAt"`
	UpdatedAt        time.Time  `gorm:"default:current_timestamp" json:"updatedAt"`
	UserID           uuid.UUID  `gorm:"type:char(36);index:idx_cart_user_product,priority:1;index:idx_cart_user_created,priority:1" json:"userId"`
	ProductID        uuid.UUID  `gorm:"type:char(36);index:idx_cart_user_product,priority:2;index:idx_cart_product" json:"productId"`
	ProductVariantID *uuid.UUID `gorm:"type:char(36);index:idx_cart_variant" json:"productVariantId,omitempty"`
	Quantity         int        `json:"quantity"`

	User           User            `gorm:"foreignKey:UserID" json:"user"`
	Product        Product         `gorm:"foreignKey:ProductID" json:"product"`
	ProductVariant *ProductVariant `gorm:"foreignKey:ProductVariantID" json:"productVariant,omitempty"`
}

// BeforeCreate hook to ensure UUID generation
func (c *Cart) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
