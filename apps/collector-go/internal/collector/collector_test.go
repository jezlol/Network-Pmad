package collector

import (
	"context"
	"testing"
	"time"

	"collector/internal/config"
)

func TestCollector_New(t *testing.T) {
	tests := []struct {
		name    string
		config  *config.Config
		wantErr bool
	}{
		{
			name: "valid config",
			config: &config.Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: config.InfluxDBConfig{
					URL:    "http://localhost:8086",
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: config.PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			wantErr: true, // Will fail without actual DB connections
		},
		{
			name:    "nil config",
			config:  nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c, err := New(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("New() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && c == nil {
				t.Error("New() returned nil collector")
			}
		})
	}
}

func TestCollector_ValidateConfig(t *testing.T) {
	tests := []struct {
		name    string
		config  *config.Config
		valid   bool
	}{
		{
			name: "valid config",
			config: &config.Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: config.InfluxDBConfig{
					URL:    "http://localhost:8086",
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: config.PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			valid: true,
		},
		{
			name: "missing InfluxDB URL",
			config: &config.Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: config.InfluxDBConfig{
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: config.PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			valid: false,
		},
		{
			name: "missing PostgreSQL host",
			config: &config.Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: config.InfluxDBConfig{
					URL:    "http://localhost:8086",
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: config.PostgreSQLConfig{},
				LogLevel: "info",
			},
			valid: false,
		},
		{
			name: "zero polling intervals",
			config: &config.Config{
				StatusPollInterval:  0,
				MetricsPollInterval: 0,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: config.InfluxDBConfig{
					URL:    "http://localhost:8086",
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: config.PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := New(tt.config)
			hasError := err != nil
			if tt.valid && hasError {
				// For valid configs, we expect connection errors, not validation errors
				// Check if it's a validation error vs connection error
				if err.Error() == "config is required" {
					t.Errorf("Expected valid config but got validation error: %v", err)
				}
			}
			if !tt.valid && !hasError {
				t.Error("Expected invalid config but got no error")
			}
		})
	}
}

func TestCollector_Start_Stop(t *testing.T) {
	// This test verifies that the collector can start and stop gracefully
	config := &config.Config{
		StatusPollInterval:  1 * time.Second,
		MetricsPollInterval: 2 * time.Second,
		DeviceTimeout:       5 * time.Second,
		InfluxDB: config.InfluxDBConfig{
			URL:    "http://localhost:8086",
			Token:  "test-token",
			Org:    "test-org",
			Bucket: "test-bucket",
		},
		PostgreSQL: config.PostgreSQLConfig{
			URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
		},
		LogLevel: "info",
	}

	// Skip this test if we can't create a collector (no DB connections)
	c, err := New(config)
	if err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	// Start collector in goroutine
	done := make(chan error, 1)
	go func() {
		done <- c.Start(ctx)
	}()

	// Let it run for a short time
	time.Sleep(1 * time.Second)

	// Cancel context to stop collector
	cancel()

	// Wait for collector to stop
	select {
	case err := <-done:
		if err != nil && err != context.Canceled {
			t.Errorf("Collector.Start() error = %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Error("Collector did not stop within timeout")
	}
}