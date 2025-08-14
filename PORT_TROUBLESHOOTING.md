# OBS WebSocket Port Troubleshooting Guide

## Problem: Port appears opened but not showing as open

If you're experiencing issues where your port appears to be opened (e.g., in firewall settings) but the diagnostics show it as not accessible, follow this comprehensive troubleshooting guide.

## Step 1: Verify OBS WebSocket Server Configuration

### 1.1 Check OBS WebSocket Server Settings
1. Open OBS Studio
2. Go to **Tools** → **WebSocket Server Settings**
3. Ensure **"Enable WebSocket server"** is checked
4. Verify the **Server Port** (default: 4455, your configured: 4466)
5. Set a **Server Password** (recommended for security)
6. Click **Apply** and **OK**

### 1.2 Restart OBS WebSocket Server
1. Uncheck **"Enable WebSocket server"**
2. Click **Apply**
3. Check **"Enable WebSocket server"** again
4. Click **Apply** and **OK**

## Step 2: Verify Port Accessibility

### 2.1 Test Local Port Accessibility
Open Command Prompt/Terminal and run:

```bash
# Test if port is listening locally
netstat -an | grep 4466
# Or on Windows:
netstat -an | findstr "4466"
```

You should see output like:
```
TCP    0.0.0.0:4466           0.0.0.0:0              LISTENING
```

### 2.2 Test Port Connectivity
```bash
# Test TCP connection to the port
telnet 103.167.123.195 4466
```

If successful, you'll see a blank screen or connection established message.

### 2.3 Use Netcat for Advanced Testing
```bash
# Install netcat if not available
# Ubuntu/Debian: sudo apt install netcat
# CentOS/RHEL: sudo yum install nmap-ncat
# macOS: brew install netcat

# Test port with netcat
nc -z -v 103.167.123.195 4466
```

## Step 3: Firewall Configuration

### 3.1 Windows Firewall
1. Open **Windows Defender Firewall**
2. Click **"Allow an app or feature through Windows Defender Firewall"**
3. Click **"Change settings"** (requires admin rights)
4. Find **OBS Studio** in the list or **"Allow another app..."**
5. Ensure both **Private** and **Public** networks are checked
6. If OBS is not listed, add it manually:
   - Click **"Allow another app..."**
   - Browse to OBS Studio executable
   - Check both network types
   - Click **Add**

### 3.2 Create Custom Port Rule (Windows)
1. Open **Windows Defender Firewall with Advanced Security**
2. Click **"Inbound Rules"** on the left
3. Click **"New Rule..."** on the right
4. Select **"Port"** and click **Next**
5. Select **"TCP"** and **"Specific local ports:"**
6. Enter **4466** and click **Next**
7. Select **"Allow the connection"** and click **Next**
8. Choose when to apply (Domain, Private, Public) and click **Next**
9. Give it a name (e.g., "OBS WebSocket Port 4466") and click **Finish**

### 3.3 Linux Firewall (UFW)
```bash
# Check UFW status
sudo ufw status

# Allow port 4466
sudo ufw allow 4466/tcp

# If using specific IP, allow only from that IP
sudo ufw allow from 103.167.123.195 to any port 4466 proto tcp
```

### 3.4 Linux Firewall (Firewalld)
```bash
# Check firewalld status
sudo systemctl status firewalld

# Allow port 4466
sudo firewall-cmd --permanent --add-port=4466/tcp
sudo firewall-cmd --reload
```

## Step 4: Router/Network Configuration

### 4.1 Port Forwarding
If OBS is behind a router/NAT:
1. Access your router's admin panel (usually 192.168.1.1 or 192.168.0.1)
2. Find **Port Forwarding** or **Virtual Server** settings
3. Create a new rule:
   - External Port: 4466
   - Internal Port: 4466
   - Internal IP: [OBS machine's local IP]
   - Protocol: TCP
   - Enable the rule

### 4.2 Check for Double NAT
If you have multiple routers (modem + router), you may need to configure port forwarding on both devices.

## Step 5: Cloud/VPS Configuration

### 5.1 Security Group Rules (AWS/Azure/GCP)
If hosting on cloud services:
1. Access your cloud provider's console
2. Navigate to the instance's security group/firewall settings
3. Add an inbound rule:
   - Port Range: 4466
   - Source: 0.0.0.0/0 (or specific IP for security)
   - Protocol: TCP

### 5.2 Cloud Provider Specific Commands
```bash
# AWS CLI example
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 4466 --cidr 0.0.0.0/0

# Azure CLI example
az network nsg rule create --name obs-websocket --nsg-name mynsg --priority 100 --destination-port-ranges 4466 --direction Inbound --access Allow --protocol Tcp
```

## Step 6: Advanced Diagnostics

### 6.1 Check for Port Conflicts
```bash
# Check what's using the port
sudo lsof -i :4466
# Or on Windows:
netstat -ano | findstr "4466"
```

### 6.2 Test with Different Tools
```bash
# Using nmap for comprehensive port scan
sudo nmap -sT -p 4466 103.167.123.195

# Using curl for WebSocket test
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" http://103.167.123.195:4466
```

### 6.3 Check OBS Logs
1. In OBS Studio, go to **Help** → **Logs** → **Show Log Files**
2. Look for WebSocket-related entries in the latest log file
3. Check for errors like:
   - "WebSocket server failed to start"
   - "Port already in use"
   - "Permission denied"

## Step 7: Alternative Solutions

### 7.1 Use Default Port
Try using the default OBS WebSocket port (4455) instead of 4466:
1. Change OBS WebSocket server settings to use port 4455
2. Update your bot configuration to use port 4455
3. Test connectivity again

### 7.2 Use SSH Tunneling
If direct connection fails, use SSH tunneling:
```bash
# Create SSH tunnel
ssh -L 4466:localhost:4466 user@103.167.123.195

# Then connect to localhost:4466 instead of remote IP
```

### 7.3 Use Reverse Proxy
Set up a reverse proxy (nginx/Apache) to forward WebSocket connections:
```nginx
# nginx example configuration
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:4466;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Step 8: Final Verification

### 8.1 Use Web Interface Diagnostics
1. Access your bot's web interface
2. Go to the **Diagnostics** tab
3. Enter host: `103.167.123.195`
4. Enter port: `4466`
5. Click **Run Diagnostics**
6. Review the detailed results and recommendations

### 8.2 Test with OBS WebSocket Test Tools
1. Use online WebSocket test tools
2. Connect to `ws://103.167.123.195:4466`
3. Verify connection establishment

## Common Issues and Solutions

| Issue | Solution |
|------|----------|
| Port shows as filtered | Check firewall and security group settings |
| Port shows as closed | Verify OBS WebSocket server is running and listening |
| Connection timeout | Check network connectivity and port forwarding |
| Permission denied | Run OBS as administrator or check port permissions |
| Port already in use | Change port number or stop conflicting service |

## Getting Help

If you're still experiencing issues after following this guide:

1. Check the diagnostic results in the web interface for specific recommendations
2. Review OBS logs for WebSocket-related errors
3. Test with different ports and configurations
4. Consider using the default OBS WebSocket port (4455)
5. Contact your network administrator for firewall/port forwarding assistance

Remember: Port accessibility issues are often related to firewall settings, network configuration, or OBS WebSocket server setup. The diagnostic tools in the web interface should provide specific guidance based on your test results.