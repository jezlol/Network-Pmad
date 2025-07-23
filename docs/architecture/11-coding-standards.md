# **11\. Coding Standards**

* **Type Sharing:** Shared types will be kept in packages/shared-types.  
* **Configuration:** Environment variables must be loaded into a config module, not accessed directly.  
* **Error Handling:** A centralized error handler will be used in the API.  
* **No Secrets in Code:** All secrets must come from environment variables.