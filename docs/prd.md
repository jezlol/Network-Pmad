# **Network Monitoring App Product Requirements Document (PRD)**

## **1\. Goals and Background Context**

### **Goals**

* Build a comprehensive network monitoring application capable of collecting data from diverse network devices (PCs, Routers, Switches).  
* Provide proactive, configurable alerting to notify users of network issues through multiple channels (Email, Discord, Line).  
* Empower users with automation capabilities, including running commands and basic device configuration via SSH.  
* Offer a clear, visual user interface that includes automated network mapping and asset inventory.  
* Ensure the application is secure, with encrypted communications and role-based access control.

### **Background Context**

Currently, managing a diverse network of devices requires multiple tools, and it's often difficult to get a single, unified view of network health. This project aims to solve that by creating a centralized monitoring application built on a modern tech stack (React, Python/Go, InfluxDB). The application will not only provide passive monitoring but will also enable proactive alerting and automated actions, allowing users to respond to issues like performance degradation or security events more effectively.

### **Change Log**

| Date | Version | Description | Author |
| :---- | :---- | :---- | :---- |
| 2025-07-17 | 1.0 | Initial draft of PRD from brainstorming session. | John (PM) |

## **2\. Requirements**

### **Functional**

**V1 (MVP \- Initial Release)**

* **FR1: Network Autodiscovery:** The application must be able to scan the network to automatically discover and identify devices (PCs, routers, switches).  
* **FR2: Basic Device Monitoring:** The application will monitor core metrics for discovered devices, including up/down status, CPU usage, and temperature.  
* **FR3: IT Asset Inventory:** The application will maintain a list of all discovered devices, showing key information for each.  
* **FR4: Automated Network Mapping:** The application will generate and display a visual topology map of the discovered network devices.  
* **FR5: Condition-Based Alerting:** Users can create alerts that trigger when a device's monitored metrics cross a defined threshold (e.g., temperature \> 80°C).  
* **FR6: New Device Alerts:** The system will automatically trigger an alert when a new, unrecognized device joins the network.  
* **FR7: Customizable Notification Channels:** For each alert, users can select where the notification should be sent (e.g., Email, Discord, Line).

**V2 (Future Enhancements)**

* **FR8: Advanced Monitoring:** Add monitoring for more detailed metrics like network traffic volume, protocol usage, and application-specific data.  
* **FR9: Traffic Path Visualization:** Enhance the network map to show real-time traffic flows between devices.  
* **FR10: Ticketing System:** Allow users to create and manage issue tickets directly within the application.  
* **FR11: SSH-Based Automation:** Provide pre-built scripts to perform actions on devices (e.g., reboot, create VLAN).  
* **FR12: AI-Powered Analytics:** Introduce features to predict potential device failures or identify anomalous network behavior.

### **Non-Functional**

**V1 (MVP \- Initial Release)**

* **NFR1: Security (Encryption in Transit):** All communication between the user's browser, the server, and monitored devices must be encrypted using HTTPS/TLS.  
* **NFR2: Security (Encryption at Rest):** All sensitive data, especially device credentials for SSH, must be encrypted in the database.  
* **NFR3: Security (Access Control):** The application will have at least two user roles: 'Administrator' (full access) and 'Viewer' (read-only access).  
* **NFR4: Deployment:** The entire application must be containerized using Docker for simplified deployment.

## **3\. User Interface Design Goals**

### **Overall UX Vision**

The user experience should be clear, immediate, and actionable. The primary goal is to provide a comprehensive overview of network health at a glance, allowing users to quickly identify and diagnose problems. The interface will prioritize data density and clarity over purely aesthetic concerns, but will maintain a clean, modern, and professional look.

### **Key Interaction Paradigms**

* **Dashboard-centric:** The main entry point will be a dashboard that summarizes the most critical information.  
* **Drill-down:** Users can click on any element (like a device on the network map) to navigate to a more detailed view.  
* **Direct Configuration:** Alerting and device settings will be configured directly through forms and intuitive controls.

### **Core Screens and Views**

* **Main Dashboard:** Features the automated network map, a summary of online/offline devices, and a feed of recent critical alerts.  
* **Asset Inventory:** A searchable and sortable table view of all discovered network devices.  
* **Device Detail Page:** A dedicated view showing historical metrics, current status, and configuration options for a single device.  
* **Alerts Configuration Page:** A page where users can create, edit, and manage all alert rules.  
* **Alerts History:** A log of all past alert notifications.

### **Accessibility**

* **Standard:** WCAG AA. The application must be usable by people with disabilities, including full keyboard navigation and screen reader support.

### **Branding**

* The application should have a modern, "tech-ops" feel. A dark-mode default is recommended to reduce eye strain during long monitoring sessions. Color should be used purposefully to convey status (e.g., green for 'OK', red for 'Error', yellow for 'Warning').

### **Target Device and Platforms**

* **Platforms:** Web Responsive. The primary experience is designed for desktop browsers, but the layout must adapt to be usable on tablets and mobile devices for on-the-go status checks.

## **4\. Technical Assumptions**

### **Repository Structure: Monorepo**

* We will use a single repository (a "monorepo") to hold the code for the frontend (React), the backend services (Python/Go), and any shared configurations.

### **Service Architecture**

* The backend will be designed using a **Microservices** approach, allowing us to use the best language for each specific job (e.g., Go for high-performance collection, Python for the main API).

### **Testing Requirements**

* The project will require both **Unit tests** and **Integration tests**.

### **Additional Technical Assumptions and Requests**

* **Frontend Framework:** React  
* **Backend Languages:** Python, Go  
* **Database:** InfluxDB  
* **Deployment Environment:** Docker  
* **API Design:** The specific API technology (e.g., REST, GraphQL) will be determined by the Architect.

## **5\. Epic List (V1 MVP)**

* **Epic 1: Foundation, Discovery, and Visualization.**  
  * **Goal:** To set up the application and provide the core ability to automatically discover all devices on a network and display them in a rich dashboard with a visual map and detailed inventory.  
* **Epic 2: Core Monitoring and Proactive Alerting.**  
  * **Goal:** To build upon the foundation by actively monitoring the discovered devices for a wide range of metrics and sending configurable, real-time alerts to users when problems are detected.

## **6\. Epic 1: Foundation, Discovery, and Visualization**

**Goal:** To set up the application and provide the core ability to automatically discover all devices on a network and display them in a rich dashboard with a visual map and detailed inventory.

### **Story 1.1: Basic Project Setup and UI Shell**

* **As a** System Administrator, **I want** the basic application structure and a running UI shell, **so that** I have a foundation to build all other features upon.  
* **Acceptance Criteria:**  
  1. The monorepo project structure is created in a Git repository.  
  2. The backend, frontend, and database can all be started with a single docker-compose up command.  
  3. The React application loads a blank page with a simple header.  
  4. A basic "health check" API endpoint exists on the backend.

### **Story 1.2: Network Discovery Service**

* **As a** System Administrator, **I want** a backend service that can scan the local network, **so that** I can identify all connected devices.  
* **Acceptance Criteria:**  
  1. The discovery service can be triggered via an API call.  
  2. The service performs a network scan to find active IP addresses.  
  3. For each discovered device, it identifies its hostname and MAC address.  
  4. The list of discovered devices is saved to the database.

### **Story 1.3: Asset Inventory Display**

* **As a** System Administrator, **I want** to see a list of all discovered devices in a simple table, **so that** I can have a basic inventory of my network assets.  
* **Acceptance Criteria:**  
  1. An "Inventory" page is created in the React application.  
  2. The page fetches and displays the list of discovered devices.  
  3. The table shows IP Address, Hostname, and MAC Address.  
  4. The table is searchable.

### **Story 1.4: Main Dashboard Visualization**

* **As a** System Administrator, **I want** a main dashboard that visualizes my network and shows key metrics at a glance, **so that** I can quickly assess the overall health of my network.  
* **Acceptance Criteria:**  
  1. A "Dashboard" page is created as the main entry point.  
  2. The page displays the visual network map.  
  3. The dashboard includes summary widgets showing: Total Devices Online/Offline, Number of Active Alerts, and a graph of overall network traffic for the last hour.  
  4. Clicking on a device icon on the map opens a detailed side panel showing all collected metrics for that device.

### **Story 1.5: User Authentication and Roles**

* **As a** System Administrator, **I want** to log in to the application and have different user roles, **so that** I can secure access to the monitoring tool.  
* **Acceptance Criteria:**  
  1. A login page is created.  
  2. The system supports 'Administrator' and 'Viewer' roles.  
  3. An Administrator has full access.  
  4. A Viewer has read-only access.  
  5. API endpoints enforce these permissions.

## **7\. Epic 2: Core Monitoring and Proactive Alerting**

**Goal:** To build upon the foundation by actively monitoring the discovered devices for a wide range of metrics and sending configurable, real-time alerts to users when problems are detected.

### **Story 2.1: Device Metric Collection Service**

* **As a** System Administrator, **I want** a backend service that periodically collects key health and performance metrics, **so that** I can track their performance and populate my dashboard.  
* **Acceptance Criteria:**  
  1. A backend service polls all devices at a configurable interval.  
  2. The service collects: Up/down status, CPU utilization (%), Memory utilization (%), Device temperature, Network traffic (bytes in/out), Disk space usage (%).  
  3. Metrics are stored in InfluxDB.  
  4. If a device fails to respond, its status is marked as 'offline'.

### **Story 2.2: Alert Rule Engine**

* **As a** System Administrator, **I want** to create custom rules that define what constitutes a problem, **so that** I am only alerted for issues that I care about.  
* **Acceptance Criteria:**  
  1. An Administrator can define an alert rule (e.g., 'temperature' \> '80').  
  2. A backend service continuously evaluates these rules against the latest metrics.  
  3. When a rule's condition is met, an "alert event" is created.

### **Story 2.3: Alert Notification Service**

* **As a** System Administrator, **I want** the system to send a notification to my preferred channel when an alert is triggered, **so that** I can be informed of issues immediately.  
* **Acceptance Criteria:**  
  1. A backend service listens for new "alert events".  
  2. The service formats a clear notification message.  
  3. The service dispatches the notification to the user's chosen channel (Email, Discord, etc.).

### **Story 2.4: Alert Configuration UI**

* **As a** System Administrator, **I want** a user interface to manage my alert rules, **so that** I can easily create, view, and modify them.  
* **Acceptance Criteria:**  
  1. An "Alerting" page is added to the React application.  
  2. Administrators can use a form to create new alert rules.  
  3. All existing alert rules are displayed in a list.  
  4. Administrators can edit or delete rules.  
  5. Viewers can see the rules but cannot make changes.

### **Story 2.5: New Device Alert Trigger**

* **As a** System Administrator, **I want** to be alerted immediately when a new, unknown device connects to my network, **so that** I can investigate potential security risks.  
* **Acceptance Criteria:**  
  1. The discovery service identifies any new device not already in the inventory.  
  2. An "alert event" is automatically triggered.  
  3. A notification is sent indicating an "Unrecognized device has joined the network."

## **8\. Next Steps**

* **UX Expert:** Create a detailed UI/UX Specification.  
* **Architect:** Create a comprehensive Fullstack Architecture Document.