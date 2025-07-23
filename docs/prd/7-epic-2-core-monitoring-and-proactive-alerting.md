# **7\. Epic 2: Core Monitoring and Proactive Alerting**

**Goal:** To build upon the foundation by actively monitoring the discovered devices for a wide range of metrics and sending configurable, real-time alerts to users when problems are detected.

## **Story 2.1: Device Metric Collection Service**

* **As a** System Administrator, **I want** a backend service that periodically collects key health and performance metrics, **so that** I can track their performance and populate my dashboard.  
* **Acceptance Criteria:**  
  1. A backend service polls all devices at a configurable interval.  
  2. The service collects: Up/down status, CPU utilization (%), Memory utilization (%), Device temperature, Network traffic (bytes in/out), Disk space usage (%).  
  3. Metrics are stored in InfluxDB.  
  4. If a device fails to respond, its status is marked as 'offline'.

## **Story 2.2: Alert Rule Engine**

* **As a** System Administrator, **I want** to create custom rules that define what constitutes a problem, **so that** I am only alerted for issues that I care about.  
* **Acceptance Criteria:**  
  1. An Administrator can define an alert rule (e.g., 'temperature' \> '80').  
  2. A backend service continuously evaluates these rules against the latest metrics.  
  3. When a rule's condition is met, an "alert event" is created.

## **Story 2.3: Alert Notification Service**

* **As a** System Administrator, **I want** the system to send a notification to my preferred channel when an alert is triggered, **so that** I can be informed of issues immediately.  
* **Acceptance Criteria:**  
  1. A backend service listens for new "alert events".  
  2. The service formats a clear notification message.  
  3. The service dispatches the notification to the user's chosen channel (Email, Discord, etc.).

## **Story 2.4: Alert Configuration UI**

* **As a** System Administrator, **I want** a user interface to manage my alert rules, **so that** I can easily create, view, and modify them.  
* **Acceptance Criteria:**  
  1. An "Alerting" page is added to the React application.  
  2. Administrators can use a form to create new alert rules.  
  3. All existing alert rules are displayed in a list.  
  4. Administrators can edit or delete rules.  
  5. Viewers can see the rules but cannot make changes.

## **Story 2.5: New Device Alert Trigger**

* **As a** System Administrator, **I want** to be alerted immediately when a new, unknown device connects to my network, **so that** I can investigate potential security risks.  
* **Acceptance Criteria:**  
  1. The discovery service identifies any new device not already in the inventory.  
  2. An "alert event" is automatically triggered.  
  3. A notification is sent indicating an "Unrecognized device has joined the network."
