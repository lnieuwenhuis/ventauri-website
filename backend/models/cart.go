package models

import (
	"time"
	"github.com/google/uuid"
)

type Cart struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp;index:idx_cart_created" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	UserID    uuid.UUID      `gorm:"type:char(36);index:idx_cart_user_product,priority:1;index:idx_cart_user_created,priority:1" json:"userId"`
	ProductID uuid.UUID      `gorm:"type:char(36);index:idx_cart_user_product,priority:2;index:idx_cart_product" json:"productId"`
	Quantity  int            `json:"quantity"`
	
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Product   Product        `gorm:"foreignKey:ProductID" json:"product"`
}