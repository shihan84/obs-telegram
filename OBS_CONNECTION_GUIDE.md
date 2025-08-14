# 🔧 OBS Connection Troubleshooting Guide

## 🚨 **Current Issue: OBS Connection Failed**

You're trying to add an OBS connection with these details:
- **Host**: 103.167.123.195
- **Port**: 4466 (❌ **WRONG PORT**)
- **Name**: india aaptak
- **Bot Token**: 7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI

## 🎯 **#1 Issue: Wrong Port**

**Problem**: You're using port **4466**, but OBS WebSocket uses **4455** by default.

**Solution**: Change the port from **4466** to **4455**.

## 🔧 **Step-by-Step Fix**

### **Step 1: Configure OBS WebSocket Server**

**On the OBS machine (103.167.123.195):**

1. **Open OBS Studio**
2. **Enable WebSocket Server**:
   - Go to **Tools** → **WebSocket Server Settings**
   - ✅ Check **"Enable WebSocket server"**
   - **Port**: Set to **4455** (default)
   - **Password**: Set a password (recommended)
   - **Bind to**: **0.0.0.0** (allow external connections)

3. **Verify Settings**:
   - Server should show **"Server running"**
   - Note the **Port** and **Password**

### **Step 2: Configure Firewall**

**On the OBS machine (103.167.123.195):**

#### **Windows Firewall:**
1. Open **Windows Defender Firewall**
2. Go to **Advanced Settings**
3. Click **Inbound Rules**
4. Click **New Rule**
5. Select **Port**
6. Choose **TCP** and **Specific local ports**: **4455**
7. Allow **Connection**
8. Give it a name: **OBS WebSocket**
9. **Finish**

#### **Linux (if applicable):**
```bash
# Check firewall status
sudo ufw status

# Allow port 4455
sudo ufw allow 4455/tcp

# Or using iptables
sudo iptables -A INPUT -p tcp --dport 4455 -j ACCEPT
```

### **Step 3: Test Connection**

**Test the connection using our simple test endpoint:**

```bash
curl -X POST https://obs-telegram.vercel.app/api/obs/test-simple \
  -H "Content-Type: application/json" \
  -d '{
    "host": "103.167.123.195",
    "port": 4455,
    "password": ""
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "TCP connection successful",
  "details": {
    "host": "103.167.123.195",
    "port": 4455,
    "hasPassword": false,
    "suggestion": "OBS WebSocket server appears to be running. Try adding the connection in the application."
  }
}
```

### **Step 4: Add Connection in Application**

**Use these CORRECT details:**
```
Name: india aaptak
Host: 103.167.123.195
Port: 4455  # ← USE 4455, NOT 4466
Password: [same password as in OBS]
```

## 🔍 **Troubleshooting Common Issues**

### **Issue 1: Connection Refused**
**Error**: `"Connection refused"`
**Solution**: OBS WebSocket server is not running
- Open OBS Studio
- Enable WebSocket server
- Set port to 4455

### **Issue 2: Connection Timeout**
**Error**: `"Connection timeout"`
**Solution**: Firewall is blocking the connection
- Configure firewall to allow port 4455
- Check network connectivity

### **Issue 3: Host Not Found**
**Error**: `"Host not found"`
**Solution**: IP address is incorrect or not reachable
- Verify the IP address: 103.167.123.195
- Check network connectivity

### **Issue 4: Authentication Failed**
**Error**: `"Authentication failed"`
**Solution**: Password mismatch
- Ensure password matches exactly
- Check for typos

## 🧪 **Manual Testing Commands**

### **Test TCP Connection (from your machine):**
```bash
# Test if port is open
telnet 103.167.123.195 4455

# Or using netcat
nc -zv 103.167.123.195 4455
```

### **Test WebSocket Connection (if you have WebSocket tools):**
```bash
# Using websocat (if installed)
websocat ws://103.167.123.195:4455
```

## 📋 **Configuration Checklist**

### **On OBS Machine:**
- [ ] **OBS Studio is running**
- [ ] **WebSocket server enabled** (Tools → WebSocket Server Settings)
- [ ] **Port set to 4455**
- [ ] **Password configured** (recommended)
- [ ] **Bind to 0.0.0.0** (allow external connections)
- [ ] **Firewall allows port 4455**

### **In Application:**
- [ ] **Host**: 103.167.123.195
- [ ] **Port**: 4455 (NOT 4466)
- [ ] **Password**: [same as in OBS]
- [ ] **Test connection** before saving

## 🎯 **Quick Fix Summary**

1. **Change OBS port from 4466 to 4455**
2. **Enable OBS WebSocket server**
3. **Configure firewall for port 4455**
4. **Test connection with simple test endpoint**
5. **Add connection with correct settings**

## 🚀 **Next Steps After Success**

Once the connection works, you'll be able to:
- ✅ **Control scenes** - Switch between scenes
- ✅ **Control sources** - Show/hide, mute/unmute
- ✅ **Control media** - Play/pause/restart media sources
- ✅ **Control streaming** - Start/stop streams
- ✅ **Control recording** - Start/stop recording
- ✅ **Use Telegram commands** - Full bot functionality

## 📞 **If Issues Persist**

1. **Check OBS WebSocket server status** - Ensure it's running
2. **Verify port 4455 is open** - Use telnet or netcat
3. **Check firewall settings** - Allow inbound connections
4. **Test from different network** - Rule out local network issues
5. **Check OBS logs** - Look for WebSocket server errors

---

**🎯 KEY FIX: Change port from 4466 to 4455 and enable OBS WebSocket server!**