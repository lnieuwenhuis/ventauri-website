package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Address struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	UserID    uuid.UUID      `gorm:"type:char(36);index:idx_address_user_active,priority:1" json:"userId"`
	Street    string         `json:"street"`
	City      string         `gorm:"index:idx_address_location" json:"city"`
	State     string         `gorm:"index:idx_address_location" json:"state"`
	ZipCode   string         `json:"zipCode"`
	Country   string         `gorm:"index:idx_address_location" json:"country"`
	IsDefault bool           `gorm:"default:false;index:idx_address_user_default" json:"isDefault"`
	IsActive  bool           `gorm:"default:true;index:idx_address_user_active,priority:2" json:"isActive"`
	
	User      User           `gorm:"foreignKey:UserID" json:"user"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (address *Address) BeforeCreate(tx *gorm.DB) (err error) {
	if address.ID == (uuid.UUID{}) {
		address.ID = uuid.New()
	}
	return
}