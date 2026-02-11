# 🛠️ Development Scripts

This folder contains PowerShell scripts to manage the Next.js frontend development server.

## 📋 Available Scripts

### 🚀 **start-frontend.ps1** (Recommended)

**Complete startup with all checks**

```powershell
.\start-frontend.ps1
```

**What it does:**

- ✅ Checks if port 3000 is available
- ✅ Automatically fixes issues if found
- ✅ Verifies node_modules exists
- ✅ Displays configuration info
- ✅ Starts Next.js dev server

---

### 🛑 **fix-frontend-startup.ps1**

**Fix port conflicts and lock files**

```powershell
.\fix-frontend-startup.ps1
```

**What it does:**

- ✅ Kills process on port 3000
- ✅ Removes Next.js lock files
- ✅ Cleans up .next directory
- ✅ Prepares for clean start

**Use when:**

- Port 3000 is busy
- "Another instance is already running" error
- Lock file errors

---

### ⚡ **quick-fix.ps1**

**Fast one-liner fix and start**

```powershell
.\quick-fix.ps1
```

**What it does:**

- Kills port 3000 process
- Removes lock files
- Immediately starts server

**Perfect for:** Quick restarts during development

---

### ✅ **check-status.ps1**

**Verify all services are running**

```powershell
.\check-status.ps1
```

**What it checks:**

- ✅ Backend (Spring Boot) on port 8890
- ✅ Frontend (Next.js) on port 3000
- ✅ Database (MySQL) on port 3306
- ✅ Active Node.js processes
- ✅ Port availability

**Shows:** System status with helpful links

---

### ⚠️ **kill-all-node.ps1** (Emergency Use Only)

**Force kill ALL Node.js processes**

```powershell
.\kill-all-node.ps1
```

**WARNING:** This kills ALL Node.js processes system-wide!

**Use only when:**

- Multiple stuck processes
- Nothing else works
- Complete reset needed

---

## 🎯 Common Scenarios

### Scenario 1: Normal Development Start

```powershell
# Just run this every time
.\start-frontend.ps1
```

### Scenario 2: Port is Busy

```powershell
# Option A: Let start script handle it
.\start-frontend.ps1

# Option B: Manual fix then start
.\fix-frontend-startup.ps1
npm run dev
```

### Scenario 3: Quick Restart

```powershell
# Stop with Ctrl+C, then:
.\quick-fix.ps1
```

### Scenario 4: Check Everything

```powershell
# See what's running
.\check-status.ps1
```

### Scenario 5: Total Chaos

```powershell
# Nuclear option - kills everything
.\kill-all-node.ps1

# Then start fresh
.\start-frontend.ps1
```

---

## 📊 Manual Commands (Alternative)

If you prefer manual control:

```powershell
# Check what's using port 3000
netstat -ano | Select-String ":3000"

# Kill specific process
taskkill /F /PID <PID_NUMBER>

# Remove lock file manually
Remove-Item .next\dev\lock -Force

# Start dev server
npm run dev
```

---

## 🔗 Quick Links

Once servers are running:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | <http://localhost:3000> | Main application |
| Dashboard | <http://localhost:3000/dashboard> | User dashboard |
| Test Services | <http://localhost:3000/test-services> | Service testing page |
| Weak Areas | <http://localhost:3000/analytics/weak-areas> | Analytics page |
| Backend API | <http://localhost:8890/api> | REST API |
| Health Check | <http://localhost:8890/actuator/health> | Backend status |

---

## 🐛 Troubleshooting

### Problem: "Port 3000 is already in use"

**Solution:**

```powershell
.\fix-frontend-startup.ps1
```

### Problem: "Another instance is already running"

**Solution:**

```powershell
.\fix-frontend-startup.ps1
```

### Problem: "Module not found" errors

**Solution:**

```powershell
# Reinstall dependencies
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
.\start-frontend.ps1
```

### Problem: Changes not reflecting

**Solution:**

```powershell
# Clear Next.js cache
Remove-Item .next -Recurse -Force
.\start-frontend.ps1
```

### Problem: Multiple Node processes stuck

**Solution:**

```powershell
.\kill-all-node.ps1
.\start-frontend.ps1
```

---

## 🛡️ Best Practices

1. **Always use `.\start-frontend.ps1` for normal development**
   - It handles all edge cases automatically

2. **Run `.\check-status.ps1` if something feels wrong**
   - Quick diagnosis of all services

3. **Use `.\quick-fix.ps1` for quick restarts**
   - Faster than manual steps

4. **Only use `.\kill-all-node.ps1` as last resort**
   - It affects all Node.js processes

5. **Check status before reporting issues**
   - `.\check-status.ps1` gives full picture

---

## 📝 Script Locations

```
web_app/
├── fix-frontend-startup.ps1    # Fix port & lock issues
├── start-frontend.ps1           # Complete startup (recommended)
├── quick-fix.ps1                # Fast fix & restart
├── check-status.ps1             # Status checker
├── kill-all-node.ps1            # Emergency kill all
└── SCRIPTS_README.md            # This file
```

---

## 🎓 Examples

### Example 1: First time today

```powershell
cd C:\Users\heyde\Desktop\end_project\readyroad_front_end\web_app
.\check-status.ps1       # See what's running
.\start-frontend.ps1     # Start if not running
```

### Example 2: Making changes

```powershell
# Make your code changes...
# Press Ctrl+C to stop
.\quick-fix.ps1          # Quick restart
```

### Example 3: Stuck process

```powershell
.\fix-frontend-startup.ps1    # Clean up
npm run dev                   # Start manually
```

### Example 4: Complete reset

```powershell
.\kill-all-node.ps1      # Kill everything (confirm with 'yes')
.\start-frontend.ps1     # Fresh start
```

---

## ✅ Success Indicators

When everything works, you should see:

```
✓ Starting...
▲ Next.js 16.1.4 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.1.12:3000

✓ Ready in 3.2s
○ Compiling / ...
✓ Compiled / in 2.5s
```

---

**Created:** February 8, 2026  
**Status:** ✅ Production Ready  
**Scripts:** 5 PowerShell automation scripts
