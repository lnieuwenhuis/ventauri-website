package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Review struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp;index:idx_review_product_approved_created,priority:3" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	UserID    uuid.UUID      `gorm:"type:char(36);index:idx_review_user_product,priority:1" json:"userId"`
	ProductID uuid.UUID      `gorm:"type:char(36);index:idx_review_user_product,priority:2;index:idx_review_product_approved_created,priority:1" json:"productId"`
	OrderID   uuid.UUID      `gorm:"type:char(36);index:idx_review_order" json:"orderId"`
	Rating    int            `gorm:"check:rating >= 1 AND rating <= 5;index:idx_review_rating" json:"rating"`
	Title     string         `gorm:"index:idx_review_title_search" json:"title"`
	Comment   string         `gorm:"type:text;index:idx_review_comment_search" json:"comment"`
	IsVerified bool          `gorm:"default:false;index:idx_review_verified" json:"isVerified"`
	IsApproved bool          `gorm:"default:true;index:idx_review_product_approved_created,priority:2" json:"isApproved"`
	HelpfulCount int         `gorm:"default:0;index:idx_review_helpful" json:"helpfulCount"`
	
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