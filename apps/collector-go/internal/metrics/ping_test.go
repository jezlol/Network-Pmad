package metrics

import (
	"context"
	"testing"
)

func TestPingCollector_Collect(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		wantErr bool
	}{
		{
			name:    "valid localhost ping",
			ip:      "127.0.0.1",
			wantErr: false,
		},
		{
			name:    "invalid IP address",
			ip:      "invalid-ip",
			wantErr: true,
		},
		{
			name:    "unreachable IP",
			ip:      "192.0.2.1", // RFC5737 test address
			wantErr: true, // Will likely timeout
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c, err := NewPingCollector()
			if err != nil {
				t.Fatalf("Failed to create ping collector: %v", err)
			}

			metrics, err := c.Collect(context.Background(), tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("PingCollector.Collect() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if len(metrics) == 0 {
					t.Error("PingCollector.Collect() returned no metrics")
				}

				// Check for expected metric fields
				foundStatus := false
				foundRTT := false
				for _, metric := range metrics {
					if metric.Name == "ping_status" {
						foundStatus = true
					}
					if metric.Name == "ping_rtt_ms" {
						foundRTT = true
					}
				}

				if !foundStatus {
					t.Error("PingCollector.Collect() missing ping_status metric")
				}
				if !foundRTT {
					t.Error("PingCollector.Collect() missing ping_rtt_ms metric")
				}
			}
		})
	}
}

func TestPingCollector_ValidateConfig(t *testing.T) {
	tests := []struct {
		name  string
		ip    string
		valid bool
	}{
		{
			name:  "valid config",
			ip:    "127.0.0.1",
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
			c, err := NewPingCollector()
			if err != nil {
				t.Fatalf("Failed to create ping collector: %v", err)
			}

			_, err = c.Collect(context.Background(), tt.ip)
			if tt.valid && err != nil {
				t.Errorf("Expected valid config but got error: %v", err)
			}
			if !tt.valid && err == nil {
				t.Error("Expected invalid config but got no error")
			}
		})
	}
}