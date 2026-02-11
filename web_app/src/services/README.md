# Services Documentation

This folder contains all API service modules for the ReadyRoad application.

## 📁 Structure

```
src/services/
├── index.ts              # Central export point
├── userService.ts        # User-related API calls
├── authService.ts        # Authentication API calls
├── analyticsService.ts   # Analytics and weak areas
├── progressService.ts    # Progress tracking and statistics
└── README.md             # This file
```

## 🚀 Usage Examples

### Using User Service

```typescript
// Import specific functions
import { getCurrentUser, getUnreadNotificationCount } from '@/services';

// Or import the service object
import { userService } from '@/services';

// In a component
const user = await getCurrentUser();
const count = await getUnreadNotificationCount();
```

### Using Auth Service

```typescript
import { login, logout, isAuthenticated } from '@/services';

// Login
const response = await login({ username: 'test', password: '123' });

// Check auth status
if (isAuthenticated()) {
  console.log('User is logged in');
}

// Logout
logout();
```

### Check User Roles

```typescript
import { getCurrentUser, isAdmin, isModerator, hasRole } from '@/services';

const user = await getCurrentUser();

if (isAdmin(user)) {
  console.log('User is an admin');
}

if (isModerator(user)) {
  console.log('User is a moderator or higher');
}

if (hasRole(user, 'USER')) {
  console.log('User has at least USER role');
}
```

### Using Analytics Service

```typescript
import { getWeakAreas, getErrorPatterns } from '@/services';

// Get weak areas
const weakAreas = await getWeakAreas();
console.log('Weak categories:', weakAreas.weakAreas);

// Get error patterns
const patterns = await getErrorPatterns();
console.log('Common mistakes:', patterns.patterns);
```

### Using Progress Service

```typescript
import { getOverallProgress, getProgressByCategory } from '@/services';

// Get overall progress
const progress = await getOverallProgress();
console.log('Total exams:', progress.totalAttempts);
console.log('Accuracy:', progress.overallAccuracy);

// Get progress by category
const categoryProgress = await getProgressByCategory();
console.log('Categories:', categoryProgress.categories);
```

## ✅ Available Endpoints

### User Service

- ✅ `getCurrentUser()` - GET /api/users/me
- ✅ `getUnreadNotificationCount()` - GET /api/users/me/notifications/unread-count
- ⚠️ `getUserStats()` - Not implemented yet in backend
- ⚠️ `updateProfile()` - Not implemented yet in backend

### Auth Service

- ✅ `login()` - POST /api/auth/login
- ✅ `register()` - POST /api/auth/register
- ✅ `logout()` - Clear session
- ✅ `isAuthenticated()` - Check if logged in
- ✅ `getToken()` - Get JWT token

### Analytics Service

- ✅ `getWeakAreas()` - GET /api/users/me/analytics/weak-areas
- ✅ `getErrorPatterns()` - GET /api/users/me/analytics/error-patterns
- ✅ `getAnalyticsSummary()` - Combined analytics data

### Progress Service

- ✅ `getOverallProgress()` - GET /api/users/me/progress/overall
- ✅ `getProgressByCategory()` - GET /api/users/me/progress/by-category
- ✅ `getRecentActivity()` - GET /api/users/me/progress/recent-activity

## 🔐 Authentication Flow

WeakAreasData` / `WeakArea` - Analytics types

- `OverallProgress` / `CategoryProgress` - Progress types
- `

1. User calls `login()` with credentials
2. Token is saved to localStorage and cookie
3. All subsequent API calls automatically include the token (handled by apiClient)
4. User calls `logout()` to clear session

## 📝 Type Safety

All services are fully typed with TypeScript interfaces:

- `UserProfile` - User data structure
- `LoginRequest` / `LoginResponse` - Auth types
- `NotificationCount` - Notification data
- And more...

## 🛠️ Adding New Services

To add a new service (e.g., `lessonService.ts`):

1. Create `src/services/lessonService.ts`
2. Export functions and types
3. Add exports to `src/services/index.ts`
4. Use in your components via `import { ... } from '@/services'`

---

**Created:** February 8, 2026  
**Status:** ✅ Production Ready  
**Services:** 4 (User, Auth, Analytics, Progress)
