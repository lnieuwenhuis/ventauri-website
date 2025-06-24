package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentMethodType string

const (
	PaymentMethodCreditCard PaymentMethodType = "credit_card"
	PaymentMethodDebitCard  PaymentMethodType = "debit_card"
	PaymentMethodPayPal     PaymentMethodType = "paypal"
	PaymentMethodApplePay   PaymentMethodType = "apple_pay"
	PaymentMethodGooglePay  PaymentMethodType = "google_pay"
	PaymentMethodBankTransfer PaymentMethodType = "bank_transfer"
)

type PaymentMethod struct {
	ID           uuid.UUID         `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt    time.Time         `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt    time.Time         `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt    gorm.DeletedAt    `gorm:"index" json:"deletedAt"`
	UserID       uuid.UUID         `gorm:"type:char(36)" json:"userId"`
	Type         PaymentMethodType `json:"type"`
	Provider     string            `json:"provider"` // Visa, Mastercard, PayPal, etc.
	Last4        string            `json:"last4"` // Last 4 digits for cards
	ExpiryMonth  int               `json:"expiryMonth,omitempty"`
	ExpiryYear   int               `json:"expiryYear,omitempty"`
	HolderName   string            `json:"holderName"`
	IsDefault    bool              `gorm:"default:false" json:"isDefault"`
	IsActive     bool              `gorm:"default:true" json:"isActive"`
	Token        string            `json:"token,omitempty"` // Payment gateway token
	Fingerprint  string            `json:"fingerprint,omitempty"` // Unique card fingerprint
	
	// Relationships
	User         User              `gorm:"foreignKey:UserID" json:"user"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (pm *PaymentMethod) BeforeCreate(tx *gorm.DB) (err error) {
	if pm.ID == uuid.Nil {
		pm.ID = uuid.New()
	}
	return
}