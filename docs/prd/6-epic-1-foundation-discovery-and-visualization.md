# **6\. Epic 1: Foundation, Discovery, and Visualization**

**Goal:** To set up the application and provide the core ability to automatically discover all devices on a network and display them in a rich dashboard with a visual map and detailed inventory.

## **Story 1.1: Basic Project Setup and UI Shell**

* **As a** System Administrator, **I want** the basic application structure and a running UI shell, **so that** I have a foundation to build all other features upon.  
* **Acceptance Criteria:**  
  1. The monorepo project structure is created in a Git repository.  
  2. The backend, frontend, and database can all be started with a single docker-compose up command.  
  3. The React application loads a blank page with a simple header.  
  4. A basic "health check" API endpoint exists on the backend.

## **Story 1.2: Network Discovery Service**

* **As a** System Administrator, **I want** a backend service that can scan the local network, **so that** I can identify all connected devices.  
* **Acceptance Criteria:**  
  1. The discovery service can be triggered via an API call.  
  2. The service performs a network scan to find active IP addresses.  
  3. For each discovered device, it identifies its hostname and MAC address.  
  4. The list of discovered devices is saved to the database.

## **Story 1.3: Asset Inventory Display**

* **As a** System Administrator, **I want** to see a list of all discovered devices in a simple table, **so that** I can have a basic inventory of my network assets.  
* **Acceptance Criteria:**  
  1. An "Inventory" page is created in the React application.  
  2. The page fetches and displays the list of discovered devices.  
  3. The table shows IP Address, Hostname, and MAC Address.  
  4. The table is searchable.

## **Story 1.4: Main Dashboard Visualization**

* **As a** System Administrator, **I want** a main dashboard that visualizes my network and shows key metrics at a glance, **so that** I can quickly assess the overall health of my network.  
* **Acceptance Criteria:**  
  1. A "Dashboard" page is created as the main entry point.  
  2. The page displays the visual network map.  
  3. The dashboard includes summary widgets showing: Total Devices Online/Offline, Number of Active Alerts, and a graph of overall network traffic for the last hour.  
  4. Clicking on a device icon on the map opens a detailed side panel showing all collected metrics for that device.

## **Story 1.5: User Authentication and Roles**

* **As a** System Administrator, **I want** to log in to the application and have different user roles, **so that** I can secure access to the monitoring tool.  
* **Acceptance Criteria:**  
  1. A login page is created.  
  2. The system supports 'Administrator' and 'Viewer' roles.  
  3. An Administrator has full access.  
  4. A Viewer has read-only access.  
  5. API endpoints enforce these permissions.
