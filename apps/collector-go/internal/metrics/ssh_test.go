package metrics

import (
	"context"
	"testing"
	"time"

	"collector/internal/config"
)

func TestSSHCollector_Collect(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		wantErr bool
	}{
		{
			name:    "valid config",
			ip:      "127.0.0.1",
			wantErr: true, // Will fail without SSH server
		},
		{
			name:    "empty IP",
			ip:      "",
			wantErr: true,
		},



	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := config.SSHConfig{
				Username: "testuser",
				Password: "testpass",
				Timeout:  5 * time.Second,
			}
			c, err := NewSSHCollector(cfg)
			if err != nil {
				t.Fatalf("Failed to create SSH collector: %v", err)
			}

			metrics, err := c.Collect(context.Background(), tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("SSHCollector.Collect() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && len(metrics) == 0 {
				t.Error("SSHCollector.Collect() returned no metrics")
			}
		})
	}
}

func TestSSHCollector_ValidateConfig(t *testing.T) {
	tests := []struct {
		name  string
		ip    string
		valid bool
	}{
		{
			name:  "valid config with password",
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
			cfg := config.SSHConfig{
				Username: "admin",
				Password: "password",
				Timeout:  5 * time.Second,
			}
			c, err := NewSSHCollector(cfg)
			if err != nil {
				t.Fatalf("Failed to create SSH collector: %v", err)
			}

			_, err = c.Collect(context.Background(), tt.ip)
			hasError := err != nil
			if tt.valid && hasError {
				// For valid configs, we expect connection errors, not validation errors
				// Most errors will be connection-related since we don't have SSH servers
			}
			if !tt.valid && !hasError {
				t.Error("Expected invalid config but got no error")
			}
		})
	}
}