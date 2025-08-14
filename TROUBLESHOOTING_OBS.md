# OBS Connection Troubleshooting Guide

This guide helps resolve common OBS Studio connection issues with the Telegram Bot.

## 🔍 Common Connection Issues

### Issue: "failed to connect obs" Error

This error typically occurs when the bot cannot establish a WebSocket connection to OBS Studio. Let's troubleshoot step by step.

## 🛠️ Step-by-Step Troubleshooting

### 1. Verify OBS WebSocket Server is Running

**Check OBS Studio Settings:**
1. Open OBS Studio
2. Go to `Tools` → `WebSocket Server Settings`
3. Ensure **"Enable WebSocket server"** is checked
4. Verify **Server Port** (default: 4455, but you're using 4466)
5. Set a **Server Password** (recommended for security)
6. Click **Apply** → **OK**

**Alternative Check:**
- Look for a WebSocket icon in OBS status bar
- Check OBS logs for WebSocket server startup messages

### 2. Verify Network Connectivity

**Local Connection (Recommended):**
```bash
# Test if OBS is listening on the port
telnet localhost 4466
# OR
nc -zv localhost 4466
```

**Remote Connection (Your Case):**
```bash
# Test connection to remote OBS
telnet 103.167.123.195 4466
# OR
nc -zv 103.167.123.195 4466
```

### 3. Check Firewall Settings

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Go to "Allow an app or feature through Windows Firewall"
3. Ensure "OBS Studio" is allowed for both Private and Public networks
4. Or manually add port 4466:

```cmd
# Allow port 4466 (run as Administrator)
netsh advfirewall firewall add rule name="OBS WebSocket" dir=in action=allow protocol=TCP localport=4466
```

**Linux Firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 4466/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=4466/tcp
sudo firewall-cmd --reload
```

### 4. Verify OBS WebSocket Configuration

**Check obs-websocket version:**
- OBS Studio 28+ includes built-in WebSocket support
- For older versions, you need the obs-websocket plugin

**Configuration File Location:**
- Windows: `%APPDATA%\obs-studio\global.ini`
- macOS: `~/Library/Application Support/obs-studio/global.ini`
- Linux: `~/.config/obs-studio/global.ini`

Check for WebSocket settings in the config file:
```ini
[ObsWebSocket]
ServerEnabled=true
ServerPort=4466
ServerPassword=your_password
```

### 5. Network Configuration Issues

**Port Forwarding (if accessing remotely):**
1. Access your router's admin panel
2. Find port forwarding settings
3. Forward port 4466 to the OBS machine's local IP
4. Ensure the OBS machine has a static local IP

**Local vs Remote IP:**
- **Localhost**: `localhost` or `127.0.0.1` (bot and OBS on same machine)
- **LAN**: `192.168.x.x` or `10.x.x.x` (same network)
- **WAN**: `103.167.123.195` (internet, requires port forwarding)

### 6. Test WebSocket Connection Manually

**Using WebSocket Test Tools:**
1. Open browser WebSocket test tool (like [websocket.org/echo.html](https://websocket.org/echo.html))
2. Connect to: `ws://103.167.123.195:4466`
3. Check if connection establishes

**Using curl:**
```bash
# Test WebSocket handshake
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" http://103.167.123.195:4466
```

### 7. Check Bot Configuration

**Verify Connection Settings:**
1. Go to your web interface (`http://localhost:3000`)
2. Navigate to "OBS Connections" tab
3. Check your connection settings:
   - **Host**: `103.167.123.195`
   - **Port**: `4466`
   - **Password**: (if set in OBS)

**Test Connection in Web Interface:**
1. Click "Connect" next to your OBS connection
2. Check for error messages
3. Verify the connection status changes to "Connected"

## 🔧 Specific Solutions for Your Case

### Solution 1: Use Localhost (Recommended for Testing)

If your bot and OBS are on the same machine:

1. **Update OBS Settings:**
   - Host: `localhost`
   - Port: `4455` (default)
   - Password: `your_password`

2. **Update Bot Configuration:**
   - In web interface, create new connection
   - Host: `localhost`
   - Port: `4455`
   - Password: `your_password`

3. **Test Connection:**
   ```bash
   # Test local connection
   nc -zv localhost 4455
   ```

### Solution 2: Remote Connection Setup

If you need remote access to OBS:

1. **Configure OBS for Remote Access:**
   - Enable WebSocket server on port 4466
   - Set a strong password
   - Configure firewall to allow port 4466

2. **Set Up Port Forwarding:**
   - Forward port 4466 to OBS machine's local IP
   - Use static IP for OBS machine

3. **Configure Bot:**
   - Host: `103.167.123.195`
   - Port: `4466`
   - Password: `your_obs_password`

### Solution 3: Alternative Port

If port 4466 is blocked:

1. **Use Default Port 4455:**
   - Change OBS WebSocket port to 4455
   - Update bot configuration accordingly

2. **Use Common Alternative Ports:**
   - Try ports: 8080, 8888, 9000
   - Ensure firewall allows these ports

## 🐛 Debug Commands

### Check OBS WebSocket Status
```bash
# Check if OBS process is running
ps aux | grep obs

# Check listening ports
netstat -tuln | grep 4466
# OR
ss -tuln | grep 4466

# Test connection timeout
timeout 5 bash -c "</dev/tcp/103.167.123.195/4466" && echo "Connected" || echo "Failed"
```

### Check Network Connectivity
```bash
# Ping the host
ping 103.167.123.195

# Trace route to identify network issues
traceroute 103.167.123.195

# Check port accessibility
nmap -p 4466 103.167.123.195
```

## 📝 Configuration Examples

### OBS WebSocket Settings (Recommended)
```
✅ Enable WebSocket server
📡 Server Port: 4455 (default)
🔐 Server Password: MySecurePassword123
🌐 Bind to IP: 0.0.0.0 (all interfaces)
```

### Bot Connection Settings
```json
{
  "name": "Main OBS",
  "host": "localhost",
  "port": 4455,
  "password": "MySecurePassword123"
}
```

## 🚨 Common Error Messages and Solutions

### "Connection Refused"
- **Cause**: OBS not running or WebSocket not enabled
- **Solution**: Start OBS and enable WebSocket server

### "Connection Timeout"
- **Cause**: Network issues, firewall blocking, or wrong IP/port
- **Solution**: Check network, firewall settings, and verify IP/port

### "Authentication Failed"
- **Cause**: Wrong password or no password set
- **Solution**: Verify password matches in both OBS and bot config

### "ECONNREFUSED"
- **Cause**: Port not open or service not listening
- **Solution**: Check OBS WebSocket settings and firewall

## 🔄 Testing Checklist

Before contacting support, run through this checklist:

- [ ] OBS Studio is running
- [ ] WebSocket server is enabled in OBS
- [ ] Correct port is configured (4455 or 4466)
- [ ] Password is set and matches in bot config
- [ ] Firewall allows the WebSocket port
- [ ] Network connectivity exists between bot and OBS
- [ ] Port forwarding is configured (for remote access)
- [ ] Bot configuration matches OBS settings
- [ ] No VPN or proxy interference

## 📞 Getting Help

If issues persist:

1. **Check OBS Logs**: Help → Log Files → View Current Log
2. **Check Bot Logs**: Vercel dashboard → Functions → Logs
3. **Test with WebSocket Client**: Use online WebSocket test tools
4. **Community Support**: OBS forums, Discord, or GitHub issues

---

This troubleshooting guide should help resolve most OBS connection issues. Start with the local connection test first, then move to remote configuration if needed.