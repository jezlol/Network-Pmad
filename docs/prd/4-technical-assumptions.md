# **4\. Technical Assumptions**

## **Repository Structure: Monorepo**

* We will use a single repository (a "monorepo") to hold the code for the frontend (React), the backend services (Python/Go), and any shared configurations.

## **Service Architecture**

* The backend will be designed using a **Microservices** approach, allowing us to use the best language for each specific job (e.g., Go for high-performance collection, Python for the main API).

## **Testing Requirements**

* The project will require both **Unit tests** and **Integration tests**.

## **Additional Technical Assumptions and Requests**

* **Frontend Framework:** React  
* **Backend Languages:** Python, Go  
* **Database:** InfluxDB  
* **Deployment Environment:** Docker  
* **API Design:** The specific API technology (e.g., REST, GraphQL) will be determined by the Architect.
