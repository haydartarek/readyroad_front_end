# 🎯 Quick Reference: Registration Debugging

## 🚀 Start Backend
```bash
cd C:\Users\fqsdg\Desktop\end_project\readyroad
.\mvnw.cmd spring-boot:run
```

## 🧪 Test Registration

### Option 1: Use test script
```powershell
.\test_registration.ps1
```

### Option 2: Use curl
```bash
curl -X POST http://localhost:8890/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"SecurePass123!\",\"fullName\":\"Test User\"}"
```

### Option 3: Use PowerShell Invoke-RestMethod
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "SecurePass123!"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8890/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

---

## 📊 Expected Success Log Pattern

```
🌐 INCOMING REQUEST → Method: POST, URI: /api/auth/register
🔍 JWT Filter → No JWT token found - allowing anonymous access
📝 REGISTRATION REQUEST RECEIVED → Username: testuser
🔍 AuthService.register() - Starting registration process
✅ Username available
✅ Email available
✅ User saved successfully with ID: 1
✅ JWT token generated
✅ Registration successful!
```

---

## 🔍 Troubleshooting by Log Pattern

| What You See | Problem | Solution |
|-------------|---------|----------|
| No "INCOMING REQUEST" | Request not reaching backend | Check if backend running: `netstat -ano | findstr :8890` |
| "INCOMING REQUEST" but wrong URI | Frontend using wrong URL | Verify: http://localhost:8890/api/auth/register |
| "INCOMING REQUEST" but no controller log | Security blocking or wrong path | Check method is POST, path is /api/auth/register |
| "❌ Username already exists" | Duplicate user | Use different username or delete existing user |
| Error at "Saving user to database" | Database issue | Check MySQL running, check credentials |
| Error at "Generate JWT token" | JWT config issue | Check application-dev.yml JWT settings |

---

## 🌐 Browser DevTools Checklist

1. Press **F12** → **Network** tab
2. Clear requests (🚫 icon)
3. Try registration
4. Click the `register` request
5. Check:
   - ✅ **Request URL:** http://localhost:8890/api/auth/register
   - ✅ **Method:** POST
   - ✅ **Status:** 201 (success) or error code
   - ✅ **Headers:** Content-Type: application/json
   - ✅ **Payload:** Contains username, email, password, fullName
   - ✅ **Response:** Contains token or error message

---

## 🎯 Files for Backend

### RequestLoggingFilter.java
Location: `src/main/java/com/readyroad/config/RequestLoggingFilter.java`

```java
package com.readyroad.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class RequestLoggingFilter implements Filter {
    
    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        logger.info("🌐 INCOMING REQUEST → Method: {}, URI: {}", 
                    httpRequest.getMethod(), 
                    httpRequest.getRequestURI());
        
        chain.doFilter(request, response);
    }
}
```

---

## 📋 What to Share for Help

When asking for debugging assistance, provide:

1. **Backend console logs** (complete flow from "INCOMING REQUEST" to result)
2. **Browser Network tab screenshot** (Request + Response)
3. **Browser Console errors** (if any)
4. **Environment details:**
   - Backend running? (netstat -ano | findstr :8890)
   - Database running?
   - Any firewall/antivirus blocking?

**The logs will tell us EXACTLY where it fails!** 🎯

---

## 🔧 Common Issues & Quick Fixes

### Issue: "Failed to fetch" or "Network Error"
```powershell
# Check if backend is running
netstat -ano | findstr :8890

# If not running, start it
cd C:\Users\fqsdg\Desktop\end_project\readyroad
.\mvnw.cmd spring-boot:run
```

### Issue: "CORS Error"
Check backend has CORS configuration:
```java
@CrossOrigin(origins = "http://localhost:3000")
```

### Issue: "JWT Secret Error"
Update `application-dev.yml`:
```yaml
jwt:
  secret: YourBase64EncodedSecretKeyHere
  expiration: 86400000
```

### Issue: "Database Connection Error"
```powershell
# Check MySQL is running
Get-Service MySQL* | Select-Object Name, Status

# Start if stopped
Start-Service MySQL80
```

---

## 🎯 Test Data

Use these test credentials for registration:

```json
{
  "username": "testuser001",
  "email": "test001@example.com",
  "password": "SecurePass123!",
  "fullName": "Test User One"
}
```

```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "JohnDoe2024!",
  "fullName": "John Doe"
}
```

---

## 📞 Quick Commands

```powershell
# Start Backend
cd C:\Users\fqsdg\Desktop\end_project\readyroad
.\mvnw.cmd spring-boot:run

# Start Frontend
cd C:\Users\fqsdg\Desktop\end_project\readyroad_front_end\web_app
npm run dev

# Check Backend is running
Test-NetConnection -ComputerName localhost -Port 8890

# Check Frontend is running
Test-NetConnection -ComputerName localhost -Port 3000

# Test registration
.\test_registration.ps1
```

---

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026
