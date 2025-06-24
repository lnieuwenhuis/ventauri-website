package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	Name      string         `gorm:"unique" json:"name"`
	Desc      string         `json:"desc"`

	Products  []Product 	 `gorm:"foreignKey:CategoryID" json:"products"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (category *Category) BeforeCreate(tx *gorm.DB) (err error) {
	if category.ID == (uuid.UUID{}) {
		category.ID = uuid.New()
	}
	return
}
