package main

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"ventauri-merch/routes" 
	"ventauri-merch/utils"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Failed to load .env file")
	}

	// Initialize database
	db := utils.InitDatabase()

	// Run migrations
	if err := utils.MigrateDatabase(db); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Seed database
	utils.SeedDatabase(db)

	// Initialize Gin router
	r := gin.Default()

	// Generate the list of allowed origins from set .env file
	allowedOriginsEnv := os.Getenv("CORS_ALLOWED_ORIGINS")
	var allowedList []string

	if allowedOriginsEnv != "" {
		allowedList = strings.Split(allowedOriginsEnv, ",")

		for i, origin := range allowedList {
			allowedList[i] = strings.TrimSpace(origin)
		}
	} else {
		allowedList = []string{
			"https://chat.safasfly.dev",
			"https://safasfly.dev",
			"https://www.safasfly.dev",
		}
	}

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedList,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Setup routes
	routes.SetupHealthRoutes(r)
	routes.SetupAuthRoutes(r, db)
	routes.SetupAddressRoutes(r, db)
	routes.SetupCartRoutes(r, db)
	routes.SetupCategoryRoutes(r, db)
	routes.SetupCouponRoutes(r, db)
	routes.SetupOrderRoutes(r, db)
	routes.SetupPaymentRoutes(r, db)
	routes.SetupProductRoutes(r, db)
	routes.SetupReviewRoutes(r, db)
	routes.SetupStatsRoutes(r, db)
	routes.SetupActivityRoutes(r, db)
	routes.SetupUserRoutes(r, db)
	routes.SetupWishlistRoutes(r, db)
	routes.SetupTeamMemberRoutes(r, db)
	routes.SetupTeamRolesRoutes(r, db)
	routes.SetupCompetitionRoutes(r, db)

	log.Printf("Routes Successfully Loaded")

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}