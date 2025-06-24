package models

import (
	"time"
	"github.com/google/uuid"
)

type Cart struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	UserID    uuid.UUID      `gorm:"type:char(36)" json:"userId"`
	ProductID uuid.UUID      `gorm:"type:char(36)" json:"productId"`
	Quantity  int            `json:"quantity"`
	
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Product   Product        `gorm:"foreignKey:ProductID" json:"product"`
}