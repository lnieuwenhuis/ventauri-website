package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Order struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp;index:idx_order_status_created,priority:2;index:idx_order_user_created,priority:2" json:"created_at"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"`
	UserID    uuid.UUID      `gorm:"type:char(36);index:idx_order_user_created,priority:1;index:idx_order_user_status,priority:1" json:"user_id"`
	Total             float64    `gorm:"index:idx_order_total_status,priority:1" json:"total"`
	Status            string     `gorm:"default:pending;index:idx_order_status_created,priority:1;index:idx_order_user_status,priority:2;index:idx_order_total_status,priority:2" json:"status"`
	ShippingAddressID uuid.UUID  `gorm:"type:char(36)" json:"shipping_address_id"`
	BillingAddressID  uuid.UUID  `gorm:"type:char(36)" json:"billing_address_id"`
	PaymentMethodID   *uuid.UUID `gorm:"type:char(36)" json:"payment_method_id,omitempty"`
	Subtotal          float64    `json:"subtotal"`
	Tax               float64    `json:"tax"`
	Shipping          float64    `json:"shipping"`
	OrderNumber       string     `gorm:"unique;index:idx_order_number" json:"order_number"`
	// Stripe integration
	StripePaymentIntentID *string `gorm:"type:varchar(255);index:idx_order_stripe_pi" json:"stripe_payment_intent_id,omitempty"`

	User            User            `gorm:"foreignKey:UserID" json:"user"`
	ShippingAddress Address         `gorm:"foreignKey:ShippingAddressID" json:"shipping_address"`
	BillingAddress  Address         `gorm:"foreignKey:BillingAddressID" json:"billing_address"`
	PaymentMethod   *PaymentMethod  `gorm:"foreignKey:PaymentMethodID" json:"payment_method,omitempty"`
	Reviews         []Review        `gorm:"foreignKey:OrderID" json:"reviews"`
	Items           []OrderItem     `gorm:"foreignKey:OrderID" json:"items"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (o *Order) BeforeCreate(tx *gorm.DB) (err error) {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return
}
