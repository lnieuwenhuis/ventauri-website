package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TeamRoles struct {
	ID          uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	Name        string         `gorm:"index:idx_team_roles_name_search,priority:1" json:"name"`
	Description string         `json:"description"`

	CreatedAt   time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
}

func (tm *TeamRoles) BeforeCreate(tx *gorm.DB) (err error) {
	if tm.ID == uuid.Nil {
		tm.ID = uuid.New()
	}
	return
}