package influx

import (
	"context"
	"testing"
	"time"

	"collector/internal/config"
	"collector/internal/metrics"
)

func TestClient_NewClient(t *testing.T) {
	tests := []struct {
		name    string
		config  config.InfluxDBConfig
		wantErr bool
	}{
		{
			name: "valid config",
			config: config.InfluxDBConfig{
				URL:    "http://localhost:8086",
				Token:  "test-token",
				Org:    "test-org",
				Bucket: "test-bucket",
			},
			wantErr: false,
		},
		{
			name: "empty URL",
			config: config.InfluxDBConfig{
				URL:    "",
				Token:  "test-token",
				Org:    "test-org",
				Bucket: "test-bucket",
			},
			wantErr: false, // NewClient doesn't validate, just creates client
		},
		{
			name: "empty token",
			config: config.InfluxDBConfig{
				URL:    "http://localhost:8086",
				Token:  "",
				Org:    "test-org",
				Bucket: "test-bucket",
			},
			wantErr: false, // NewClient doesn't validate, just creates client
		},
		{
			name: "empty org",
			config: config.InfluxDBConfig{
				URL:    "http://localhost:8086",
				Token:  "test-token",
				Org:    "",
				Bucket: "test-bucket",
			},
			wantErr: false, // NewClient doesn't validate, just creates client
		},
		{
			name: "empty bucket",
			config: config.InfluxDBConfig{
				URL:    "http://localhost:8086",
				Token:  "test-token",
				Org:    "test-org",
				Bucket: "",
			},
			wantErr: false, // NewClient doesn't validate, just creates client
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := NewClient(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewClient() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if client == nil {
					t.Error("NewClient() returned nil client")
				}
				if client != nil {
					client.Close()
				}
			}
		})
	}
}

func TestClient_WriteMetric(t *testing.T) {
	// Create a test client (will fail to connect but we can test validation)
	cfg := config.InfluxDBConfig{
		URL:    "http://localhost:8086",
		Token:  "test-token",
		Org:    "test-org",
		Bucket: "test-bucket",
	}
	client, err := NewClient(cfg)
	if err != nil {
		t.Fatalf("Failed to create test client: %v", err)
	}
	defer client.Close()

	tests := []struct {
		name    string
		metric  metrics.Metric
		wantErr bool
	}{
		{
			name: "valid metric",
			metric: metrics.Metric{
				Name: "cpu_usage",
				Value: map[string]interface{}{
					"cpu_percent": 75.5,
				},
				Timestamp: time.Now(),
				Tags: map[string]string{
					"device_type": "router",
					"location":    "datacenter1",
				},
			},
			wantErr: true, // Will fail without actual InfluxDB connection
		},
		{
			name: "empty metric name",
			metric: metrics.Metric{
				Name: "",
				Value: map[string]interface{}{
					"cpu_percent": 75.5,
				},
				Timestamp: time.Now(),
			},
			wantErr: true,
		},
		{
			name: "zero timestamp",
			metric: metrics.Metric{
				Name: "cpu_usage",
				Value: map[string]interface{}{
					"cpu_percent": 75.5,
				},
				Timestamp: time.Time{},
			},
			wantErr: true,
		},

	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := client.WriteMetric(context.Background(), tt.metric)
			if (err != nil) != tt.wantErr {
				t.Errorf("Client.WriteMetric() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestClient_ValidateMetric(t *testing.T) {
	tests := []struct {
		name   string
		metric metrics.Metric
		valid  bool
	}{
		{
			name: "valid metric",
			metric: metrics.Metric{
				Name: "cpu_usage",
				Value: map[string]interface{}{
					"cpu_percent": 75.5,
				},
				Timestamp: time.Now(),
			},
			valid: true,
		},

		{
			name: "empty metric name",
			metric: metrics.Metric{
				Name: "",
				Value: map[string]interface{}{
					"cpu_percent": 75.5,
				},
				Timestamp: time.Now(),
			},
			valid: false,
		},
		{
			name: "zero timestamp",
			metric: metrics.Metric{
				Name: "cpu_usage",
				Value: map[string]interface{}{
					"cpu_percent": 75.5,
				},
				Timestamp: time.Time{},
			},
			valid: false,
		},
		{
			name: "metric with tags and fields",
			metric: metrics.Metric{
				Name: "network_traffic",
				Value: map[string]interface{}{
					"bytes_in": 1024.0,
					"packets": 150,
					"errors":  0,
				},
				Timestamp: time.Now(),
				Tags: map[string]string{
					"interface": "eth0",
					"direction": "in",
				},
			},
			valid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a test client for validation
			cfg := config.InfluxDBConfig{
				URL:    "http://localhost:8086",
				Token:  "test-token",
				Org:    "test-org",
				Bucket: "test-bucket",
			}
			client, err := NewClient(cfg)
			if err != nil {
				t.Fatalf("Failed to create test client: %v", err)
			}
			defer client.Close()

			err = client.WriteMetric(context.Background(), tt.metric)
			hasError := err != nil
			if tt.valid && hasError {
				// For valid metrics, we expect connection errors, not validation errors
				if err.Error() == "metric name is required" ||
					err.Error() == "metric timestamp is required" {
					t.Errorf("Expected valid metric but got validation error: %v", err)
				}
			}
			if !tt.valid && !hasError {
				t.Error("Expected invalid metric but got no error")
			}
		})
	}
}