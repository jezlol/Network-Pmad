# **5\. API Specification**

| Endpoint | Method | Description |
| :---- | :---- | :---- |
| /api/login | POST | Authenticates a user. |
| /api/discover | POST | Triggers a network discovery scan. |
| /api/devices | GET | Retrieves all discovered devices. |
| /api/devices/{id}/metrics | GET | Fetches recent metrics for a specific device. |
| /api/alerts/rules | GET / POST | Get all or create a new alert rule. |
| /api/alerts/rules/{id} | PUT / DELETE | Update or delete an alert rule. |
