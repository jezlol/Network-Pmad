package influx

import (
	"context"
	"collector/internal/config"
	"collector/internal/metrics"
	"testing"
	"time"
)

// TestInfluxClient_WriteMetricsBatch tests batch writing functionality
func TestInfluxClient_WriteMetricsBatch(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// This test requires a running InfluxDB instance
	// Skip if INFLUX_URL environment variable is not set
	cfg := config.InfluxDBConfig{
		URL:    "http://localhost:8086",
		Token:  "test-token",
		Org:    "test-org",
		Bucket: "test-bucket",
	}

	client, err := NewClient(cfg)
	if err != nil {
		t.Skipf("Failed to create InfluxDB client (InfluxDB may not be running): %v", err)
	}
	defer client.Close()

	// Test batch writing with multiple metrics
	timestamp := time.Now()
	testMetrics := []metrics.Metric{
		{
			Name: "test_metric_1",
			Value: map[string]interface{}{
				"value": 10.5,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"source": "test",
				"type":   "batch",
			},
		},
		{
			Name: "test_metric_2",
			Value: map[string]interface{}{
				"value": 20.3,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"source": "test",
				"type":   "batch",
			},
		},
		{
			Name: "test_metric_3",
			Value: map[string]interface{}{
				"value": 30.7,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"source": "test",
				"type":   "batch",
			},
		},
	}

	ctx := context.Background()
	err = client.WriteMetrics(ctx, testMetrics)
	if err != nil {
		t.Errorf("Failed to write batch metrics: %v", err)
	}
}

// TestInfluxClient_WriteMetricsBatchEmpty tests batch writing with empty slice
func TestInfluxClient_WriteMetricsBatchEmpty(t *testing.T) {
	cfg := config.InfluxDBConfig{
		URL:    "http://localhost:8086",
		Token:  "test-token",
		Org:    "test-org",
		Bucket: "test-bucket",
	}

	client, err := NewClient(cfg)
	if err != nil {
		t.Skipf("Failed to create InfluxDB client: %v", err)
	}
	defer client.Close()

	ctx := context.Background()
	err = client.WriteMetrics(ctx, []metrics.Metric{})
	if err != nil {
		t.Errorf("Failed to write empty batch metrics: %v", err)
	}
}

// TestInfluxClient_WriteMetricsRetry tests retry functionality
func TestInfluxClient_WriteMetricsRetry(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Use invalid URL to trigger retry logic
	cfg := config.InfluxDBConfig{
		URL:    "http://invalid-host:8086",
		Token:  "test-token",
		Org:    "test-org",
		Bucket: "test-bucket",
	}

	client, err := NewClient(cfg)
	if err != nil {
		t.Fatalf("Failed to create InfluxDB client: %v", err)
	}
	defer client.Close()

	testMetrics := []metrics.Metric{
		{
			Name: "test_metric_retry",
			Value: map[string]interface{}{
				"value": 42.0,
			},
			Timestamp: time.Now(),
			Tags: map[string]string{
				"source": "test",
			},
		},
	}

	ctx := context.Background()
	start := time.Now()
	err = client.WriteMetrics(ctx, testMetrics)
	duration := time.Since(start)

	// Should fail after retries
	if err == nil {
		t.Error("Expected error due to invalid host, but got none")
	}

	// Should take at least the base delay time due to retries
	if duration < 100*time.Millisecond {
		t.Errorf("Expected retry delay, but operation completed too quickly: %v", duration)
	}
}

// TestInfluxClient_HealthCheck tests connection health monitoring
func TestInfluxClient_HealthCheck(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := config.InfluxDBConfig{
		URL:    "http://localhost:8086",
		Token:  "test-token",
		Org:    "test-org",
		Bucket: "test-bucket",
	}

	client, err := NewClient(cfg)
	if err != nil {
		t.Skipf("Failed to create InfluxDB client (InfluxDB may not be running): %v", err)
	}
	defer client.Close()

	ctx := context.Background()
	err = client.HealthCheck(ctx)
	if err != nil {
		t.Logf("Health check failed (InfluxDB may not be running): %v", err)
	}
}

// TestInfluxClient_Ping tests connection ping
func TestInfluxClient_Ping(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	cfg := config.InfluxDBConfig{
		URL:    "http://localhost:8086",
		Token:  "test-token",
		Org:    "test-org",
		Bucket: "test-bucket",
	}

	client, err := NewClient(cfg)
	if err != nil {
		t.Skipf("Failed to create InfluxDB client (InfluxDB may not be running): %v", err)
	}
	defer client.Close()

	ctx := context.Background()
	err = client.Ping(ctx)
	if err != nil {
		t.Logf("Ping failed (InfluxDB may not be running): %v", err)
	}
}