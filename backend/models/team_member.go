package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TeamMember struct {
	ID          uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	FirstName   string         `gorm:"index:idx_team_member_name_search,priority:1" json:"firstName"`
	LastName    string         `gorm:"index:idx_team_member_name_search,priority:2" json:"lastName"`
	Bio         string         `json:"bio"`
	RoleID      uuid.UUID      `gorm:"type:char(36);index:idx_team_member_role_search" json:"roleId"`
	Role        TeamRoles      `json:"role"`
	Nationality string         `json:"nationality"`
	Picture     string         `json:"picture"`
	
    CreatedAt   time.Time      `gorm:"autoCreateTime" json:"createdAt"`
    UpdatedAt   time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
    DeletedAt   gorm.DeletedAt `gorm:"index" json:"deletedAt"`
}

func (tm *TeamMember) BeforeCreate(tx *gorm.DB) (err error) {
	if tm.ID == uuid.Nil {
		tm.ID = uuid.New()
	}
	return
}