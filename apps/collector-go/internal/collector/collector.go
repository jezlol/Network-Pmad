package collector

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	"collector/internal/config"
	"collector/internal/influx"
	"collector/internal/metrics"

	"github.com/sirupsen/logrus"
	_ "github.com/lib/pq"
)

// Device represents a network device to monitor
type Device struct {
	ID        string `db:"id"`
	IPAddress string `db:"ip_address"`
	Hostname  string `db:"hostname"`
	MACAddress string `db:"mac_address"`
	DeviceType string `db:"device_type"`
}

// DeviceStatus represents the current status of a device
type DeviceStatus struct {
	DeviceID  string
	Status    string // "online" or "offline"
	LastSeen  time.Time
	Error     string
}

// Collector manages the metric collection process
type Collector struct {
	config     *config.Config
	db         *sql.DB
	influxDB   *influx.Client
	collectors map[string]metrics.MetricCollector
	
	// Status tracking
	deviceStatuses map[string]*DeviceStatus
	statusMutex    sync.RWMutex
	
	// Shutdown coordination
	wg sync.WaitGroup
}

// New creates a new collector instance
func New(cfg *config.Config) (*Collector, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config is required")
	}

	// Connect to PostgreSQL for device discovery
	db, err := sql.Open("postgres", cfg.PostgreSQL.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	// Connect to InfluxDB
	influxClient, err := influx.NewClient(cfg.InfluxDB)
	if err != nil {
		return nil, fmt.Errorf("failed to create InfluxDB client: %w", err)
	}

	// Initialize metric collectors
	collectors := make(map[string]metrics.MetricCollector)
	
	// SNMP collector for network devices
	snmpCollector, err := metrics.NewSNMPCollector(cfg.SNMP)
	if err != nil {
		return nil, fmt.Errorf("failed to create SNMP collector: %w", err)
	}
	collectors["snmp"] = snmpCollector

	// SSH collector for Linux/Unix devices
	sshCollector, err := metrics.NewSSHCollector(cfg.SSH)
	if err != nil {
		return nil, fmt.Errorf("failed to create SSH collector: %w", err)
	}
	collectors["ssh"] = sshCollector

	// Ping collector for basic status
	pingCollector, err := metrics.NewPingCollector()
	if err != nil {
		return nil, fmt.Errorf("failed to create ping collector: %w", err)
	}
	collectors["ping"] = pingCollector

	// WMI collector for Windows devices
	wmiCollector, err := metrics.NewWMICollector(cfg.WMI)
	if err != nil {
		return nil, fmt.Errorf("failed to create WMI collector: %w", err)
	}
	collectors["wmi"] = wmiCollector

	return &Collector{
		config:         cfg,
		db:             db,
		influxDB:       influxClient,
		collectors:     collectors,
		deviceStatuses: make(map[string]*DeviceStatus),
	}, nil
}

// Start begins the collection process
func (c *Collector) Start(ctx context.Context) error {
	logrus.Info("Starting metric collection service")

	// Start status polling
	c.wg.Add(1)
	go c.statusPoller(ctx)

	// Start metrics polling
	c.wg.Add(1)
	go c.metricsPoller(ctx)

	// Wait for context cancellation
	<-ctx.Done()
	logrus.Info("Stopping metric collection service")

	// Wait for all goroutines to finish
	c.wg.Wait()

	// Close connections
	c.influxDB.Close()
	c.db.Close()

	return nil
}

// statusPoller polls device status at configured intervals
func (c *Collector) statusPoller(ctx context.Context) {
	defer c.wg.Done()

	ticker := time.NewTicker(c.config.StatusPollInterval)
	defer ticker.Stop()

	// Initial status check
	c.checkDeviceStatuses(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.checkDeviceStatuses(ctx)
		}
	}
}

// metricsPoller polls device metrics at configured intervals
func (c *Collector) metricsPoller(ctx context.Context) {
	defer c.wg.Done()

	ticker := time.NewTicker(c.config.MetricsPollInterval)
	defer ticker.Stop()

	// Initial metrics collection
	c.collectMetrics(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.collectMetrics(ctx)
		}
	}
}

// getDevices retrieves the list of devices from PostgreSQL
func (c *Collector) getDevices(ctx context.Context) ([]Device, error) {
	query := `
		SELECT id, ip_address, hostname, mac_address, 
		       COALESCE(device_type, 'unknown') as device_type
		FROM devices 
		ORDER BY ip_address
	`

	rows, err := c.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query devices: %w", err)
	}
	defer rows.Close()

	var devices []Device
	for rows.Next() {
		var device Device
		err := rows.Scan(&device.ID, &device.IPAddress, &device.Hostname, 
			&device.MACAddress, &device.DeviceType)
		if err != nil {
			logrus.WithError(err).Error("Failed to scan device row")
			continue
		}
		devices = append(devices, device)
	}

	return devices, nil
}

// checkDeviceStatuses checks if devices are online/offline
func (c *Collector) checkDeviceStatuses(ctx context.Context) {
	devices, err := c.getDevices(ctx)
	if err != nil {
		logrus.WithError(err).Error("Failed to get devices for status check")
		return
	}

	logrus.WithField("device_count", len(devices)).Debug("Checking device statuses")

	// Use ping collector to check basic connectivity
	pingCollector := c.collectors["ping"]

	for _, device := range devices {
		go func(dev Device) {
			c.checkSingleDeviceStatus(ctx, dev, pingCollector)
		}(device)
	}
}

// checkSingleDeviceStatus checks the status of a single device
func (c *Collector) checkSingleDeviceStatus(ctx context.Context, device Device, pingCollector metrics.MetricCollector) {
	logger := logrus.WithFields(logrus.Fields{
		"device_id": device.ID,
		"ip_address": device.IPAddress,
		"hostname": device.Hostname,
	})

	// Create timeout context
	timeoutCtx, cancel := context.WithTimeout(ctx, c.config.DeviceTimeout)
	defer cancel()

	// Check device status using ping
	_, err := pingCollector.Collect(timeoutCtx, device.IPAddress)
	
	status := "online"
	errorMsg := ""
	if err != nil {
		status = "offline"
		errorMsg = err.Error()
		logger.WithError(err).Debug("Device is offline")
	} else {
		logger.Debug("Device is online")
	}

	// Update device status
	c.updateDeviceStatus(device.ID, status, errorMsg)

	// Write status to InfluxDB
	statusMetric := metrics.Metric{
		DeviceID:  device.ID,
		Name:      "device_status",
		Value:     map[string]interface{}{"status": status},
		Timestamp: time.Now(),
		Tags: map[string]string{
			"device_id": device.ID,
			"hostname":  device.Hostname,
		},
	}

	if err := c.influxDB.WriteMetric(timeoutCtx, statusMetric); err != nil {
		logger.WithError(err).Error("Failed to write device status to InfluxDB")
	}
}

// updateDeviceStatus updates the internal device status tracking
func (c *Collector) updateDeviceStatus(deviceID, status, errorMsg string) {
	c.statusMutex.Lock()
	defer c.statusMutex.Unlock()

	c.deviceStatuses[deviceID] = &DeviceStatus{
		DeviceID: deviceID,
		Status:   status,
		LastSeen: time.Now(),
		Error:    errorMsg,
	}
}

// GetDeviceStatus returns the current status of a device
func (c *Collector) GetDeviceStatus(deviceID string) (*DeviceStatus, bool) {
	c.statusMutex.RLock()
	defer c.statusMutex.RUnlock()

	status, exists := c.deviceStatuses[deviceID]
	return status, exists
}

// collectMetrics collects detailed metrics from all devices
func (c *Collector) collectMetrics(ctx context.Context) {
	devices, err := c.getDevices(ctx)
	if err != nil {
		logrus.WithError(err).Error("Failed to get devices for metrics collection")
		return
	}

	logrus.WithField("device_count", len(devices)).Debug("Collecting device metrics")

	// Collect metrics from online devices only
	for _, device := range devices {
		// Check if device is online
		status, exists := c.GetDeviceStatus(device.ID)
		if !exists || status.Status != "online" {
			logrus.WithField("device_id", device.ID).Debug("Skipping offline device")
			continue
		}

		go func(dev Device) {
			c.collectSingleDeviceMetrics(ctx, dev)
		}(device)
	}
}

// collectSingleDeviceMetrics collects metrics from a single device
func (c *Collector) collectSingleDeviceMetrics(ctx context.Context, device Device) {
	logger := logrus.WithFields(logrus.Fields{
		"device_id": device.ID,
		"ip_address": device.IPAddress,
		"hostname": device.Hostname,
	})

	// Create timeout context
	timeoutCtx, cancel := context.WithTimeout(ctx, c.config.CollectionTimeout)
	defer cancel()

	// Determine which collector to use based on device type
	var collector metrics.MetricCollector
	switch device.DeviceType {
	case "router", "switch", "network":
		collector = c.collectors["snmp"]
	case "linux", "unix":
		collector = c.collectors["ssh"]
	case "windows":
		collector = c.collectors["wmi"]
	default:
		// Try SNMP first, then SSH as fallback
		collector = c.collectors["snmp"]
	}

	// Collect metrics
	deviceMetrics, err := collector.Collect(timeoutCtx, device.IPAddress)
	if err != nil {
		logger.WithError(err).Error("Failed to collect metrics from device")
		
		// Mark device as offline if collection fails
		c.updateDeviceStatus(device.ID, "offline", err.Error())
		return
	}

	// Write metrics to InfluxDB
	for _, metric := range deviceMetrics {
		// Add device information to metric
		metric.DeviceID = device.ID
		if metric.Tags == nil {
			metric.Tags = make(map[string]string)
		}
		metric.Tags["device_id"] = device.ID
		metric.Tags["hostname"] = device.Hostname

		if err := c.influxDB.WriteMetric(timeoutCtx, metric); err != nil {
			logger.WithError(err).Error("Failed to write metric to InfluxDB")
		}
	}
}