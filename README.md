# Network Monitoring App

A comprehensive network monitoring application capable of collecting data from diverse network devices and providing proactive alerting through multiple channels.

## Architecture

This is a monorepo containing:
- **Frontend**: React 18.2.0 with TypeScript
- **API Service**: Python 3.11 with FastAPI
- **Collector Service**: Go 1.21 for data collection
- **Shared Types**: Common TypeScript interfaces

## Project Structure

```
network-monitoring-app/
├── .github/workflows/ci.yaml
├── apps/
│   ├── frontend/           # React TypeScript frontend
│   ├── api-python/         # Python FastAPI backend
│   └── collector-go/       # Go data collection service
├── packages/shared-types/  # Shared TypeScript types
├── docker-compose.yml      # Development environment
└── README.md
```

## Development

### Setup

1. Copy environment template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your configuration values

3. Start the entire development environment:
   ```bash
   docker-compose up
   ```

## Services

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Python API**: http://localhost:8000
- **Go Collector**: Background service

## Tech Stack

- **Frontend**: React 18.2.0, TypeScript 5.0.4, Tailwind CSS 3.3.3
- **Backend API**: Python 3.11, FastAPI 0.103.1
- **Backend Collector**: Go 1.21
- **Databases**: InfluxDB Cloud (time-series), PostgreSQL (Supabase)
- **API Gateway**: NGINX 1.25
- **Deployment**: Docker & Docker Compose 