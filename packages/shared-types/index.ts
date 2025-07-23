// API Response Types
export interface APIResponse<T = any> {
  data?: T;
  error?: APIError;
  success: boolean;
}

export interface APIError {
  message: string;
  type: string;
  status_code: number;
  details?: any;
}

// Health Check Types
export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

export interface APIInfo {
  message: string;
  version: string;
  docs: string;
  environment: string;
}

// Network Device Types
export interface NetworkDevice {
  id: string;
  name: string;
  ip_address: string;
  device_type: DeviceType;
  status: DeviceStatus;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

// Device Discovery Types
export interface Device {
  id: string;
  ip_address: string;
  hostname?: string;
  mac_address?: string;
  device_type?: string;
  status: string;
  last_response_time?: number;
  first_discovered: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  is_monitored: boolean;
}

export interface DeviceInfo {
  ip_address: string;
  hostname?: string;
  mac_address?: string;
  response_time?: number;
  discovered_at: string;
}

export interface DiscoveryRequest {
  network_range?: string;
  timeout?: number;
}

export interface DiscoveryResponse {
  scan_id: string;
  network_range: string;
  devices_found: number;
  devices: DeviceInfo[];
  scan_duration: number;
  started_at: string;
  completed_at: string;
}

export enum DeviceType {
  ROUTER = 'router',
  SWITCH = 'switch',
  FIREWALL = 'firewall',
  ACCESS_POINT = 'access_point',
  SERVER = 'server',
  WORKSTATION = 'workstation',
  OTHER = 'other'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

// Alert Types
export interface Alert {
  id: string;
  device_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  acknowledged: boolean;
  created_at: string;
  resolved_at?: string;
}

export enum AlertType {
  DEVICE_DOWN = 'device_down',
  HIGH_CPU = 'high_cpu',
  HIGH_MEMORY = 'high_memory',
  DISK_SPACE = 'disk_space',
  NETWORK_LATENCY = 'network_latency',
  CONNECTIVITY = 'connectivity',
  SECURITY = 'security'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Metric Types
export interface NetworkMetric {
  device_id: string;
  metric_type: MetricType;
  value: number;
  unit: string;
  timestamp: string;
}

export enum MetricType {
  CPU_USAGE = 'cpu_usage',
  MEMORY_USAGE = 'memory_usage',
  DISK_USAGE = 'disk_usage',
  NETWORK_THROUGHPUT = 'network_throughput',
  LATENCY = 'latency',
  PACKET_LOSS = 'packet_loss',
  BANDWIDTH_UTILIZATION = 'bandwidth_utilization'
}

// Dashboard Types
export interface DashboardMetrics {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  active_alerts: number;
  critical_alerts: number;
  last_updated: string;
}

// User Authentication Types (for future use)
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Form and UI Types
export interface PaginationParams {
  page: number;
  size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Configuration Types
export interface AppConfig {
  api_url: string;
  environment: string;
  version: string;
  features: {
    auth_enabled: boolean;
    alerts_enabled: boolean;
    metrics_enabled: boolean;
  };
}