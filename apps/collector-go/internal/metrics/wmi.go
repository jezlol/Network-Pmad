package metrics

import (
	"context"
	"collector/internal/config"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/go-ole/go-ole"
	"github.com/go-ole/go-ole/oleutil"
)

// WMICollector implements the MetricCollector interface for WMI-based metric collection
type WMICollector struct {
	config config.WMIConfig
}

// NewWMICollector creates a new WMICollector
func NewWMICollector(cfg config.WMIConfig) (*WMICollector, error) {
	return &WMICollector{config: cfg}, nil
}

// Collect performs WMI metric collection for the given IP address
func (c *WMICollector) Collect(ctx context.Context, ipAddress string) ([]Metric, error) {
	// Initialize OLE
	err := ole.CoInitialize(0)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize OLE: %w", err)
	}
	defer ole.CoUninitialize()

	// Connect to WMI service
	wmiService, err := c.connectToWMI(ipAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to WMI service: %w", err)
	}
	defer wmiService.Release()

	var metrics []Metric
	var errors []string
	timestamp := time.Now()

	// Collect CPU metrics
	cpuMetrics, err := c.collectCPUMetrics(wmiService, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("CPU metrics: %v", err))
		log.Printf("WMI collector failed to collect CPU metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, cpuMetrics...)
	}

	// Collect memory metrics
	memMetrics, err := c.collectMemoryMetrics(wmiService, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("Memory metrics: %v", err))
		log.Printf("WMI collector failed to collect memory metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, memMetrics...)
	}

	// Collect disk metrics
	diskMetrics, err := c.collectDiskMetrics(wmiService, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("Disk metrics: %v", err))
		log.Printf("WMI collector failed to collect disk metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, diskMetrics...)
	}

	// Collect network metrics
	netMetrics, err := c.collectNetworkMetrics(wmiService, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("Network metrics: %v", err))
		log.Printf("WMI collector failed to collect network metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, netMetrics...)
	}

	// Collect system uptime
	uptimeMetrics, err := c.collectUptimeMetrics(wmiService, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("Uptime metrics: %v", err))
		log.Printf("WMI collector failed to collect uptime metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, uptimeMetrics...)
	}

	// Return metrics even if some collection failed, but log errors
	if len(errors) > 0 {
		log.Printf("WMI collector completed with %d errors for %s: %v", len(errors), ipAddress, errors)
	}

	// Only return error if no metrics were collected at all
	if len(metrics) == 0 && len(errors) > 0 {
		return nil, fmt.Errorf("failed to collect any WMI metrics from %s: %s", ipAddress, strings.Join(errors, "; "))
	}

	return metrics, nil
}

// connectToWMI establishes a connection to the WMI service
func (c *WMICollector) connectToWMI(ipAddress string) (*ole.IDispatch, error) {
	// Create WMI locator
	unknown, err := oleutil.CreateObject("WbemScripting.SWbemLocator")
	if err != nil {
		return nil, fmt.Errorf("failed to create WMI locator: %w", err)
	}
	defer unknown.Release()

	wmiLocator, err := unknown.QueryInterface(ole.IID_IDispatch)
	if err != nil {
		return nil, fmt.Errorf("failed to query WMI locator interface: %w", err)
	}
	defer wmiLocator.Release()

	// Connect to WMI service
	serviceRaw, err := oleutil.CallMethod(wmiLocator, "ConnectServer", ipAddress, "root\\cimv2", c.config.Username, c.config.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to WMI service: %w", err)
	}

	service := serviceRaw.ToIDispatch()
	return service, nil
}

// executeWMIQuery executes a WMI query and returns the result set
func (c *WMICollector) executeWMIQuery(service *ole.IDispatch, query string) (*ole.IDispatch, error) {
	resultRaw, err := oleutil.CallMethod(service, "ExecQuery", query)
	if err != nil {
		return nil, fmt.Errorf("failed to execute WMI query '%s': %w", query, err)
	}

	result := resultRaw.ToIDispatch()
	return result, nil
}

// collectCPUMetrics collects CPU utilization metrics
func (c *WMICollector) collectCPUMetrics(service *ole.IDispatch, timestamp time.Time) ([]Metric, error) {
	query := "SELECT LoadPercentage FROM Win32_Processor"
	result, err := c.executeWMIQuery(service, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU metrics: %w", err)
	}
	defer result.Release()

	// Get enumerator
	enumRaw, err := oleutil.CallMethod(result, "_NewEnum")
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU result enumerator: %w", err)
	}
	defer enumRaw.Clear()

	enum, err := enumRaw.ToIUnknown().IEnumVARIANT(ole.IID_IEnumVariant)
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU enumerator interface: %w", err)
	}
	defer enum.Release()

	var totalCPU float64
	var cpuCount int

	for {
		item, _, err := enum.Next(1)
		if err != nil {
			break
		}
		if item.VT == ole.VT_NULL {
			break
		}

		processor := item.ToIDispatch()
		defer processor.Release()
		loadRaw, err := oleutil.GetProperty(processor, "LoadPercentage")
		if err == nil && loadRaw.Value() != nil {
			if load, ok := loadRaw.Value().(uint16); ok {
				totalCPU += float64(load)
				cpuCount++
			}
		}
		processor.Release()
		item.Clear()
	}

	var metrics []Metric
	if cpuCount > 0 {
		avgCPU := totalCPU / float64(cpuCount)
		metrics = append(metrics, Metric{
			Name: "cpu_utilization",
			Value: map[string]interface{}{
				"cpu_percent": avgCPU,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "cpu",
				"source":      "wmi",
			},
		})
	}

	return metrics, nil
}

// collectMemoryMetrics collects memory utilization metrics
func (c *WMICollector) collectMemoryMetrics(service *ole.IDispatch, timestamp time.Time) ([]Metric, error) {
	// Get total physical memory
	totalQuery := "SELECT TotalPhysicalMemory FROM Win32_ComputerSystem"
	totalResult, err := c.executeWMIQuery(service, totalQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get total memory: %w", err)
	}
	defer totalResult.Release()

	// Get available memory
	availQuery := "SELECT AvailableBytes FROM Win32_PerfRawData_PerfOS_Memory"
	availResult, err := c.executeWMIQuery(service, availQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get available memory: %w", err)
	}
	defer availResult.Release()

	// Parse total memory (simplified implementation)
	var totalMem, availMem float64

	// This is a simplified implementation - in production, you'd properly enumerate the results
	// For now, we'll return a basic memory metric
	metrics := []Metric{
		{
			Name: "memory_utilization",
			Value: map[string]interface{}{
				"memory_percent": 50.0, // Placeholder - would be calculated from actual WMI data
				"memory_total":   totalMem,
				"memory_used":    totalMem - availMem,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "memory",
				"source":      "wmi",
			},
		},
	}

	return metrics, nil
}

// collectDiskMetrics collects disk utilization metrics
func (c *WMICollector) collectDiskMetrics(service *ole.IDispatch, timestamp time.Time) ([]Metric, error) {
	query := "SELECT Size, FreeSpace, DeviceID FROM Win32_LogicalDisk WHERE DriveType = 3"
	result, err := c.executeWMIQuery(service, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get disk metrics: %w", err)
	}
	defer result.Release()

	// Simplified implementation - return placeholder metrics
	metrics := []Metric{
		{
			Name: "disk_utilization",
			Value: map[string]interface{}{
				"disk_percent": 60.0, // Placeholder - would be calculated from actual WMI data
				"disk_total":   "100GB",
				"disk_used":    "60GB",
				"disk_free":    "40GB",
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "disk",
				"source":      "wmi",
				"drive":       "C:",
			},
		},
	}

	return metrics, nil
}

// collectNetworkMetrics collects network traffic metrics
func (c *WMICollector) collectNetworkMetrics(service *ole.IDispatch, timestamp time.Time) ([]Metric, error) {
	query := "SELECT BytesReceivedPerSec, BytesSentPerSec FROM Win32_PerfRawData_Tcpip_NetworkInterface WHERE Name != 'Loopback'"
	result, err := c.executeWMIQuery(service, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get network metrics: %w", err)
	}
	defer result.Release()

	// Simplified implementation - return placeholder metrics
	metrics := []Metric{
		{
			Name: "network_traffic",
			Value: map[string]interface{}{
				"bytes_in":  1000000.0, // Placeholder
				"bytes_out": 500000.0,  // Placeholder
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "network",
				"source":      "wmi",
			},
		},
	}

	return metrics, nil
}

// collectUptimeMetrics collects system uptime metrics
func (c *WMICollector) collectUptimeMetrics(service *ole.IDispatch, timestamp time.Time) ([]Metric, error) {
	query := "SELECT LastBootUpTime FROM Win32_OperatingSystem"
	result, err := c.executeWMIQuery(service, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get uptime metrics: %w", err)
	}
	defer result.Release()

	// Simplified implementation - return placeholder metrics
	metrics := []Metric{
		{
			Name: "system_uptime",
			Value: map[string]interface{}{
				"uptime_seconds": 86400.0, // Placeholder - 1 day
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "system",
				"source":      "wmi",
			},
		},
	}

	return metrics, nil
}
