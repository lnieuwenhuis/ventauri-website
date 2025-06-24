package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Review struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	UserID    uuid.UUID      `gorm:"type:char(36)" json:"userId"`
	ProductID uuid.UUID      `gorm:"type:char(36)" json:"productId"`
	OrderID   uuid.UUID      `gorm:"type:char(36)" json:"orderId"` // Link to verified purchase
	Rating    int            `gorm:"check:rating >= 1 AND rating <= 5" json:"rating"`
	Title     string         `json:"title"`
	Comment   string         `gorm:"type:text" json:"comment"`
	IsVerified bool          `gorm:"default:false" json:"isVerified"` // Verified purchase
	IsApproved bool          `gorm:"default:true" json:"isApproved"` // Admin approval
	HelpfulCount int         `gorm:"default:0" json:"helpfulCount"`
	
	// Relationships
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Product   Product        `gorm:"foreignKey:ProductID" json:"product"`
	Order     Order          `gorm:"foreignKey:OrderID" json:"order"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (r *Review) BeforeCreate(tx *gorm.DB) (err error) {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return
}