package metrics

import (
	"context"
	"time"
)

// Metric represents a single data point from a device
type Metric struct {
	DeviceID  string
	Name      string
	Value     map[string]interface{}
	Timestamp time.Time
	Tags      map[string]string
}

// MetricCollector is the interface for collecting metrics from a device
type MetricCollector interface {
	Collect(ctx context.Context, ipAddress string) ([]Metric, error)
}
