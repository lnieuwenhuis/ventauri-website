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
	Code             string         `gorm:"unique;index:idx_coupon_code_active,priority:1" json:"code"`
	Name             string         `gorm:"index:idx_coupon_search" json:"name"`
	Description      string         `gorm:"index:idx_coupon_search" json:"description"`
	Type             CouponType     `gorm:"index:idx_coupon_type_active,priority:1" json:"type"`
	Value            float64        `json:"value"`
	MinOrderAmount   float64        `gorm:"default:0" json:"minOrderAmount"`
	MaxDiscount      *float64       `json:"maxDiscount,omitempty"`
	UsageLimit       *int           `json:"usageLimit,omitempty"`
	UsageCount       int            `gorm:"default:0" json:"usageCount"`
	UserUsageLimit   *int           `json:"userUsageLimit,omitempty"`
	StartDate        time.Time      `gorm:"index:idx_coupon_date_range,priority:1" json:"startDate"`
	EndDate          time.Time      `gorm:"index:idx_coupon_date_range,priority:2" json:"endDate"`
	IsActive         bool           `gorm:"default:true;index:idx_coupon_code_active,priority:2;index:idx_coupon_type_active,priority:2" json:"isActive"`
}

// CouponUsage tracks individual coupon usage
type CouponUsage struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	CouponID  uuid.UUID      `gorm:"type:char(36);index:idx_coupon_usage_coupon_user,priority:1" json:"couponId"`
	UserID    uuid.UUID      `gorm:"type:char(36);index:idx_coupon_usage_coupon_user,priority:2;index:idx_coupon_usage_user" json:"userId"`
	OrderID   uuid.UUID      `gorm:"type:char(36);index:idx_coupon_usage_order" json:"orderId"`
	Discount  float64        `json:"discount"`
	
	Coupon    Coupon         `gorm:"foreignKey:CouponID" json:"coupon"`
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Order     Order          `gorm:"foreignKey:OrderID" json:"order"`
}

// BeforeCreate hook for Coupon to generate UUID
func (c *Coupon) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}

func (cu *CouponUsage) BeforeCreate(tx *gorm.DB) (err error) {
	if cu.ID == uuid.Nil {
		cu.ID = uuid.New()
	}
	return
}