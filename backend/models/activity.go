package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityType string

const (
	ActivityUserRegistered    ActivityType = "user_registered"
	ActivityUserLogin         ActivityType = "user_login"
	ActivityOrderCreated      ActivityType = "order_created"
	ActivityOrderUpdated      ActivityType = "order_updated"
	ActivityOrderCancelled    ActivityType = "order_cancelled"
	ActivityProductCreated    ActivityType = "product_created"
	ActivityProductUpdated    ActivityType = "product_updated"
	ActivityProductDeleted    ActivityType = "product_deleted"
	ActivityReviewCreated     ActivityType = "review_created"
	ActivityReviewApproved    ActivityType = "review_approved"
	ActivityCategoryCreated   ActivityType = "category_created"
	ActivityCategoryUpdated   ActivityType = "category_updated"
	ActivityCategoryDeleted   ActivityType = "category_deleted"
	ActivityCouponCreated     ActivityType = "coupon_created"
	ActivityCouponUpdated     ActivityType = "coupon_updated"
	ActivityCouponDeleted     ActivityType = "coupon_deleted"
	ActivityUserUpdated       ActivityType = "user_updated"
	ActivityUserDeleted       ActivityType = "user_deleted"
	ActivityPaymentAdded      ActivityType = "payment_added"
	ActivityInventoryUpdated  ActivityType = "inventory_updated"
	ActivityTeamMemberCreated ActivityType = "team_member_created"
	ActivityTeamMemberUpdated ActivityType = "team_member_updated"
	ActivityTeamMemberDeleted ActivityType = "team_member_deleted"
	ActivityTeamRoleCreated   ActivityType = "team_role_created"
	ActivityTeamRoleUpdated   ActivityType = "team_role_updated"
	ActivityTeamRoleDeleted   ActivityType = "team_role_deleted"
	ActivityCompetitionCreated ActivityType = "competition_created"
	ActivityCompetitionUpdated ActivityType = "competition_updated"
	ActivityCompetitionDeleted ActivityType = "competition_deleted"
	ActivityTrackCreated      ActivityType = "track_created"
	ActivityTrackUpdated      ActivityType = "track_updated"
	ActivityTrackDeleted      ActivityType = "track_deleted"
)

type Activity struct {
	ID          uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt   time.Time      `gorm:"default:current_timestamp;index:idx_activity_created" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"default:current_timestamp" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deletedAt"`
	
	UserID      *uuid.UUID     `gorm:"type:char(36);index:idx_activity_user" json:"userId,omitempty"`
	User        *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	
	Type        ActivityType   `gorm:"index:idx_activity_type" json:"type"`
	Description string         `json:"description"`
	EntityType  *string        `json:"entityType,omitempty"` 
	EntityID    *string        `json:"entityId,omitempty"`
	Metadata    *string        `gorm:"type:text" json:"metadata,omitempty"`
}

// BeforeCreate will set a UUID rather than numeric ID.
func (activity *Activity) BeforeCreate(tx *gorm.DB) error {
	if activity.ID == uuid.Nil {
		activity.ID = uuid.New()
	}
	return nil
}