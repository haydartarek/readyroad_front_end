# 🔧 Fix Backend JWT Authentication Issue

## 📋 Problem
JWT token is valid and username is extracted (`test`), but Spring Security sets **anonymous SecurityContext** instead of authenticated user.

**Root Cause:** After extracting username from JWT, the filter doesn't:
1. Load UserDetails from database
2. Create Authentication object
3. Set it in SecurityContext

---

## ✅ Solution

### 1. Locate the File
Find: `JwtAuthenticationFilter.java` in your backend project (usually in `config` or `security` package)

---

### 2. Fix the Filter

**Before (Broken):**
```java
@Override
protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
) throws ServletException, IOException {
    
    try {
        String jwt = getJwtFromRequest(request);
        
        if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
            String username = jwtUtils.getUsernameFromJwtToken(jwt);
            logger.debug("✓ Username extracted from JWT: {}", username);
            
            // ❌ MISSING: Load UserDetails and set Authentication
        }
    } catch (Exception e) {
        logger.error("Cannot set user authentication: {}", e.getMessage());
    }
    
    filterChain.doFilter(request, response);
}
```

**After (Fixed):**
```java
@Override
protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
) throws ServletException, IOException {
    
    try {
        String jwt = getJwtFromRequest(request);
        
        if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
            String username = jwtUtils.getUsernameFromJwtToken(jwt);
            logger.debug("✓ Username extracted from JWT: {}", username);
            
            // ✅ FIX: Load UserDetails from database
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            logger.debug("✓ UserDetails loaded for: {}", username);
            
            // ✅ FIX: Create Authentication object
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                    userDetails, 
                    null, 
                    userDetails.getAuthorities()
                );
            
            authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
            );
            
            // ✅ FIX: Set Authentication in SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
            logger.debug("✓ Authentication set in SecurityContext");
        }
    } catch (Exception e) {
        logger.error("❌ Cannot set user authentication: {}", e.getMessage());
    }
    
    filterChain.doFilter(request, response);
}
```

---

### 3. Add Required Dependency Injection

Make sure `UserDetailsService` is injected:

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private UserDetailsService userDetailsService; // ✅ ADD THIS!
    
    // ... rest of the code
}
```

---

### 4. Add Required Imports

Add these imports at the top of the file:

```java
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
```

---

## 🎯 Complete Working Example

```java
package com.readyroad.readyroad.config;

import com.readyroad.readyroad.security.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        String method = request.getMethod();
        String path = request.getRequestURI();
        logger.debug("🔍 JWT Filter - {} {}", method, path);
        
        // Skip OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            logger.debug("⏭️ Skipping JWT check for OPTIONS request");
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            String jwt = getJwtFromRequest(request);
            
            if (jwt != null && StringUtils.hasText(jwt)) {
                logger.debug("🔑 JWT token found (length: {})", jwt.length());
                
                if (jwtUtils.validateJwtToken(jwt)) {
                    String username = jwtUtils.getUsernameFromJwtToken(jwt);
                    logger.debug("✅ Username extracted from JWT: {}", username);
                    
                    // Load user details
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.debug("✅ UserDetails loaded successfully");
                    
                    // Create authentication token
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                            userDetails, 
                            null, 
                            userDetails.getAuthorities()
                        );
                    
                    authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    
                    // Set authentication in security context
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("✅ Authentication set in SecurityContext for user: {}", username);
                } else {
                    logger.warn("⚠️ Invalid JWT token");
                }
            } else {
                logger.debug("❌ No JWT token found - allowing anonymous access to: {} {}", method, path);
            }
        } catch (Exception e) {
            logger.error("❌ Cannot set user authentication: {}", e.getMessage(), e);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        return null;
    }
}
```

---

## 🧪 Testing

After fixing, you should see these logs:

```
✅ Username extracted from JWT: test
✅ UserDetails loaded successfully
✅ Authentication set in SecurityContext for user: test
```

Instead of:
```
❌ Set SecurityContextHolder to anonymous SecurityContext
```

---

## 📝 Quick Fix Steps

1. **Open** `JwtAuthenticationFilter.java`
2. **Add** `@Autowired private UserDetailsService userDetailsService;`
3. **Replace** the `doFilterInternal` method with the complete example above
4. **Restart** Spring Boot application
5. **Test** by accessing `/api/users/me` with JWT token

---

## 🔍 Verification

Test the endpoint:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8890/api/users/me
```

Expected response:
```json
{
  "id": 1,
  "username": "test",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User"
}
```

---

## ⚠️ Common Issues

1. **UserDetailsService not found**: Make sure you have a `@Service` class implementing `UserDetailsService`
2. **Circular dependency**: If you get circular dependency error, use `@Lazy` injection
3. **User not found**: Make sure the username in JWT matches database records

---

**Date:** January 26, 2026
**Status:** Ready to apply
