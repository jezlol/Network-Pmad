# **Fullstack Architecture Document**

## **1\. Introduction**

This document outlines the complete fullstack architecture for the Network Monitoring App, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for development, ensuring consistency across the entire technology stack.

* **Starter Template:** N/A \- This is a greenfield project being designed from scratch.

## **2\. High-Level Architecture**

### **Technical Summary**

The system will be built using a **monorepo** structure. The backend will follow a **microservices** architecture, with a **Go** service for data collection and a **Python** service for the main API. The **React** frontend will communicate with these services through an **API Gateway**. The entire application will be deployed using a combination of free-tier cloud services to achieve a **no-cost** initial setup.

### **Platform and Infrastructure Choice (No-Cost Plan)**

* **Hosting Provider:** **Oracle Cloud Free Tier** (for running Docker containers).  
* **Database (Time-Series):** **InfluxDB Cloud Free Tier**.  
* **Database (Relational):** **Supabase Free Tier** (provides a PostgreSQL database).  
* **Security & Delivery Network:** **Cloudflare** (for domain management, security, and CDN).

### **High Level Project Diagram**

graph TD  
    subgraph User's Network  
        A\[Network Devices\]  
    end

    subgraph Internet  
        B\[User's Browser\] \--\> Z\[Cloudflare\];  
    end

    subgraph "Oracle Cloud (Free Tier)"  
        Z \--\> C{React Frontend};  
        C \--\> D\[API Gateway\];  
        D \--\> E\[Python API Service\];  
        G\[Go Collector Service\];  
    end

    subgraph "Cloud Databases (Free Tier)"  
         F\_Influx\[InfluxDB Database\]  
         F\_Postgres\[PostgreSQL Database\]  
    end

    E \<--\> F\_Postgres;  
    E \<--\> F\_Influx;  
    G \<--\> F\_Influx;  
    G \-- Polls for data \--\> A;

### **Architectural and Design Patterns**

* **Microservices:** Separate services for the API (Python) and data collection (Go).  
* **API Gateway:** A single entry point (NGINX) for all frontend requests.  
* **Repository Pattern:** Abstracting database logic to keep service code clean.  
* **Extensibility:** The Go Collector will have a modular/plugin design to easily add support for new device types in the future.

## **3\. Tech Stack**

| Category | Technology | Version | Purpose & Rationale |
| :---- | :---- | :---- | :---- |
| **Frontend** | React | 18.2.0 | Core UI library. |
|  | TypeScript | 5.0.4 | Adds type safety. |
|  | Tailwind CSS | 3.3.3 | Modern CSS framework. |
|  | Zustand | 4.4.1 | Simple state management. |
|  | Axios | 1.5.0 | For making API calls. |
| **Backend (API)** | Python | 3.11 | Main API language. |
|  | FastAPI | 0.103.1 | High-performance web framework. |
| **Backend (Collector)** | Go | 1.21 | High-performance data collection. |
| **Database** | InfluxDB Cloud | 2.0 | Time-series data storage. |
|  | PostgreSQL | 15 | Relational data (via Supabase). |
| **API Gateway** | NGINX | 1.25 | Routes incoming traffic. |
| **Testing** | Jest & Testing Library | 29.7.0 | Frontend testing. |
|  | Pytest | 7.4.2 | Python backend testing. |
| **Deployment** | Docker & Docker Compose | Latest | Containerization. |
| **CI/CD** | GitHub Actions | \- | Automated testing and deployment. |

## **4\. Data Models**

* **Device:** Represents a monitored device (id, ip\_address, mac\_address, hostname, etc.).  
* **Metric:** A single data point from a device (device\_id, metric\_name, value, timestamp).  
* **Alert Rule:** Defines conditions for an alert (id, name, metric\_name, condition, threshold).  
* **User:** Stores user account information (id, username, password\_hash, role).

## **5\. API Specification**

| Endpoint | Method | Description |
| :---- | :---- | :---- |
| /api/login | POST | Authenticates a user. |
| /api/discover | POST | Triggers a network discovery scan. |
| /api/devices | GET | Retrieves all discovered devices. |
| /api/devices/{id}/metrics | GET | Fetches recent metrics for a specific device. |
| /api/alerts/rules | GET / POST | Get all or create a new alert rule. |
| /api/alerts/rules/{id} | PUT / DELETE | Update or delete an alert rule. |

## **6\. Database Schema**

### **InfluxDB Schema (for Metrics)**

* **Bucket:** network\_metrics  
* **Measurement:** device\_metrics (Tags: device\_id, metric\_name; Fields: value)  
* **Measurement:** device\_status (Tags: device\_id; Fields: status)

### **PostgreSQL Schema (for Users, Devices, Rules)**

CREATE TABLE devices (id UUID PRIMARY KEY, ip\_address VARCHAR, ...);  
CREATE TABLE users (id UUID PRIMARY KEY, username VARCHAR, ...);  
CREATE TABLE alert\_rules (id UUID PRIMARY KEY, name VARCHAR, ...);

## **7\. Unified Project Structure**

network-monitoring-app/  
├── .github/workflows/ci.yaml  
├── apps/  
│   ├── frontend/  
│   ├── api-python/  
│   └── collector-go/  
├── packages/shared-types/  
├── docker-compose.yml  
└── README.md

## **8\. Development Workflow & Deployment**

* **Local Setup:** The project will be fully containerized with Docker and started with docker-compose up.  
* **Deployment:** Automated deployment to the Oracle Cloud server will be handled by a **GitHub Actions** CI/CD pipeline, triggered on every push to the main branch.

## **9\. Security and Performance**

* **Security:** Authentication will use **JSON Web Tokens (JWT)**. Passwords will be securely hashed with **bcrypt**. All API input will be validated.  
* **Performance:** The React frontend will use **code splitting** for fast loads. The **Go** collector ensures efficient data gathering. **InfluxDB** provides fast time-series data retrieval.

## **10\. Testing Strategy**

* A full **Testing Pyramid** approach will be used:  
  * **Unit Tests:** Pytest for the backend, Jest & React Testing Library for the frontend.  
  * **Integration Tests:** To verify communication between services.  
  * **End-to-End (E2E) Tests:** For critical user flows.

## **11\. Coding Standards**

* **Type Sharing:** Shared types will be kept in packages/shared-types.  
* **Configuration:** Environment variables must be loaded into a config module, not accessed directly.  
* **Error Handling:** A centralized error handler will be used in the API.  
* **No Secrets in Code:** All secrets must come from environment variables.