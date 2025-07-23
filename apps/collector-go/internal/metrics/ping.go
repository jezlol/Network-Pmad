package metrics

import (
	"context"
	"fmt"
	"net"
	"time"

	"golang.org/x/net/icmp"
	"golang.org/x/net/ipv4"
)

// PingCollector implements the MetricCollector interface for ping-based status checks
type PingCollector struct {
	timeout time.Duration
}

// NewPingCollector creates a new PingCollector
func NewPingCollector() (*PingCollector, error) {
	return &PingCollector{
		timeout: 5 * time.Second,
	}, nil
}

// Collect performs a ping check on the given IP address
func (c *PingCollector) Collect(ctx context.Context, ipAddress string) ([]Metric, error) {
	// Parse the IP address
	dst, err := net.ResolveIPAddr("ip4", ipAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve IP address %s: %w", ipAddress, err)
	}

	// Create ICMP connection
	conn, err := icmp.ListenPacket("ip4:icmp", "0.0.0.0")
	if err != nil {
		return nil, fmt.Errorf("failed to create ICMP connection: %w", err)
	}
	defer conn.Close()

	// Set deadline
	deadline := time.Now().Add(c.timeout)
	if err := conn.SetDeadline(deadline); err != nil {
		return nil, fmt.Errorf("failed to set deadline: %w", err)
	}

	// Create ICMP message
	message := &icmp.Message{
		Type: ipv4.ICMPTypeEcho,
		Code: 0,
		Body: &icmp.Echo{
			ID:   1,
			Seq:  1,
			Data: []byte("ping"),
		},
	}

	// Marshal the message
	data, err := message.Marshal(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal ICMP message: %w", err)
	}

	// Send the ping
	start := time.Now()
	_, err = conn.WriteTo(data, dst)
	if err != nil {
		return nil, fmt.Errorf("failed to send ping to %s: %w", ipAddress, err)
	}

	// Read the reply
	reply := make([]byte, 1500)
	n, _, err := conn.ReadFrom(reply)
	if err != nil {
		return nil, fmt.Errorf("failed to read ping reply from %s: %w", ipAddress, err)
	}
	rtt := time.Since(start)

	// Parse the reply
	rm, err := icmp.ParseMessage(1, reply[:n]) // 1 is the protocol number for ICMP for IPv4
	if err != nil {
		return nil, fmt.Errorf("failed to parse ICMP reply: %w", err)
	}

	// Check if it's an echo reply
	if rm.Type != ipv4.ICMPTypeEchoReply {
		return nil, fmt.Errorf("received non-echo reply from %s", ipAddress)
	}

	// Create separate metrics as expected by tests
	timestamp := time.Now()
	metrics := []Metric{
		{
			Name: "ping_status",
			Value: map[string]interface{}{
				"status": "online",
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"ip_address": ipAddress,
			},
		},
		{
			Name: "ping_rtt_ms",
			Value: map[string]interface{}{
				"rtt_ms": float64(rtt.Nanoseconds()) / 1e6,
			},
			Timestamp: timestamp,
			Tags: map[string]string{
				"ip_address": ipAddress,
			},
		},
	}

	return metrics, nil
}
