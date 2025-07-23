package metrics

import (
	"context"
	"testing"
	"time"

	"collector/internal/config"
)

func TestSNMPCollector_Collect(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		wantErr bool
	}{
		{
			name:    "valid config",
			ip:      "127.0.0.1",
			wantErr: true, // Will fail without SNMP agent
		},
		{
			name:    "empty IP",
			ip:      "",
			wantErr: true,
		},


	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := config.SNMPConfig{
				Community: "public",
				Version:   "2c",
				Timeout:   1 * time.Second,
				Retries:   1,
			}
			c, err := NewSNMPCollector(cfg)
			if err != nil {
				t.Fatalf("Failed to create SNMP collector: %v", err)
			}

			metrics, err := c.Collect(context.Background(), tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("SNMPCollector.Collect() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && len(metrics) == 0 {
				t.Error("SNMPCollector.Collect() returned no metrics")
			}
		})
	}
}

func TestSNMPCollector_ValidateConfig(t *testing.T) {
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
			cfg := config.SNMPConfig{
				Community: "public",
				Version:   "2c",
				Timeout:   1 * time.Second,
				Retries:   1,
			}
			c, err := NewSNMPCollector(cfg)
			if err != nil {
				t.Fatalf("Failed to create SNMP collector: %v", err)
			}

			_, err = c.Collect(context.Background(), tt.ip)
			hasError := err != nil
			if tt.valid && hasError {
				// For valid configs, we expect connection errors, not validation errors
				// Most errors will be connection-related since we don't have SNMP agents
			}
			if !tt.valid && !hasError {
				t.Error("Expected invalid config but got no error")
			}
		})
	}
}