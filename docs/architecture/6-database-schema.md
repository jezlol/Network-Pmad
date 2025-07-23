# **6\. Database Schema**

## **InfluxDB Schema (for Metrics)**

* **Bucket:** network\_metrics  
* **Measurement:** device\_metrics (Tags: device\_id, metric\_name; Fields: value)  
* **Measurement:** device\_status (Tags: device\_id; Fields: status)

## **PostgreSQL Schema (for Users, Devices, Rules)**

CREATE TABLE devices (id UUID PRIMARY KEY, ip\_address VARCHAR, ...);  
CREATE TABLE users (id UUID PRIMARY KEY, username VARCHAR, ...);  
CREATE TABLE alert\_rules (id UUID PRIMARY KEY, name VARCHAR, ...);
