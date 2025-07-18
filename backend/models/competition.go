package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Track struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	DateTime time.Time `json:"datetime"`
	IsActive bool      `json:"isActive"`
	Personnel []uuid.UUIDs `json:"personnel"`
	// TODO: Add Seperate Personnel Fetching on Competition Load
}

// TrackSlice is a custom type to handle JSON serialization
type TrackSlice []Track

// Value implements the driver.Valuer interface for database storage
func (ts TrackSlice) Value() (driver.Value, error) {
	if ts == nil {
		return nil, nil
	}
	return json.Marshal(ts)
}

// Scan implements the sql.Scanner interface for database retrieval
func (ts *TrackSlice) Scan(value interface{}) error {
	if value == nil {
		*ts = nil
		return nil
	}
	
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("cannot scan into TrackSlice")
	}
	
	return json.Unmarshal(bytes, ts)
}

type Competition struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `gorm:"default:current_timestamp;index:idx_competition_active_created,priority:2" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	Name      string         `gorm:"unique;index:idx_competition_name_search" json:"name"`
	Desc      string         `gorm:"index:idx_competition_desc_search" json:"desc"`
	Schedule  TrackSlice     `gorm:"type:json" json:"schedule"`
	IsActive  bool           `gorm:"default:true;index:idx_competition_active_created,priority:1" json:"isActive"`
}

func (c *Competition) BeforeCreate(tx *gorm.DB) (err error) {
	if (c.ID == uuid.Nil) {
		c.ID = uuid.New()
	}
	return
}