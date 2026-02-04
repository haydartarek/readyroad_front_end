# ReadyRoad Frontend - Quick Start

## 🚀 Start in 30 Seconds

```bash
# Navigate to web app
cd readyroad_front_end/web_app

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

**Access:** http://localhost:3000

---

## ✅ What's Ready

- ✅ Next.js 16.1.6 (locked version)
- ✅ React 19.2.4 (locked version)
- ✅ Turbopack configured
- ✅ Auth middleware working
- ✅ Security headers enabled
- ✅ Production optimizations active

---

## 📋 Quick Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run tests
npm run test:coverage    # Run with coverage

# Linting
npm run lint             # Check code quality
```

---

## 🔑 Authentication Flow

### Protected Routes
- `/dashboard`
- `/exam`
- `/practice`
- `/analytics`
- `/progress`
- `/profile`

### Public Routes
- `/` (home)
- `/login`
- `/register`
- `/about`
- `/contact`

**Behavior:**
- Accessing protected route without login → Redirect to `/login?returnUrl=...`
- Accessing login/register with valid token → Redirect to `/dashboard`
- Invalid token → Auto-cleanup, allow page load

---

## 🌐 Backend Connection

**Backend URL:** http://localhost:8890

**Required:** Backend must be running for full functionality

```bash
# Start backend (from backend directory)
cd ../../readyroad
mvn spring-boot:run -Dspring-boot.run.profiles=secure
```

**API Endpoints Used:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/traffic-signs` - Get all traffic signs
- `GET /api/admin/dashboard` - Admin dashboard (protected)

---

## ⚠️ Common Issues

### Port 3000 in use
```bash
npx kill-port 3000
# or
PORT=3001 npm run dev
```

### Backend not reachable
```bash
# Check backend is running
curl http://localhost:8890/api/health

# Should return: {"status":"UP","message":"Ready Road Backend is running"}
```

### Auth not working
1. Check backend CORS is configured for `http://localhost:3000`
2. Verify JWT secret is set in backend
3. Clear cookies: DevTools → Application → Cookies → Delete `readyroad_auth_token`

---

## 📊 Build Verification

```bash
# Build for production
npm run build

# Expected output:
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                   5.2 kB         92.1 kB
├ ○ /_not-found                         0 kB           0 kB
├ ○ /login                              12.3 kB        104.2 kB
└ ○ /dashboard                          8.5 kB         100.4 kB
```

---

## 🔧 Environment Variables

### Development (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8890
NEXT_PUBLIC_APP_ENV=development
```

### Production (`.env.production`)
```bash
NEXT_PUBLIC_API_URL=https://api.readyroad.com
NEXT_PUBLIC_APP_ENV=production
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage:**
- Authentication flows
- Protected route access
- Component rendering
- API integration

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Docker
```bash
docker build -t readyroad-frontend .
docker run -p 3000:3000 readyroad-frontend
```

### PM2 (Traditional)
```bash
npm run build
pm2 start npm --name "readyroad-frontend" -- start
```

---

## 📝 Status

**Production Ready:** ✅ YES

**Version:** 1.0.0
- Next.js: 16.1.6
- React: 19.2.4
- TypeScript: 5.x
- Tailwind CSS: 4.x

**Last Updated:** 2026-02-04

---

## 📚 Documentation

- **Full Guide:** [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)
- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev

---

**Ready to start?** Run `npm run dev` now! 🎉
