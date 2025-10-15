package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"

	"ventauri-merch/models"
)

type AuthService struct {
	db           *gorm.DB
	googleConfig *oauth2.Config
}

type GoogleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
	GivenName string `json:"given_name"`
	FamilyName string `json:"family_name"`
}

func NewAuthService(db *gorm.DB) *AuthService {
    clientID := os.Getenv("GOOGLE_CLIENT_ID")
    clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
    backendURL := os.Getenv("BACKEND_URL")

    // Make OAuth optional: warn if missing, but don't crash the app
    var googleConfig *oauth2.Config
    if clientID == "" || clientSecret == "" || backendURL == "" {
        if clientID == "" {
            log.Printf("GOOGLE_CLIENT_ID environment variable is not set")
        }
        if clientSecret == "" {
            log.Printf("GOOGLE_CLIENT_SECRET environment variable is not set")
        }
        if backendURL == "" {
            log.Printf("BACKEND_URL environment variable is not set")
        }
        // Leave googleConfig as nil; endpoints will respond with 503 when used
    } else {
        googleConfig = &oauth2.Config{
            ClientID:     clientID,
            ClientSecret: clientSecret,
            RedirectURL:  backendURL + "/api/auth/callback/google",
            Scopes:       []string{"openid", "email", "profile"},
            Endpoint:     google.Endpoint,
        }
    }

	return &AuthService{
		db:           db,
		googleConfig: googleConfig,
	}
}

func (a *AuthService) SignInSocial(c *gin.Context) {
	var req struct {
		Provider    string `json:"provider"`
		CallbackURL string `json:"callbackURL"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Provider != "google" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported provider"})
		return
	}

    // Ensure Google OAuth is configured
    if a.googleConfig == nil {
        c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Social login is not configured"})
        return
    }

    // Store callback URL in session/state
    state := uuid.New().String()
    url := a.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)

	c.JSON(http.StatusOK, gin.H{
		"url": url,
	})
}

func (a *AuthService) GoogleCallback(c *gin.Context) {
    // Ensure Google OAuth is configured
    if a.googleConfig == nil {
        c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Social login is not configured"})
        return
    }
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No code provided"})
		return
	}

	// Exchange code for token
	token, err := a.googleConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Printf("Failed to exchange token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token"})
		return
	}

	// Get user info from Google
	client := a.googleConfig.Client(context.Background(), token)
	googleUserInfoURL := "https://www.googleapis.com/oauth2/v2/userinfo"
	resp, err := client.Get(googleUserInfoURL)
	if err != nil {
		log.Printf("Failed to get user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	var googleUser GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		log.Printf("Failed to decode user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user info"})
		return
	}

	// Create or update user
	user, err := a.createOrUpdateUser(googleUser)
	if err != nil {
		log.Printf("Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Create session
	session, err := a.createSession(user.ID)
	if err != nil {
		log.Printf("Failed to create session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	// Set session cookie
	frontendDomain := os.Getenv("FRONTEND_DOMAIN")
	if frontendDomain == "" {
		frontendDomain = "localhost"
	}
	c.SetCookie("session_id", session.ID.String(), int(time.Hour*24*7/time.Second), "/", frontendDomain, false, true)

	// Redirect to frontend
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	c.Redirect(http.StatusFound, frontendURL+"/dashboard")
}

func (a *AuthService) GetSession(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}

	user, err := a.getUserBySessionID(sessionID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"user": user,
			"session": gin.H{
				"id": sessionID,
			},
		},
	})
}

func (a *AuthService) SignOut(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	// Parse session ID
	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	// Delete session from database
	err = a.db.Where("id = ?", sessionUUID).Delete(&models.Session{}).Error
	if err != nil {
		log.Printf("Failed to delete session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete session"})
		return
	}

	// Clear cookie
	frontendDomain := os.Getenv("FRONTEND_DOMAIN")
	if frontendDomain == "" {
		frontendDomain = "localhost"
	}
	c.SetCookie("session_id", "", -1, "/", frontendDomain, false, true)

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (a *AuthService) createOrUpdateUser(googleUser GoogleUserInfo) (*models.User, error) {
	now := time.Now()

	// Try to find existing user by Google ID or email
	var existingUser models.User
	err := a.db.Where("google_id = ? OR email = ?", googleUser.ID, googleUser.Email).First(&existingUser).Error

	if err == gorm.ErrRecordNotFound {
		// Create new user
		newUser := models.User{
			Email:       googleUser.Email,
			FirstName:   googleUser.GivenName,
			LastName:    googleUser.FamilyName,
			GoogleID:    &googleUser.ID,
			Avatar:      &googleUser.Picture,
			DisplayName: &googleUser.Name,
			LastLoginAt: &now,
			IsActive:    true,
			Role:        models.UserRoleUser,
		}

		// Check if this email should be admin
		if googleUser.Email == "lnieuwenhuis48@gmail.com" || googleUser.Email == "ventaurivnt@gmail.com" {
			newUser.Role = models.UserRoleAdmin
			log.Printf("Admin user created: %s", googleUser.Email)
		}

		if err := a.db.Create(&newUser).Error; err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}

		// Add activity tracking for new user registration
		if err := CreateActivity(a.db, &newUser.ID, models.ActivityUserRegistered, 
			fmt.Sprintf("User registered via Google OAuth: %s", newUser.Email), 
			StringPtr("user"), StringPtr(newUser.ID.String()), nil); err != nil {
			return nil, fmt.Errorf("failed to create activity: %w", err)
		}

		return &newUser, nil
	} else if err != nil {
		return nil, fmt.Errorf("failed to query user: %w", err)
	}

	// Update existing user
	updates := map[string]interface{}{
		"google_id":     googleUser.ID,
		"avatar":        googleUser.Picture,
		"display_name":  googleUser.Name,
		"last_login_at": now,
	}

	// Check if this email should be admin (for existing users too)
	if (googleUser.Email == "lnieuwenhuis48@gmail.com" || googleUser.Email == "ventaurivnt@gmail.com") && existingUser.Role != models.UserRoleAdmin {
		updates["role"] = models.UserRoleAdmin
		log.Printf("Existing user promoted to admin: %s", googleUser.Email)
	}

	// Update name fields if they're empty
	if existingUser.FirstName == "" {
		updates["first_name"] = googleUser.GivenName
	}
	if existingUser.LastName == "" {
		updates["last_name"] = googleUser.FamilyName
	}

	if err := a.db.Model(&existingUser).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Reload user to get updated data
	if err := a.db.First(&existingUser, existingUser.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to reload user: %w", err)
	}

	return &existingUser, nil
}

func (a *AuthService) createSession(userID uuid.UUID) (*models.Session, error) {
	session := models.Session{
		UserID:    userID,
		Token:     uuid.New().String(),
		ExpiresAt: time.Now().Add(time.Hour * 24 * 7),
		IsActive:  true,
	}

	if err := a.db.Create(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return &session, nil
}

func (a *AuthService) getUserBySessionID(sessionID string) (*models.User, error) {
	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		return nil, fmt.Errorf("invalid session ID: %w", err)
	}

	var session models.Session
	err = a.db.Where("id = ? AND expires_at > ? AND is_active = ?", sessionUUID, time.Now(), true).First(&session).Error
	if err != nil {
		return nil, fmt.Errorf("session not found or expired: %w", err)
	}

	var user models.User
	err = a.db.First(&user, session.UserID).Error
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &user, nil
}

// Middleware to check user authentication
func (a *AuthService) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie("session_id")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No session found"})
			c.Abort()
			return
		}

		user, err := a.getUserBySessionID(sessionID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session"})
			c.Abort()
			return
		}

		// Check if user is active
		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account is deactivated"})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", user)
		c.Next()
	}
}

// Middleware to check admin authentication
func (a *AuthService) AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID, err := c.Cookie("session_id")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No session found"})
			c.Abort()
			return
		}

		user, err := a.getUserBySessionID(sessionID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session"})
			c.Abort()
			return
		}

		// Check if user is admin
		if user.Role != models.UserRoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", user)
		c.Next()
	}
}

// Helper function to check if current user is admin
func IsCurrentUserAdmin(c *gin.Context) bool {
	user, exists := GetCurrentUser(c)
	if !exists {
		return false
	}
	return user.Role == models.UserRoleAdmin
}

// Helper function to get current user from context
func GetCurrentUser(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}
	return user.(*models.User), true
}
