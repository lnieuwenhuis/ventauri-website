package seeders

import (
    "log"
    "errors"

    "gorm.io/gorm"
    "ventauri-merch/models"
)

// SeedSizeOptions ensures a sane default set of sizes exists (including 3XL)
func SeedSizeOptions(db *gorm.DB) {
    defaults := []string{"2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL"}

    created := 0
    for _, name := range defaults {
        var existing models.SizeOption
        err := db.Where("name = ?", name).First(&existing).Error
        if errors.Is(err, gorm.ErrRecordNotFound) {
            if createErr := db.Create(&models.SizeOption{Name: name, IsActive: true}).Error; createErr != nil {
                log.Printf("Failed to seed size option %s: %v", name, createErr)
            } else {
                created++
            }
        } else if err != nil {
            log.Printf("Error checking size option %s: %v", name, err)
        } else if !existing.IsActive {
            // Ensure default sizes are active
            existing.IsActive = true
            if err := db.Save(&existing).Error; err != nil {
                log.Printf("Failed to reactivate size option %s: %v", name, err)
            }
        }
    }

    log.Printf("Seeded %d new size options", created)
}