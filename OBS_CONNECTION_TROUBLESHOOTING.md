# OBS Connection Troubleshooting Guide

## 🔍 **Current Issue: OBS Connection Failed**

You're trying to add an OBS connection with these details:
- **Host**: 103.167.123.195
- **Port**: 4466
- **Name**: india aaptak
- **Bot Token**: 7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI

The connection is failing. Let's troubleshoot this step by step.

## 🚨 **Common OBS Connection Issues**

### **1. OBS WebSocket Server Not Running**
The most common issue is that the OBS WebSocket server is not enabled or running on the target machine.

### **2. Incorrect Port**
OBS typically uses port **4455** for WebSocket connections, not 4466.

### **3. Firewall Blocking**
The firewall on the OBS machine or network may be blocking the connection.

### **4. WebSocket Plugin Not Installed**
OBS requires the OBS WebSocket plugin to be installed and enabled.

## 🔧 **Step-by-Step Troubleshooting**

### **Step 1: Verify OBS WebSocket Server**

**On the OBS machine (103.167.123.195):**

1. **Check if OBS WebSocket plugin is installed:**
   - Open OBS
   - Go to **Tools** → **WebSocket Server Settings**
   - If you don't see this option, install the plugin:
     - Download from: https://github.com/obsproject/obs-websocket/releases
     - Install the plugin and restart OBS

2. **Enable WebSocket Server:**
   - Go to **Tools** → **WebSocket Server Settings**
   - Check **"Enable WebSocket server"**
   - **Server Port**: Should be **4455** (default)
   - **Server Password**: Set a password or leave empty (not recommended for production)

3. **Check Server Status:**
   - The server should show **"Server running"** status
   - Note the **Port** and **Password** for configuration

### **Step 2: Test Connection Locally**

**On the OBS machine, test if the WebSocket server is accessible:**

```bash
# Test if port is listening
netstat -an | grep 4455

# Or test with curl
curl -I http://localhost:4455
```

### **Step 3: Test Remote Connection**

**From your local machine or any external machine:**

```bash
# Test if the port is accessible from outside
telnet 103.167.123.195 4455

# Or test with curl
curl -I http://103.167.123.195:4455
```

### **Step 4: Check Firewall Settings**

**On the OBS machine (Windows):**

1. **Windows Firewall:**
   - Open Windows Defender Firewall
   - Go to **Advanced Settings**
   - Create **Inbound Rule** for port 4455
   - Allow **TCP** connections

**On the OBS machine (Linux):**

```bash
# Check firewall status
sudo ufw status

# Allow port 4455
sudo ufw allow 4455/tcp

# Or using iptables
sudo iptables -A INPUT -p tcp --dport 4455 -j ACCEPT
```

## 🎯 **Recommended Configuration**

Based on standard OBS setup, try these settings:

### **Correct OBS Connection Details:**
```
Name: india aaptak
Host: 103.167.123.195
Port: 4455  # NOT 4466
Password: [your OBS WebSocket password]
```

### **Steps to Configure:**

1. **Fix OBS WebSocket Server:**
   ```
   Port: 4455
   Password: Set a secure password
   Enable: ✅
   ```

2. **Update Application Configuration:**
   ```
   Host: 103.167.123.195
   Port: 4455
   Password: [same password as above]
   ```

## 🧪 **Test OBS Connection**

I'll create a test endpoint to verify the OBS connection:

```bash
# Test the connection
curl -X POST https://obs-telegram.vercel.app/api/obs/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "host": "103.167.123.195",
    "port": 4455,
    "password": "your-password"
  }'
```

## 🔍 **Debug Information**

### **What to Check in OBS:**

1. **WebSocket Server Settings:**
   - ✅ Enable WebSocket server
   - 📝 Port: 4455
   - 🔐 Password: [set a password]
   - 🌐 Bind to: 0.0.0.0 (allow external connections)

2. **Network Configuration:**
   - 🌍 External IP: 103.167.123.195
   - 🔌 Port: 4455 must be open
   - 🛡️ Firewall: Allow inbound connections on port 4455

### **Common Solutions:**

| Issue | Solution |
|-------|----------|
| **Port 4466 not working** | Change to port **4455** |
| **Connection refused** | Enable OBS WebSocket server |
| **Connection timeout** | Check firewall settings |
| **Authentication failed** | Verify password matches |

## 🚀 **Quick Fix Checklist**

### **On OBS Machine:**
- [ ] Install OBS WebSocket plugin if not installed
- [ ] Enable WebSocket server in OBS
- [ ] Set port to **4455**
- [ ] Set a password
- [ ] Allow external connections (bind to 0.0.0.0)
- [ ] Configure firewall to allow port 4455

### **In Application:**
- [ ] Use host: `103.167.123.195`
- [ ] Use port: `4455` (not 4466)
- [ ] Use the same password as in OBS
- [ ] Test connection

## 📞 **Next Steps**

1. **Fix OBS Configuration** - Use the steps above
2. **Test Connection** - Use the correct port (4455)
3. **Verify Firewall** - Ensure port 4455 is open
4. **Try Again** - Add the connection with corrected settings

## 🎯 **Expected Result**

Once properly configured, you should see:
- ✅ **Connection Successful** in the application
- ✅ **OBS Status**: Connected
- ✅ **Available Scenes and Sources** in the interface
- ✅ **Ready to use Telegram commands**

---

**🔧 Start by changing the OBS WebSocket port to 4455 and try connecting again!**