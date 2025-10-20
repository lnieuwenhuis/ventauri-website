package models

import (
    "time"

    "gorm.io/gorm"
)

// SizeOption represents a globally available size option that can be enabled per product
type SizeOption struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    Name      string         `gorm:"size:10;uniqueIndex;not null" json:"name"`
    IsActive  bool           `gorm:"default:true;not null" json:"isActive"`
    CreatedAt time.Time      `gorm:"autoCreateTime" json:"createdAt"`
    UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt"`
}

// GetAvailableSizes returns active sizes from the database (ordered by name)
func GetAvailableSizes(db *gorm.DB) []string {
    var options []SizeOption
    _ = db.Where("is_active = ?", true).Order("name asc").Find(&options).Error
    sizes := make([]string, 0, len(options))
    for _, opt := range options {
        sizes = append(sizes, opt.Name)
    }
    return sizes
}

// IsValidSize checks if a size exists and is active in the database
func IsValidSize(db *gorm.DB, size string) bool {
    var count int64
    db.Model(&SizeOption{}).Where("name = ? AND is_active = ?", size, true).Count(&count)
    return count > 0
}