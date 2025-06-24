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
	UserID    uuid.UUID      `gorm:"type:char(36)" json:"userId"`
	Street    string         `json:"street"`
	City      string         `json:"city"`
	State     string         `json:"state"`
	ZipCode   string         `json:"zipCode"`
	Country   string         `json:"country"`
	IsDefault bool           `gorm:"default:false" json:"isDefault"`
	
	User      User           `gorm:"foreignKey:UserID" json:"user"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (address *Address) BeforeCreate(tx *gorm.DB) (err error) {
	if address.ID == (uuid.UUID{}) {
		address.ID = uuid.New()
	}
	return
}