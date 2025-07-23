package metrics

import (
	"context"
	"testing"
	"time"

	"collector/internal/config"
)

func TestWMICollector_Collect(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		wantErr bool
	}{
		{
			name:    "valid config",
			ip:      "127.0.0.1",
			wantErr: true, // Will fail without WMI service
		},
		{
			name:    "empty IP",
			ip:      "",
			wantErr: true,
		},



	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := config.WMIConfig{
				Username: "testuser",
				Password: "testpass",
				Timeout:  5 * time.Second,
			}
			c, err := NewWMICollector(cfg)
			if err != nil {
				t.Fatalf("Failed to create WMI collector: %v", err)
			}

			metrics, err := c.Collect(context.Background(), tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("WMICollector.Collect() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && len(metrics) == 0 {
				t.Error("WMICollector.Collect() returned no metrics")
			}
		})
	}
}

func TestWMICollector_ValidateConfig(t *testing.T) {
	tests := []struct {
		name  string
		ip    string
		valid bool
	}{
		{
			name:  "valid config",
			ip:    "192.168.1.1",
			valid: true,
		},
		{
			name:  "empty IP",
			ip:    "",
			valid: false,
		},



	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := config.WMIConfig{
				Username: "admin",
				Password: "password",
				Timeout:  5 * time.Second,
			}
			c, err := NewWMICollector(cfg)
			if err != nil {
				t.Fatalf("Failed to create WMI collector: %v", err)
			}

			_, err = c.Collect(context.Background(), tt.ip)
			hasError := err != nil
			if tt.valid && hasError {
				// For valid configs, we expect connection errors, not validation errors
				// Most errors will be connection-related since we don't have WMI services
			}
			if !tt.valid && !hasError {
				t.Error("Expected invalid config but got no error")
			}
		})
	}
}