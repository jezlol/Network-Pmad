package metrics

import (
	"context"
	"collector/internal/config"
	"fmt"
	"time"

	"github.com/gosnmp/gosnmp"
)

// SNMPCollector implements the MetricCollector interface for SNMP-based metric collection
type SNMPCollector struct {
	config config.SNMPConfig
}

// SNMP OIDs for common metrics
var (
	// System information
	sysDescrOID    = "1.3.6.1.2.1.1.1.0"   // System description
	sysUptimeOID   = "1.3.6.1.2.1.1.3.0"   // System uptime
	
	// CPU utilization (varies by vendor)
	cpuUtilOID     = "1.3.6.1.4.1.9.9.109.1.1.1.1.7.1" // Cisco CPU utilization
	
	// Memory utilization
	memTotalOID    = "1.3.6.1.2.1.25.2.2.0"  // Total memory
	memUsedOID     = "1.3.6.1.2.1.25.2.3.1.6.1" // Used memory
	
	// Interface statistics (for network traffic)
	ifInOctetsOID  = "1.3.6.1.2.1.2.2.1.10" // Interface input octets
	ifOutOctetsOID = "1.3.6.1.2.1.2.2.1.16" // Interface output octets
	ifOperStatusOID = "1.3.6.1.2.1.2.2.1.8"  // Interface operational status
	
	// Temperature sensors (varies by vendor)
	tempSensorOID  = "1.3.6.1.4.1.9.9.13.1.3.1.3" // Cisco temperature sensors
	
	// Disk/Storage utilization
	storageTypeOID = "1.3.6.1.2.1.25.2.3.1.2"  // Storage type
	storageSizeOID = "1.3.6.1.2.1.25.2.3.1.5"  // Storage size
	storageUsedOID = "1.3.6.1.2.1.25.2.3.1.6"  // Storage used
	storageDescrOID = "1.3.6.1.2.1.25.2.3.1.3" // Storage description
)

// NewSNMPCollector creates a new SNMPCollector
func NewSNMPCollector(cfg config.SNMPConfig) (*SNMPCollector, error) {
	return &SNMPCollector{config: cfg}, nil
}

// Collect performs SNMP metric collection for the given IP address
func (c *SNMPCollector) Collect(ctx context.Context, ipAddress string) ([]Metric, error) {
	// Validate input
	if ipAddress == "" {
		return nil, fmt.Errorf("IP address cannot be empty")
	}

	// Create SNMP client
	g := &gosnmp.GoSNMP{
		Target:    ipAddress,
		Port:      161,
		Community: c.config.Community,
		Timeout:   c.config.Timeout,
		Retries:   c.config.Retries,
	}

	// Set SNMP version
	switch c.config.Version {
	case "1":
		g.Version = gosnmp.Version1
	case "2c":
		g.Version = gosnmp.Version2c
	case "3":
		g.Version = gosnmp.Version3
	default:
		g.Version = gosnmp.Version2c
	}

	// Connect to SNMP agent
	err := g.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to SNMP agent: %w", err)
	}
	defer g.Conn.Close()

	// Test basic connectivity with a simple get
	_, err = g.Get([]string{"1.3.6.1.2.1.1.1.0"}) // sysDescr
	if err != nil {
		return nil, fmt.Errorf("SNMP agent not responding: %w", err)
	}

	var metrics []Metric
	timestamp := time.Now()

	// Collect system information
	sysMetrics, err := c.collectSystemMetrics(g, timestamp)
	if err == nil {
		metrics = append(metrics, sysMetrics...)
	}

	// Collect CPU metrics
	cpuMetrics, err := c.collectCPUMetrics(g, timestamp)
	if err == nil {
		metrics = append(metrics, cpuMetrics...)
	}

	// Collect memory metrics
	memMetrics, err := c.collectMemoryMetrics(g, timestamp)
	if err == nil {
		metrics = append(metrics, memMetrics...)
	}

	// Collect interface metrics
	ifMetrics, err := c.collectInterfaceMetrics(g, timestamp)
	if err == nil {
		metrics = append(metrics, ifMetrics...)
	}

	// Collect temperature metrics
	tempMetrics, err := c.collectTemperatureMetrics(g, timestamp)
	if err == nil {
		metrics = append(metrics, tempMetrics...)
	}

	// Collect disk/storage metrics
	diskMetrics, err := c.collectDiskMetrics(g, timestamp)
	if err == nil {
		metrics = append(metrics, diskMetrics...)
	}

	return metrics, nil
}

// collectTemperatureMetrics collects temperature sensor metrics
func (c *SNMPCollector) collectTemperatureMetrics(g *gosnmp.GoSNMP, timestamp time.Time) ([]Metric, error) {
	// Walk temperature sensor table
	result, err := g.BulkWalkAll(tempSensorOID)
	if err != nil {
		// Temperature sensors might not be available on all devices
		return nil, nil
	}

	var metrics []Metric
	for i, variable := range result {
		// Limit to first 5 temperature sensors
		if i >= 5 {
			break
		}

		if temp, ok := variable.Value.(int); ok {
			// Temperature is usually in Celsius
			temperature := float64(temp)
			metrics = append(metrics, Metric{
				Name: "temperature",
				Value: map[string]interface{}{
					"temperature_celsius": temperature,
				},
				Timestamp: timestamp,
				Tags: map[string]string{
					"metric_type": "temperature",
					"sensor_id":   fmt.Sprintf("%d", i+1),
				},
			})
		}
	}

	return metrics, nil
}

// collectDiskMetrics collects disk/storage utilization metrics
func (c *SNMPCollector) collectDiskMetrics(g *gosnmp.GoSNMP, timestamp time.Time) ([]Metric, error) {
	// Walk storage table to get all storage devices
	storageResult, err := g.BulkWalkAll(storageTypeOID)
	if err != nil {
		// Storage table might not be available on all devices
		return nil, nil
	}

	var metrics []Metric
	storageCount := 0

	for _, variable := range storageResult {
		// Limit to first 5 storage devices
		if storageCount >= 5 {
			break
		}

		// Extract storage index from OID
		storageIndex := variable.Name[len(storageTypeOID)+1:]

		// Check if this is a disk storage type (type 4 = fixed disk)
		if storageType, ok := variable.Value.(int); ok && storageType == 4 {
			// Collect metrics for this storage device
			storageMetrics, err := c.collectSingleStorageMetrics(g, storageIndex, timestamp)
			if err == nil {
				metrics = append(metrics, storageMetrics...)
				storageCount++
			}
		}
	}

	return metrics, nil
}

// collectSingleStorageMetrics collects metrics for a single storage device
func (c *SNMPCollector) collectSingleStorageMetrics(g *gosnmp.GoSNMP, storageIndex string, timestamp time.Time) ([]Metric, error) {
	sizeOID := storageSizeOID + "." + storageIndex
	usedOID := storageUsedOID + "." + storageIndex
	descrOID := storageDescrOID + "." + storageIndex

	oids := []string{sizeOID, usedOID, descrOID}
	result, err := g.Get(oids)
	if err != nil {
		return nil, fmt.Errorf("failed to get storage metrics for index %s: %w", storageIndex, err)
	}

	var totalSize, usedSize float64
	var description string

	for _, variable := range result.Variables {
		switch variable.Name {
		case sizeOID:
			if size, ok := variable.Value.(uint); ok {
				totalSize = float64(size)
			}
		case usedOID:
			if used, ok := variable.Value.(uint); ok {
				usedSize = float64(used)
			}
		case descrOID:
			if descr, ok := variable.Value.(string); ok {
				description = descr
			}
		}
	}

	var metrics []Metric
	if totalSize > 0 {
		diskPercent := (usedSize / totalSize) * 100
		metrics = append(metrics, Metric{
			Name: "disk_utilization",
			Value: map[string]interface{}{
				"disk_percent": diskPercent,
				"disk_total":   totalSize,
				"disk_used":    usedSize,
				"disk_free":    totalSize - usedSize,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type":    "disk",
				"storage_index":  storageIndex,
				"description":    description,
			},
		})
	}

	return metrics, nil
}

// collectSystemMetrics collects basic system information
func (c *SNMPCollector) collectSystemMetrics(g *gosnmp.GoSNMP, timestamp time.Time) ([]Metric, error) {
	oids := []string{sysDescrOID, sysUptimeOID}
	result, err := g.Get(oids)
	if err != nil {
		return nil, fmt.Errorf("failed to get system metrics: %w", err)
	}

	var metrics []Metric
	for _, variable := range result.Variables {
		switch variable.Name {
		case sysUptimeOID:
			if uptime, ok := variable.Value.(uint); ok {
				metrics = append(metrics, Metric{
					Name: "system_uptime",
					Value: map[string]interface{}{
						"uptime_seconds": float64(uptime) / 100, // Convert from centiseconds
					},
					Timestamp: timestamp,
					Tags: map[string]string{
						"metric_type": "system",
					},
				})
			}
		}
	}

	return metrics, nil
}

// collectCPUMetrics collects CPU utilization metrics
func (c *SNMPCollector) collectCPUMetrics(g *gosnmp.GoSNMP, timestamp time.Time) ([]Metric, error) {
	result, err := g.Get([]string{cpuUtilOID})
	if err != nil {
		// CPU OID might not be available on all devices
		return nil, nil
	}

	var metrics []Metric
	for _, variable := range result.Variables {
		if variable.Name == cpuUtilOID {
			if cpuUtil, ok := variable.Value.(uint); ok {
				metrics = append(metrics, Metric{
					Name: "cpu_utilization",
					Value: map[string]interface{}{
						"cpu_percent": float64(cpuUtil),
					},
					Timestamp: timestamp,
					Tags: map[string]string{
						"metric_type": "cpu",
					},
				})
			}
		}
	}

	return metrics, nil
}

// collectMemoryMetrics collects memory utilization metrics
func (c *SNMPCollector) collectMemoryMetrics(g *gosnmp.GoSNMP, timestamp time.Time) ([]Metric, error) {
	oids := []string{memTotalOID, memUsedOID}
	result, err := g.Get(oids)
	if err != nil {
		// Memory OIDs might not be available on all devices
		return nil, nil
	}

	var totalMem, usedMem float64
	for _, variable := range result.Variables {
		switch variable.Name {
		case memTotalOID:
			if total, ok := variable.Value.(uint); ok {
				totalMem = float64(total)
			}
		case memUsedOID:
			if used, ok := variable.Value.(uint); ok {
				usedMem = float64(used)
			}
		}
	}

	var metrics []Metric
	if totalMem > 0 {
		memPercent := (usedMem / totalMem) * 100
		metrics = append(metrics, Metric{
			Name: "memory_utilization",
			Value: map[string]interface{}{
				"memory_percent": memPercent,
				"memory_total":   totalMem,
				"memory_used":    usedMem,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "memory",
			},
		})
	}

	return metrics, nil
}

// collectInterfaceMetrics collects network interface metrics
func (c *SNMPCollector) collectInterfaceMetrics(g *gosnmp.GoSNMP, timestamp time.Time) ([]Metric, error) {
	// Walk interface table to get all interfaces
	result, err := g.BulkWalkAll(ifOperStatusOID)
	if err != nil {
		return nil, fmt.Errorf("failed to walk interface table: %w", err)
	}

	var metrics []Metric
	// Collect metrics for up to 5 interfaces to avoid overwhelming the system
	interfaceCount := 0
	for _, variable := range result {
		if interfaceCount >= 5 {
			break
		}

		// Extract interface index from OID
		ifIndex := variable.Name[len(ifOperStatusOID)+1:]
		
		// Check if interface is up
		if status, ok := variable.Value.(int); ok && status == 1 {
			// Collect traffic metrics for this interface
			ifMetrics, err := c.collectSingleInterfaceMetrics(g, ifIndex, timestamp)
			if err == nil {
				metrics = append(metrics, ifMetrics...)
				interfaceCount++
			}
		}
	}

	return metrics, nil
}

// collectSingleInterfaceMetrics collects metrics for a single interface
func (c *SNMPCollector) collectSingleInterfaceMetrics(g *gosnmp.GoSNMP, ifIndex string, timestamp time.Time) ([]Metric, error) {
	inOctetsOID := ifInOctetsOID + "." + ifIndex
	outOctetsOID := ifOutOctetsOID + "." + ifIndex

	oids := []string{inOctetsOID, outOctetsOID}
	result, err := g.Get(oids)
	if err != nil {
		return nil, fmt.Errorf("failed to get interface metrics for index %s: %w", ifIndex, err)
	}

	var inOctets, outOctets float64
	for _, variable := range result.Variables {
		switch variable.Name {
		case inOctetsOID:
			if octets, ok := variable.Value.(uint); ok {
				inOctets = float64(octets)
			}
		case outOctetsOID:
			if octets, ok := variable.Value.(uint); ok {
				outOctets = float64(octets)
			}
		}
	}

	metrics := []Metric{
		{
			Name: "network_traffic",
			Value: map[string]interface{}{
				"bytes_in":  inOctets,
				"bytes_out": outOctets,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type":    "network",
				"interface_index": ifIndex,
			},
		},
	}

	return metrics, nil
}
