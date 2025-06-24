package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Wishlist struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	UserID    uuid.UUID      `gorm:"type:char(36)" json:"userId"`
	ProductID uuid.UUID      `gorm:"type:char(36)" json:"productId"`
	
	// Relationships
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Product   Product        `gorm:"foreignKey:ProductID" json:"product"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (w *Wishlist) BeforeCreate(tx *gorm.DB) (err error) {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return
}