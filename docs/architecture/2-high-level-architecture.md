# **2\. High-Level Architecture**

## **Technical Summary**

The system will be built using a **monorepo** structure. The backend will follow a **microservices** architecture, with a **Go** service for data collection and a **Python** service for the main API. The **React** frontend will communicate with these services through an **API Gateway**. The entire application will be deployed using a combination of free-tier cloud services to achieve a **no-cost** initial setup.

## **Platform and Infrastructure Choice (No-Cost Plan)**

* **Hosting Provider:** **Oracle Cloud Free Tier** (for running Docker containers).  
* **Database (Time-Series):** **InfluxDB Cloud Free Tier**.  
* **Database (Relational):** **Supabase Free Tier** (provides a PostgreSQL database).  
* **Security & Delivery Network:** **Cloudflare** (for domain management, security, and CDN).

## **High Level Project Diagram**

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

## **Architectural and Design Patterns**

* **Microservices:** Separate services for the API (Python) and data collection (Go).  
* **API Gateway:** A single entry point (NGINX) for all frontend requests.  
* **Repository Pattern:** Abstracting database logic to keep service code clean.  
* **Extensibility:** The Go Collector will have a modular/plugin design to easily add support for new device types in the future.
