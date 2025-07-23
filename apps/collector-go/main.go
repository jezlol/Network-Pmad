package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"collector/internal/collector"
	"collector/internal/config"

	"github.com/sirupsen/logrus"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to load configuration")
	}

	// Setup logging
	setupLogging(cfg.LogLevel)

	logrus.Info("Starting Network Monitoring Collector Service")

	// Create collector instance
	c, err := collector.New(cfg)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to create collector")
	}

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start collector in goroutine
	go func() {
		if err := c.Start(ctx); err != nil {
			logrus.WithError(err).Error("Collector stopped with error")
			cancel()
		}
	}()

	// Wait for shutdown signal
	<-sigChan
	logrus.Info("Shutdown signal received, stopping collector...")

	// Cancel context to stop collector
	cancel()

	// Give collector time to cleanup
	time.Sleep(2 * time.Second)
	logrus.Info("Collector service stopped")
}

func setupLogging(level string) {
	logrus.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})

	switch level {
	case "debug":
		logrus.SetLevel(logrus.DebugLevel)
	case "info":
		logrus.SetLevel(logrus.InfoLevel)
	case "warn":
		logrus.SetLevel(logrus.WarnLevel)
	case "error":
		logrus.SetLevel(logrus.ErrorLevel)
	default:
		logrus.SetLevel(logrus.InfoLevel)
	}
}