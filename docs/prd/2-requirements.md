# **2\. Requirements**

## **Functional**

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

## **Non-Functional**

**V1 (MVP \- Initial Release)**

* **NFR1: Security (Encryption in Transit):** All communication between the user's browser, the server, and monitored devices must be encrypted using HTTPS/TLS.  
* **NFR2: Security (Encryption at Rest):** All sensitive data, especially device credentials for SSH, must be encrypted in the database.  
* **NFR3: Security (Access Control):** The application will have at least two user roles: 'Administrator' (full access) and 'Viewer' (read-only access).  
* **NFR4: Deployment:** The entire application must be containerized using Docker for simplified deployment.
