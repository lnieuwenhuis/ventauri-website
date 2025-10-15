package routes

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

// SetupHealthRoutes registers a simple health check endpoint.
func SetupHealthRoutes(router *gin.Engine) {
    router.GET("/api/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    })
}