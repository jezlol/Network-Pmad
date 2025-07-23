package influx

import (
	"context"
	"collector/internal/config"
	"collector/internal/metrics"
	"fmt"
	"math"
	"time"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
)

// Client is a wrapper around the InfluxDB client
// that provides methods for writing metrics.
type Client struct {
	client influxdb2.Client
	config config.InfluxDBConfig
}

// NewClient creates a new InfluxDB client.
func NewClient(cfg config.InfluxDBConfig) (*Client, error) {
	client := influxdb2.NewClient(cfg.URL, cfg.Token)
	return &Client{
		client: client,
		config: cfg,
	}, nil
}

// Close closes the InfluxDB client connection.
func (c *Client) Close() {
	c.client.Close()
}

// HealthCheck verifies the InfluxDB connection is healthy
func (c *Client) HealthCheck(ctx context.Context) error {
	health, err := c.client.Health(ctx)
	if err != nil {
		return fmt.Errorf("InfluxDB health check failed: %w", err)
	}

	if health.Status != "pass" {
		return fmt.Errorf("InfluxDB health check failed: status=%s, message=%s", health.Status, *health.Message)
	}

	return nil
}

// Ping tests the InfluxDB connection
func (c *Client) Ping(ctx context.Context) error {
	_, err := c.client.Ping(ctx)
	if err != nil {
		return fmt.Errorf("InfluxDB ping failed: %w", err)
	}
	return nil
}

// WriteMetric writes a single metric to InfluxDB.
func (c *Client) WriteMetric(ctx context.Context, metric metrics.Metric) error {
	return c.writeWithRetry(ctx, func() error {
		writeAPI := c.client.WriteAPIBlocking(c.config.Org, c.config.Bucket)

		p := influxdb2.NewPoint(
			metric.Name,
			metric.Tags,
			metric.Value,
			metric.Timestamp,
		)

		return writeAPI.WritePoint(ctx, p)
	})
}

// WriteMetrics writes multiple metrics to InfluxDB in a batch operation.
func (c *Client) WriteMetrics(ctx context.Context, metrics []metrics.Metric) error {
	if len(metrics) == 0 {
		return nil
	}

	return c.writeWithRetry(ctx, func() error {
		writeAPI := c.client.WriteAPIBlocking(c.config.Org, c.config.Bucket)

		// Write each metric as a point
		for _, metric := range metrics {
			p := influxdb2.NewPoint(
				metric.Name,
				metric.Tags,
				metric.Value,
				metric.Timestamp,
			)
			err := writeAPI.WritePoint(ctx, p)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

// writeWithRetry implements exponential backoff retry logic for InfluxDB writes
func (c *Client) writeWithRetry(ctx context.Context, writeFunc func() error) error {
	const (
		maxRetries = 3
		baseDelay  = 100 * time.Millisecond
		maxDelay   = 5 * time.Second
	)

	var lastErr error
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			// Calculate exponential backoff delay
			delay := time.Duration(float64(baseDelay) * math.Pow(2, float64(attempt-1)))
			if delay > maxDelay {
				delay = maxDelay
			}

			// Wait with context cancellation support
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(delay):
			}
		}

		err := writeFunc()
		if err == nil {
			return nil
		}

		lastErr = err

		// Don't retry on context cancellation
		if ctx.Err() != nil {
			return err
		}
	}

	return fmt.Errorf("failed to write to InfluxDB after %d attempts: %w", maxRetries+1, lastErr)
}
