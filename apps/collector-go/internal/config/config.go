package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config holds all configuration for the collector service
type Config struct {
	// Polling configuration
	StatusPollInterval  time.Duration `mapstructure:"status_poll_interval"`
	MetricsPollInterval time.Duration `mapstructure:"metrics_poll_interval"`

	// Timeout configuration
	DeviceTimeout     time.Duration `mapstructure:"device_timeout"`
	CollectionTimeout time.Duration `mapstructure:"collection_timeout"`

	// InfluxDB configuration
	InfluxDB InfluxDBConfig `mapstructure:"influxdb"`

	// PostgreSQL configuration for device discovery
	PostgreSQL PostgreSQLConfig `mapstructure:"postgresql"`

	// Logging configuration
	LogLevel string `mapstructure:"log_level"`

	// Device communication configuration
	SNMP SNMPConfig `mapstructure:"snmp"`
	SSH  SSHConfig  `mapstructure:"ssh"`
	WMI  WMIConfig  `mapstructure:"wmi"`
}

// InfluxDBConfig holds InfluxDB connection settings
type InfluxDBConfig struct {
	URL    string `mapstructure:"url"`
	Token  string `mapstructure:"token"`
	Bucket string `mapstructure:"bucket"`
	Org    string `mapstructure:"org"`
}

// PostgreSQLConfig holds PostgreSQL connection settings
type PostgreSQLConfig struct {
	URL string `mapstructure:"url"`
}

// SNMPConfig holds SNMP client configuration
type SNMPConfig struct {
	Community string        `mapstructure:"community"`
	Version   string        `mapstructure:"version"`
	Timeout   time.Duration `mapstructure:"timeout"`
	Retries   int           `mapstructure:"retries"`
}

// SSHConfig holds SSH client configuration
type SSHConfig struct {
	Username string        `mapstructure:"username"`
	Password string        `mapstructure:"password"`
	KeyFile  string        `mapstructure:"key_file"`
	Timeout  time.Duration `mapstructure:"timeout"`
}

// WMIConfig holds WMI client configuration
type WMIConfig struct {
	Username string        `mapstructure:"username"`
	Password string        `mapstructure:"password"`
	Timeout  time.Duration `mapstructure:"timeout"`
}

// Load reads configuration from file and environment variables
func Load() (*Config, error) {
	// Set default values
	viper.SetDefault("status_poll_interval", "30s")
	viper.SetDefault("metrics_poll_interval", "5m")
	viper.SetDefault("device_timeout", "10s")
	viper.SetDefault("collection_timeout", "30s")
	viper.SetDefault("log_level", "info")

	// SNMP defaults
	viper.SetDefault("snmp.community", "public")
	viper.SetDefault("snmp.version", "2c")
	viper.SetDefault("snmp.timeout", "5s")
	viper.SetDefault("snmp.retries", 3)

	// SSH defaults
	viper.SetDefault("ssh.timeout", "10s")

	// WMI defaults
	viper.SetDefault("wmi.timeout", "10s")

	// Read from config file if it exists
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("/etc/collector/")

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
		// Config file not found is OK, we'll use defaults and env vars
	}

	// Override with environment variables
	viper.AutomaticEnv()

	// Bind specific environment variables
	viper.BindEnv("influxdb.url", "INFLUXDB_URL")
	viper.BindEnv("influxdb.token", "INFLUXDB_TOKEN")
	viper.BindEnv("influxdb.bucket", "INFLUXDB_BUCKET")
	viper.BindEnv("influxdb.org", "INFLUXDB_ORG")
	viper.BindEnv("postgresql.url", "DATABASE_URL")

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	// Validate required configuration
	if err := validateConfig(&config); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	return &config, nil
}

// validateConfig ensures all required configuration is present
func validateConfig(config *Config) error {
	if config.InfluxDB.URL == "" {
		return fmt.Errorf("InfluxDB URL is required")
	}
	if config.InfluxDB.Token == "" {
		return fmt.Errorf("InfluxDB token is required")
	}
	if config.InfluxDB.Bucket == "" {
		return fmt.Errorf("InfluxDB bucket is required")
	}
	if config.PostgreSQL.URL == "" {
		return fmt.Errorf("PostgreSQL URL is required")
	}
	if config.StatusPollInterval <= 0 {
		return fmt.Errorf("status poll interval must be greater than zero")
	}
	if config.MetricsPollInterval <= 0 {
		return fmt.Errorf("metrics poll interval must be greater than zero")
	}

	return nil
}
