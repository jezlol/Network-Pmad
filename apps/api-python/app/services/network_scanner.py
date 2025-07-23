import asyncio
import socket
import subprocess
import platform
import ipaddress
import uuid
import time
from typing import List, Optional, Dict
from datetime import datetime, timezone
import logging
import re

from ..exceptions import NetworkMonitoringException
from ..models.discovery import DeviceInfo, DiscoveryResponse

logger = logging.getLogger(__name__)

class NetworkScanner:
    """Network scanner for discovering active devices on the network."""
    
    def __init__(self, timeout: int = 5, network_range: Optional[str] = None):
        self.timeout = timeout
        self.network_range = network_range or self._get_default_network_range()
        self.scan_id = str(uuid.uuid4())
        
    def _get_default_network_range(self) -> str:
        """Get the default network range based on local IP."""
        try:
            # Get local IP address
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            
            # Convert to network range (assume /24)
            network = ipaddress.IPv4Network(f"{local_ip}/24", strict=False)
            return str(network)
        except Exception as e:
            logger.warning(f"Could not determine default network range: {e}")
            return "192.168.1.0/24"  # Fallback
    
    async def scan_network(self) -> DiscoveryResponse:
        """Perform network discovery scan."""
        start_time = time.time()
        started_at = datetime.now(timezone.utc)
        
        logger.info(f"Starting network scan for range: {self.network_range}")
        
        try:
            # Parse network range
            network = ipaddress.IPv4Network(self.network_range, strict=False)
            
            # Get list of IP addresses to scan
            ip_addresses = [str(ip) for ip in network.hosts()]
            
            # Limit scan to reasonable size (max 254 IPs)
            if len(ip_addresses) > 254:
                logger.warning(f"Network range too large ({len(ip_addresses)} IPs). Limiting to first 254.")
                ip_addresses = ip_addresses[:254]
            
            # Perform concurrent ping scan
            devices = await self._scan_ip_addresses(ip_addresses)
            
            # Calculate scan duration
            end_time = time.time()
            scan_duration = end_time - start_time
            completed_at = datetime.now(timezone.utc)
            
            logger.info(f"Network scan completed in {scan_duration:.2f}s. Found {len(devices)} devices.")
            
            return DiscoveryResponse(
                scan_id=self.scan_id,
                network_range=self.network_range,
                devices_found=len(devices),
                devices=devices,
                scan_duration=scan_duration,
                started_at=started_at,
                completed_at=completed_at
            )
            
        except Exception as e:
            logger.error(f"Network scan failed: {str(e)}")
            raise NetworkMonitoringException(f"Network scan failed: {str(e)}", 500)
    
    async def _scan_ip_addresses(self, ip_addresses: List[str]) -> List[DeviceInfo]:
        """Scan multiple IP addresses concurrently."""
        # Create semaphore to limit concurrent scans
        semaphore = asyncio.Semaphore(20)  # Max 20 concurrent scans
        
        # Create tasks for all IP addresses
        tasks = [self._scan_single_ip(ip, semaphore) for ip in ip_addresses]
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out None results and exceptions
        devices = []
        for result in results:
            if isinstance(result, DeviceInfo):
                devices.append(result)
            elif isinstance(result, Exception):
                logger.debug(f"Scan task failed: {result}")
        
        return devices
    
    async def _scan_single_ip(self, ip_address: str, semaphore: asyncio.Semaphore) -> Optional[DeviceInfo]:
        """Scan a single IP address for device presence."""
        async with semaphore:
            try:
                # Perform ping test
                ping_result = await self._ping_host(ip_address)
                
                if not ping_result['reachable']:
                    return None
                
                # Get hostname
                hostname = await self._resolve_hostname(ip_address)
                
                # Get MAC address
                mac_address = await self._get_mac_address(ip_address)
                
                return DeviceInfo(
                    ip_address=ip_address,
                    hostname=hostname,
                    mac_address=mac_address,
                    response_time=ping_result['response_time'],
                    discovered_at=datetime.now(timezone.utc)
                )
                
            except Exception as e:
                logger.debug(f"Failed to scan {ip_address}: {e}")
                return None
    
    async def _ping_host(self, ip_address: str) -> Dict:
        """Ping a host to check if it's reachable."""
        try:
            # Determine ping command based on OS
            if platform.system().lower() == "windows":
                cmd = ["ping", "-n", "1", "-w", str(self.timeout * 1000), ip_address]
            else:
                cmd = ["ping", "-c", "1", "-W", str(self.timeout), ip_address]
            
            # Execute ping command
            start_time = time.time()
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), 
                timeout=self.timeout + 2
            )
            
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            
            # Check if ping was successful
            if process.returncode == 0:
                return {
                    'reachable': True,
                    'response_time': round(response_time, 2)
                }
            else:
                return {'reachable': False, 'response_time': None}
                
        except asyncio.TimeoutError:
            logger.debug(f"Ping timeout for {ip_address}")
            return {'reachable': False, 'response_time': None}
        except Exception as e:
            logger.debug(f"Ping failed for {ip_address}: {e}")
            return {'reachable': False, 'response_time': None}
    
    async def _resolve_hostname(self, ip_address: str) -> Optional[str]:
        """Resolve hostname for an IP address."""
        try:
            # Use asyncio to avoid blocking
            loop = asyncio.get_event_loop()
            hostname, _, _ = await asyncio.wait_for(
                loop.run_in_executor(None, socket.gethostbyaddr, ip_address),
                timeout=2
            )
            return hostname
        except Exception:
            # Hostname resolution failed, return None
            return None
    
    async def _get_mac_address(self, ip_address: str) -> Optional[str]:
        """Get MAC address for an IP address using ARP table."""
        try:
            if platform.system().lower() == "windows":
                cmd = ["arp", "-a", ip_address]
            else:
                cmd = ["arp", "-n", ip_address]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=3
            )
            
            if process.returncode == 0:
                output = stdout.decode('utf-8')
                # Extract MAC address using regex - improved pattern
                mac_pattern = r'([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})'
                match = re.search(mac_pattern, output)
                if match:
                    # Normalize MAC address format to XX:XX:XX:XX:XX:XX
                    mac = match.group(0).upper()
                    # Replace hyphens with colons if present
                    mac = mac.replace('-', ':')
                    return mac
            
            return None
            
        except Exception as e:
            logger.debug(f"MAC address lookup failed for {ip_address}: {e}")
            return None