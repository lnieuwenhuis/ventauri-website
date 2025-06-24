package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Order struct {
	ID                uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt         time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt         time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	UserID            uuid.UUID      `gorm:"type:char(36)" json:"userId"`
	ProductID         uuid.UUID      `gorm:"type:char(36)" json:"productId"`
	ProductVariantID  *uuid.UUID     `gorm:"type:char(36)" json:"productVariantId,omitempty"` // Optional variant
	Quantity          int            `json:"quantity"`
	Total             float64        `json:"total"`
	Status            string         `gorm:"default:pending" json:"status"`
	ShippingAddressID uuid.UUID      `gorm:"type:char(36)" json:"shippingAddressId"`
	BillingAddressID  uuid.UUID      `gorm:"type:char(36)" json:"billingAddressId"`
	PaymentMethodID   *uuid.UUID     `gorm:"type:char(36)" json:"paymentMethodId,omitempty"`
	Subtotal          float64        `json:"subtotal"`
	Tax               float64        `json:"tax"`
	Shipping          float64        `json:"shipping"`
	OrderNumber       string         `gorm:"unique" json:"orderNumber"`
	
	// Relationships
	User            User            `gorm:"foreignKey:UserID" json:"user"`
	Product         Product         `gorm:"foreignKey:ProductID" json:"product"`
	ProductVariant  *ProductVariant `gorm:"foreignKey:ProductVariantID" json:"productVariant,omitempty"`
	ShippingAddress Address         `gorm:"foreignKey:ShippingAddressID" json:"shippingAddress"`
	BillingAddress  Address         `gorm:"foreignKey:BillingAddressID" json:"billingAddress"`
	PaymentMethod   *PaymentMethod  `gorm:"foreignKey:PaymentMethodID" json:"paymentMethod,omitempty"`
	Reviews         []Review        `gorm:"foreignKey:OrderID" json:"reviews"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (o *Order) BeforeCreate(tx *gorm.DB) (err error) {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return
}
