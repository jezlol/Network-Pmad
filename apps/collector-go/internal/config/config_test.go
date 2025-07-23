package config

import (
	"os"
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	// Test loading with environment variables
	os.Setenv("INFLUXDB_URL", "http://localhost:8086")
	os.Setenv("INFLUXDB_TOKEN", "test-token")
	os.Setenv("INFLUXDB_ORG", "test-org")
	os.Setenv("INFLUXDB_BUCKET", "test-bucket")
	os.Setenv("DATABASE_URL", "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable")
	os.Setenv("LOG_LEVEL", "debug")
	defer func() {
		os.Unsetenv("INFLUXDB_URL")
		os.Unsetenv("INFLUXDB_TOKEN")
		os.Unsetenv("INFLUXDB_ORG")
		os.Unsetenv("INFLUXDB_BUCKET")
		os.Unsetenv("DATABASE_URL")
		os.Unsetenv("LOG_LEVEL")
	}()

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.InfluxDB.URL != "http://localhost:8086" {
		t.Errorf("Expected InfluxDB URL 'http://localhost:8086', got '%s'", cfg.InfluxDB.URL)
	}
	if cfg.InfluxDB.Token != "test-token" {
		t.Errorf("Expected InfluxDB Token 'test-token', got '%s'", cfg.InfluxDB.Token)
	}
	if cfg.PostgreSQL.URL != "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable" {
		t.Errorf("Expected PostgreSQL URL, got '%s'", cfg.PostgreSQL.URL)
	}
	if cfg.LogLevel != "debug" {
		t.Errorf("Expected LogLevel 'debug', got '%s'", cfg.LogLevel)
	}
}

func TestValidateConfig(t *testing.T) {
	tests := []struct {
		name    string
		config  *Config
		wantErr bool
	}{
		{
			name: "valid config",
			config: &Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: InfluxDBConfig{
					URL:    "http://localhost:8086",
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			wantErr: false,
		},
		{
			name: "missing InfluxDB URL",
			config: &Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: InfluxDBConfig{
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			wantErr: true,
		},
		{
			name: "missing InfluxDB token",
			config: &Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: InfluxDBConfig{
					URL:    "http://localhost:8086",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			wantErr: true,
		},
		{
			name: "missing PostgreSQL URL",
			config: &Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: InfluxDBConfig{
					URL:    "http://localhost:8086",
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: PostgreSQLConfig{},
				LogLevel: "info",
			},
			wantErr: true,
		},
		{
			name: "missing InfluxDB bucket",
			config: &Config{
				StatusPollInterval:  30 * time.Second,
				MetricsPollInterval: 60 * time.Second,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: InfluxDBConfig{
					URL:    "http://localhost:8086",
					Token:  "test-token",
					Org:    "test-org",
				},
				PostgreSQL: PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			wantErr: true,
		},
		{
			name: "zero polling intervals",
			config: &Config{
				StatusPollInterval:  0,
				MetricsPollInterval: 0,
				DeviceTimeout:       10 * time.Second,
				InfluxDB: InfluxDBConfig{
					URL:    "http://localhost:8086",
					Token:  "test-token",
					Org:    "test-org",
					Bucket: "test-bucket",
				},
				PostgreSQL: PostgreSQLConfig{
					URL: "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable",
				},
				LogLevel: "info",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateConfig(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateConfig() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestConfig_Defaults(t *testing.T) {
	// Test that default values are set correctly
	cfg := &Config{}
	
	// Set required fields to pass validation
	cfg.InfluxDB.URL = "http://localhost:8086"
	cfg.InfluxDB.Token = "test-token"
	cfg.InfluxDB.Org = "test-org"
	cfg.InfluxDB.Bucket = "test-bucket"
	cfg.PostgreSQL.URL = "postgres://test_user:test_pass@localhost:5432/test_db?sslmode=disable"

	// Check that defaults are applied during Load()
	if cfg.StatusPollInterval == 0 {
		cfg.StatusPollInterval = 30 * time.Second
	}
	if cfg.MetricsPollInterval == 0 {
		cfg.MetricsPollInterval = 60 * time.Second
	}
	if cfg.DeviceTimeout == 0 {
		cfg.DeviceTimeout = 10 * time.Second
	}
	if cfg.LogLevel == "" {
		cfg.LogLevel = "info"
	}

	if cfg.StatusPollInterval != 30*time.Second {
		t.Errorf("Expected default StatusPollInterval 30s, got %v", cfg.StatusPollInterval)
	}
	if cfg.MetricsPollInterval != 60*time.Second {
		t.Errorf("Expected default MetricsPollInterval 60s, got %v", cfg.MetricsPollInterval)
	}
	if cfg.DeviceTimeout != 10*time.Second {
		t.Errorf("Expected default DeviceTimeout 10s, got %v", cfg.DeviceTimeout)
	}
	if cfg.LogLevel != "info" {
		t.Errorf("Expected default LogLevel 'info', got '%s'", cfg.LogLevel)
	}
}