package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp;index:idx_category_active_created,priority:2" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	Name      string         `gorm:"unique;index:idx_category_name_search" json:"name"`
	Desc      string         `gorm:"index:idx_category_desc_search" json:"desc"`
	IsActive  bool           `gorm:"default:true;index:idx_category_active_created,priority:1" json:"isActive"`

	Products  []Product      `gorm:"foreignKey:CategoryID" json:"products"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (category *Category) BeforeCreate(tx *gorm.DB) (err error) {
	if category.ID == (uuid.UUID{}) {
		category.ID = uuid.New()
	}
	return
}
