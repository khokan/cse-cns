# Deploy in windows server IIS

1. First install Application Request Routing (ARR) and URL Rewrite module in IIS server.
2. Then open IIS manager and select the server node in the left pane. Double-click on "Application Request Routing Cache" in the middle pane. In the right pane, click on "Server Proxy Settings" and check "Enable proxy". Click "Apply" to save the changes.
3. Now select the website node in the left pane and double-click on "URL Rewrite" in the middle pane. In the right pane, click on "Add Rules" and select "Reverse Proxy". Enter the backend server URL (e.g., http://localhost:3000) and click "OK". 
4. Now you need to install the backend service using NSSM (Non-Sucking Service Manager). Download NSSM from https://nssm.cc/download and extract it to a folder (e.g., C:\nssm-2.24\win64).
5. Open a command prompt and navigate to the NSSM directory:
cd C:\nssm-2.24\win64 and run the following commands to install the backend service:
```
# Remove the existing service
nssm remove cns-web-service confirm

# Install new service with start.bat
nssm install cns-web-service "D:\sakhawat\cns-web\backend\start.bat"

# Set working directory
nssm set cns-web-service AppDirectory "D:\sakhawat\cns-web\backend"

# Clear parameters
nssm set cns-web-service AppParameters ""

# Start the service
nssm start cns-web-service

# Check status
nssm status cns-web-service

```
6. add website binding in IIS for the domain name (e.g., cnsweb.com) and point it to the backend service. You can do this by right-clicking on the website node in the left pane, selecting "Edit Bindings", and adding a new binding with the desired hostname and port (e.g., 80 or 443 for HTTPS).
7. Finally, you need to configure the backend service to run as a Windows service. You can do this by opening the Services app in Windows, finding the "cns-web-service" service, right-clicking on it, and selecting "Properties". In the "General" tab, set the "Startup type" to "Automatic" and click "OK". This will ensure that the backend service starts automatically when the server is restarted.
--------------REDIS-----------
CONFIG GET bind
CONFIG GET protected-mode
--------------
CONFIG SET requirepass yourPassword
CONFIG REWRITE
REDIS_URL=redis://:yourPassword@192.168.105.44:6379
-----------------

version 1.0 [29/07/2026]
Report generated from built in memory of the system. No external data was used to generate this report.
version 2.0 [02/08/2026]
Report generated socket,redis,bullmq,cutom control
version 3.0 [03/08/2026]
TableCn table control added for custom dataTable re-organized
version 2.0 [05/08/2026][updated]
custom table updated, challan, taxToNBR CRUD implemented
