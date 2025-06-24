package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	UserRoleAdmin UserRole = "admin"
	UserRoleUser  UserRole = "user"
)

type User struct {
	ID          uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt   time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	Email       string         `gorm:"unique" json:"email"`
	Password    *string        `json:"password,omitempty"` 
	Role        UserRole       `gorm:"default:user" json:"role"`
	FirstName   string         `json:"firstName"`
	LastName    string         `json:"lastName"`
	Phone       string         `json:"phone"`
	IsActive    bool           `gorm:"default:true" json:"isActive"`
	
	// OAuth fields
	GoogleID    *string        `gorm:"unique" json:"googleId,omitempty"`
	Avatar      *string        `json:"avatar,omitempty"`
	DisplayName *string        `json:"displayName,omitempty"`
	LastLoginAt *time.Time     `json:"lastLoginAt,omitempty"`
	
	// Relationships
	Addresses      []Address       `gorm:"foreignKey:UserID" json:"addresses"`
	Orders         []Order         `gorm:"foreignKey:UserID" json:"orders"`
	Cart           []Cart          `gorm:"foreignKey:UserID" json:"cart"`
	Reviews        []Review        `gorm:"foreignKey:UserID" json:"reviews"`
	PaymentMethods []PaymentMethod `gorm:"foreignKey:UserID" json:"paymentMethods"`
	Sessions       []Session       `gorm:"foreignKey:UserID" json:"sessions"`
}

// Session model for managing user sessions
type Session struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	UserID    uuid.UUID      `gorm:"type:char(36)" json:"userId"`
	ExpiresAt time.Time      `json:"expiresAt"`
	IsActive  bool           `gorm:"default:true" json:"isActive"`
	
	// Relationships
	User      User           `gorm:"foreignKey:UserID" json:"user"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}

// BeforeCreate will set a UUID rather than numeric ID.
func (s *Session) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return
}

// GetFullName returns the user's full name
func (u *User) GetFullName() string {
	if u.DisplayName != nil && *u.DisplayName != "" {
		return *u.DisplayName
	}
	return u.FirstName + " " + u.LastName
}