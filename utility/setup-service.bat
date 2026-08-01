@echo off
echo Setting up CNS Web Service with start.bat...
cd C:\nssm-2.24\win64

echo Stopping service if running...
nssm stop cns-web-service 2>nul

echo Configuring service...
nssm set cns-web-service Application "D:\sakhawat\cns-web\backend\start.bat"
nssm set cns-web-service AppDirectory "D:\sakhawat\cns-web\backend"
nssm set cns-web-service AppParameters ""
nssm set cns-web-service DisplayName "CNS Web Service"
nssm set cns-web-service Description "CNS Express.js Backend API Service"

echo Starting service...
nssm start cns-web-service

echo Checking status...
nssm status cns-web-service

echo Done!
pause