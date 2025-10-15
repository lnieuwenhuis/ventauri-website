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
    CreatedAt    time.Time         `gorm:"autoCreateTime" json:"createdAt"`
    UpdatedAt    time.Time         `gorm:"autoUpdateTime" json:"updatedAt"`
    DeletedAt    gorm.DeletedAt    `gorm:"index" json:"deletedAt"`
	UserID       uuid.UUID         `gorm:"type:char(36);index:idx_payment_user_active,priority:1;index:idx_payment_user_default,priority:1" json:"userId"`
	Type         PaymentMethodType `gorm:"index:idx_payment_type" json:"type"`
	Provider     string            `gorm:"index:idx_payment_provider" json:"provider"`
	Last4        string            `gorm:"index:idx_payment_last4" json:"last4"`
	ExpiryMonth  int               `json:"expiryMonth,omitempty"`
	ExpiryYear   int               `json:"expiryYear,omitempty"`
	HolderName   string            `gorm:"index:idx_payment_holder" json:"holderName"`
	IsDefault    bool              `gorm:"default:false;index:idx_payment_user_default,priority:2" json:"isDefault"`
	IsActive     bool              `gorm:"default:true;index:idx_payment_user_active,priority:2" json:"isActive"`
	Token        string            `json:"token,omitempty"`
	Fingerprint  string            `gorm:"index:idx_payment_fingerprint" json:"fingerprint,omitempty"`
	
	User         User              `gorm:"foreignKey:UserID" json:"user"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (pm *PaymentMethod) BeforeCreate(tx *gorm.DB) (err error) {
	if pm.ID == uuid.Nil {
		pm.ID = uuid.New()
	}
	return
}