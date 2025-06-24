package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CouponType string

const (
	CouponTypePercentage CouponType = "percentage"
	CouponTypeFixed      CouponType = "fixed"
	CouponTypeFreeShipping CouponType = "free_shipping"
)

type Coupon struct {
	ID               uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt        time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt        time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	Code             string         `gorm:"unique" json:"code"`
	Name             string         `json:"name"`
	Description      string         `json:"description"`
	Type             CouponType     `json:"type"`
	Value            float64        `json:"value"` // Percentage (0-100) or fixed amount
	MinOrderAmount   float64        `gorm:"default:0" json:"minOrderAmount"`
	MaxDiscount      *float64       `json:"maxDiscount,omitempty"` // For percentage coupons
	UsageLimit       *int           `json:"usageLimit,omitempty"` // Null = unlimited
	UsageCount       int            `gorm:"default:0" json:"usageCount"`
	UserUsageLimit   *int           `json:"userUsageLimit,omitempty"` // Per user limit
	StartDate        time.Time      `json:"startDate"`
	EndDate          time.Time      `json:"endDate"`
	IsActive         bool           `gorm:"default:true" json:"isActive"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (c *Coupon) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}

// CouponUsage tracks individual coupon usage
type CouponUsage struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	CouponID  uuid.UUID      `gorm:"type:char(36)" json:"couponId"`
	UserID    uuid.UUID      `gorm:"type:char(36)" json:"userId"`
	OrderID   uuid.UUID      `gorm:"type:char(36)" json:"orderId"`
	Discount  float64        `json:"discount"`
	
	// Relationships
	Coupon    Coupon         `gorm:"foreignKey:CouponID" json:"coupon"`
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Order     Order          `gorm:"foreignKey:OrderID" json:"order"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (cu *CouponUsage) BeforeCreate(tx *gorm.DB) (err error) {
	if cu.ID == uuid.Nil {
		cu.ID = uuid.New()
	}
	return
}