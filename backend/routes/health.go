package routes

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

// SetupHealthRoutes registers a simple health check endpoint.
func SetupHealthRoutes(router *gin.Engine) {
    // GET for humans and probes expecting a JSON body
    router.GET("/api/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    })

    // HEAD for container healthchecks using wget --spider (no body)
    router.HEAD("/api/health", func(c *gin.Context) {
        c.Status(http.StatusOK)
    })
}