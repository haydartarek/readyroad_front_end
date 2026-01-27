# 🔒 Enable JWT Authentication in Backend

## 🎯 Problem
Backend is running in **Development Mode** (`SecurityConfigDev`), which allows all requests without authentication:
- All endpoints are `permitAll()` 
- `JwtAuthenticationFilter` is NOT active
- `AnonymousAuthenticationFilter` sets SecurityContext to anonymous
- This is why you see: `Set SecurityContextHolder to anonymous SecurityContext`

## ✅ Solution: Switch to Secure Mode

### Option 1: Use application-secure.yml Profile

1. **Create/Edit** `src/main/resources/application-secure.yml`:
```yaml
spring:
  profiles:
    active: secure
  security:
    mode: secure

jwt:
  secret-key: ${JWT_SECRET:bXlTdXBlclNlY3VyZVNlY3JldEtleUZvckpXVFRva2VuR2VuZXJhdGlvbjEyMzQ1Ng==}
  expiration: 86400000  # 24 hours
  issuer: readyroad-backend

# Other configurations...
```

2. **Run Backend with secure profile**:
```bash
cd C:\Users\heyde\Desktop\end_project\readyroad
mvn spring-boot:run -Dspring-boot.run.profiles=secure
```

### Option 2: Modify SecurityConfigDev (Quick Test)

Edit `SecurityConfigDev.java` to add JWT filter:

```java
@Configuration
@EnableWebSecurity
@Profile("!secure")
@ConditionalOnProperty(name = "spring.security.mode", havingValue = "dev", matchIfMissing = true)
@RequiredArgsConstructor  // Add this
public class SecurityConfigDev {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;  // Add this

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()  // Login/Register public
                        .anyRequest().authenticated()  // All other endpoints need auth
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);  // Add JWT filter

        return http.build();
    }
}
```

### Option 3: Use Existing SecurityConfigSecure

The backend already has `SecurityConfigSecure.java` which includes JWT authentication!

**Just activate it** by setting profile to `secure`:

```bash
# In application.yml, change:
spring:
  profiles:
    active: secure  # Change from 'dev' to 'secure'
```

Then restart backend:
```bash
cd C:\Users\heyde\Desktop\end_project\readyroad
mvn spring-boot:run
```

## 🧪 Test JWT Authentication

After enabling secure mode, test with PowerShell:

```powershell
# 1. Login
$login = @{username="heyder";password="yourpassword"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8890/api/auth/login" `
    -Method POST `
    -ContentType "application/json; charset=utf-8" `
    -Body $login

$token = $response.token
Write-Host "Token: $token"

# 2. Test /api/users/me with token
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:8890/api/users/me" `
    -Headers $headers
```

## 📋 Expected Backend Logs (After Fix)

You should see:
```
🔍 JWT Filter - GET /api/users/me
🔑 JWT token found (length: 180)
👤 Username extracted from JWT: heyder
✅ User details loaded from database
✅ Authentication set in SecurityContext for user: heyder
```

Instead of:
```
⚪ No JWT token found - allowing anonymous access
Set SecurityContextHolder to anonymous SecurityContext
```

## 🎯 Recommendation

**Use Option 3** (activate SecurityConfigSecure) - it's already configured and ready!

1. Edit `src/main/resources/application.yml`
2. Change `spring.profiles.active` to `secure`
3. Restart backend
4. Test with Frontend

The JWT authentication will work correctly! ✅
