package metrics

import (
	"context"
	"collector/internal/config"
	"fmt"
	"io/ioutil"
	"log"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

// SSHCollector implements the MetricCollector interface for SSH-based metric collection
type SSHCollector struct {
	config config.SSHConfig
}

// NewSSHCollector creates a new SSHCollector
func NewSSHCollector(cfg config.SSHConfig) (*SSHCollector, error) {
	return &SSHCollector{config: cfg}, nil
}

// Collect performs SSH metric collection for the given IP address
func (c *SSHCollector) Collect(ctx context.Context, ipAddress string) ([]Metric, error) {
	// Create SSH client configuration
	config := &ssh.ClientConfig{
		User:            c.config.Username,
		Timeout:         c.config.Timeout,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // Note: In production, use proper host key verification
	}

	// Set authentication method
	if c.config.KeyFile != "" {
		// Use key-based authentication
		key, err := ioutil.ReadFile(c.config.KeyFile)
		if err != nil {
			return nil, fmt.Errorf("failed to read SSH key file: %w", err)
		}

		signer, err := ssh.ParsePrivateKey(key)
		if err != nil {
			return nil, fmt.Errorf("failed to parse SSH key: %w", err)
		}

		config.Auth = []ssh.AuthMethod{ssh.PublicKeys(signer)}
	} else if c.config.Password != "" {
		// Use password authentication
		config.Auth = []ssh.AuthMethod{ssh.Password(c.config.Password)}
	} else {
		return nil, fmt.Errorf("no SSH authentication method configured")
	}

	// Connect to SSH server
	client, err := ssh.Dial("tcp", ipAddress+":22", config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to SSH server at %s: %w", ipAddress, err)
	}
	defer client.Close()

	var metrics []Metric
	var errors []string
	timestamp := time.Now()

	// Collect CPU metrics
	cpuMetrics, err := c.collectCPUMetrics(client, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("CPU metrics: %v", err))
		log.Printf("SSH collector failed to collect CPU metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, cpuMetrics...)
	}

	// Collect memory metrics
	memMetrics, err := c.collectMemoryMetrics(client, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("Memory metrics: %v", err))
		log.Printf("SSH collector failed to collect memory metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, memMetrics...)
	}

	// Collect disk metrics
	diskMetrics, err := c.collectDiskMetrics(client, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("Disk metrics: %v", err))
		log.Printf("SSH collector failed to collect disk metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, diskMetrics...)
	}

	// Collect network metrics
	netMetrics, err := c.collectNetworkMetrics(client, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("Network metrics: %v", err))
		log.Printf("SSH collector failed to collect network metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, netMetrics...)
	}

	// Collect system uptime
	uptimeMetrics, err := c.collectUptimeMetrics(client, timestamp)
	if err != nil {
		errors = append(errors, fmt.Sprintf("Uptime metrics: %v", err))
		log.Printf("SSH collector failed to collect uptime metrics from %s: %v", ipAddress, err)
	} else {
		metrics = append(metrics, uptimeMetrics...)
	}

	// Return metrics even if some collection failed, but log errors
	if len(errors) > 0 {
		log.Printf("SSH collector completed with %d errors for %s: %v", len(errors), ipAddress, errors)
	}

	// Only return error if no metrics were collected at all
	if len(metrics) == 0 && len(errors) > 0 {
		return nil, fmt.Errorf("failed to collect any SSH metrics from %s: %s", ipAddress, strings.Join(errors, "; "))
	}

	return metrics, nil
}

// executeCommand executes a command via SSH and returns the output
func (c *SSHCollector) executeCommand(client *ssh.Client, command string) (string, error) {
	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create SSH session: %w", err)
	}
	defer session.Close()

	output, err := session.Output(command)
	if err != nil {
		return "", fmt.Errorf("failed to execute command '%s': %w", command, err)
	}

	return strings.TrimSpace(string(output)), nil
}

// collectCPUMetrics collects CPU utilization metrics
func (c *SSHCollector) collectCPUMetrics(client *ssh.Client, timestamp time.Time) ([]Metric, error) {
	// Use top command to get CPU usage
	output, err := c.executeCommand(client, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1")
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU metrics: %w", err)
	}

	cpuUsage, err := strconv.ParseFloat(output, 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CPU usage: %w", err)
	}

	metrics := []Metric{
		{
			Name: "cpu_utilization",
			Value: map[string]interface{}{
				"cpu_percent": cpuUsage,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "cpu",
				"source":      "ssh",
			},
		},
	}

	return metrics, nil
}

// collectMemoryMetrics collects memory utilization metrics
func (c *SSHCollector) collectMemoryMetrics(client *ssh.Client, timestamp time.Time) ([]Metric, error) {
	// Use free command to get memory usage
	output, err := c.executeCommand(client, "free -m | grep '^Mem:' | awk '{print $2,$3,$4}'")
	if err != nil {
		return nil, fmt.Errorf("failed to get memory metrics: %w", err)
	}

	fields := strings.Fields(output)
	if len(fields) < 3 {
		return nil, fmt.Errorf("unexpected memory output format: %s", output)
	}

	totalMem, err := strconv.ParseFloat(fields[0], 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse total memory: %w", err)
	}

	usedMem, err := strconv.ParseFloat(fields[1], 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse used memory: %w", err)
	}

	memPercent := (usedMem / totalMem) * 100

	metrics := []Metric{
		{
			Name: "memory_utilization",
			Value: map[string]interface{}{
				"memory_percent": memPercent,
				"memory_total":   totalMem,
				"memory_used":    usedMem,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "memory",
				"source":      "ssh",
			},
		},
	}

	return metrics, nil
}

// collectDiskMetrics collects disk utilization metrics
func (c *SSHCollector) collectDiskMetrics(client *ssh.Client, timestamp time.Time) ([]Metric, error) {
	// Use df command to get disk usage for root filesystem
	output, err := c.executeCommand(client, "df -h / | tail -1 | awk '{print $2,$3,$4,$5}' | tr -d '%'")
	if err != nil {
		return nil, fmt.Errorf("failed to get disk metrics: %w", err)
	}

	fields := strings.Fields(output)
	if len(fields) < 4 {
		return nil, fmt.Errorf("unexpected disk output format: %s", output)
	}

	diskPercent, err := strconv.ParseFloat(fields[3], 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse disk usage percentage: %w", err)
	}

	metrics := []Metric{
		{
			Name: "disk_utilization",
			Value: map[string]interface{}{
				"disk_percent": diskPercent,
				"disk_total":   fields[0],
				"disk_used":    fields[1],
				"disk_free":    fields[2],
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "disk",
				"source":      "ssh",
				"filesystem":  "/",
			},
		},
	}

	return metrics, nil
}

// collectNetworkMetrics collects network traffic metrics
func (c *SSHCollector) collectNetworkMetrics(client *ssh.Client, timestamp time.Time) ([]Metric, error) {
	// Get network interface statistics
	output, err := c.executeCommand(client, "cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{print $2,$10}'")
	if err != nil {
		return nil, fmt.Errorf("failed to get network metrics: %w", err)
	}

	if output == "" {
		// No network interface found
		return nil, nil
	}

	fields := strings.Fields(output)
	if len(fields) < 2 {
		return nil, fmt.Errorf("unexpected network output format: %s", output)
	}

	bytesIn, err := strconv.ParseFloat(fields[0], 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bytes in: %w", err)
	}

	bytesOut, err := strconv.ParseFloat(fields[1], 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse bytes out: %w", err)
	}

	metrics := []Metric{
		{
			Name: "network_traffic",
			Value: map[string]interface{}{
				"bytes_in":  bytesIn,
				"bytes_out": bytesOut,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "network",
				"source":      "ssh",
			},
		},
	}

	return metrics, nil
}

// collectUptimeMetrics collects system uptime metrics
func (c *SSHCollector) collectUptimeMetrics(client *ssh.Client, timestamp time.Time) ([]Metric, error) {
	// Get system uptime in seconds
	output, err := c.executeCommand(client, "cat /proc/uptime | awk '{print $1}'")
	if err != nil {
		return nil, fmt.Errorf("failed to get uptime metrics: %w", err)
	}

	uptime, err := strconv.ParseFloat(output, 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse uptime: %w", err)
	}

	metrics := []Metric{
		{
			Name: "system_uptime",
			Value: map[string]interface{}{
				"uptime_seconds": uptime,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"metric_type": "system",
				"source":      "ssh",
			},
		},
	}

	return metrics, nil
}
