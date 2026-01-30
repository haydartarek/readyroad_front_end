# ReadyRoad Deployment Smoke Test Checklist

**Version:** 1.0.0  
**Last Updated:** January 30, 2026  
**Epic:** 10 - Deployment & Observability Baseline

---

## Pre-Deployment Checklist

### Environment Configuration

- [ ] `.env.production` configured with correct values
  - [ ] `NEXT_PUBLIC_API_URL` points to production backend
  - [ ] `NEXT_PUBLIC_APP_URL` matches production domain
  - [ ] `JWT_SECRET` is strong (32+ characters) and unique
- [ ] Environment variables validated (no development values)
- [ ] Secrets not committed to version control

### Build Verification

- [ ] Web production build succeeds: `npm run build`
- [ ] Mobile release build succeeds: `flutter build apk --release`
- [ ] No build warnings blocking deployment
- [ ] Static assets optimized and compressed

### Code Quality

- [ ] All tests passing: `npm test` (63/63)
- [ ] Lint clean: `npm run lint`
- [ ] TypeScript errors resolved
- [ ] No console.log statements leaking sensitive data

---

## Post-Deployment Smoke Tests

### Health & Infrastructure

- [ ] Health endpoint responds: `GET /api/health` → 200 OK
- [ ] HTTPS enabled and certificate valid
- [ ] CDN/caching configured correctly
- [ ] Environment variables loaded correctly

### Authentication Flow (End-to-End)

- [ ] **Login Flow**
  - [ ] Navigate to `/login`
  - [ ] Enter valid credentials
  - [ ] Token stored in localStorage: `localStorage.getItem('readyroad_auth_token')`
  - [ ] Token stored in cookie: Application > Cookies > `readyroad_auth_token` (required by Next.js middleware)
  - [ ] Redirected to `/dashboard`
  - [ ] User data loaded correctly
  
- [ ] **Registration Flow**
  - [ ] Navigate to `/register`
  - [ ] Fill all required fields (6 fields)
  - [ ] Validation works (errors show on invalid input)
  - [ ] Successful registration redirects to `/dashboard`
  
- [ ] **Logout Flow**
  - [ ] Click logout in navbar
  - [ ] Token cleared from localStorage AND cookie
  - [ ] Redirected to `/login`
  - [ ] Cannot access protected routes

- [ ] **Protected Route Guards**
  - [ ] Unauthenticated access to `/dashboard` redirects to `/login?returnUrl=/dashboard`
  - [ ] Unauthenticated access to `/exam` redirects with returnUrl
  - [ ] After login, returnUrl redirect works correctly
  - [ ] Authenticated users accessing `/login` redirect to `/dashboard`

### Exam Flow (End-to-End)

- [ ] Navigate to `/exam`
- [ ] Exam starts successfully
- [ ] Questions load correctly
- [ ] Answer submission works
- [ ] Progress tracking accurate
- [ ] Exam completion shows results
- [ ] Results saved to backend

### Practice Flow (End-to-End)

- [ ] Navigate to `/practice`
- [ ] Select practice category
- [ ] Questions load for selected category
- [ ] Answer feedback immediate and correct
- [ ] Next question navigation works
- [ ] Practice session completable

### API Request Routing (Critical)

- [ ] **Requests must hit Backend (not Next.js)**
  - [ ] Network tab: Login request URL = `{BACKEND_URL}/api/auth/login` (NOT `localhost:3000/api/...`)
  - [ ] Network tab: `/auth/me` request includes `Authorization: Bearer` header
  - [ ] Network tab: Analytics requests go to Backend port (8890 in dev)
- [ ] **After Backend code changes**: Backend must be restarted for changes to take effect

### Analytics Flow (End-to-End)

- [ ] Navigate to `/analytics/weak-areas`
- [ ] Weak areas data displays correctly (not 401 error)
- [ ] Navigate to `/analytics/error-patterns`
- [ ] Error patterns data displays correctly (not 401 error)
- [ ] Charts/visualizations render properly

### Language & Internationalization

- [ ] **Language Switching**
  - [ ] Switch to Arabic → UI changes to RTL, text in Arabic
  - [ ] Switch to English → UI changes to LTR, text in English
  - [ ] Switch to Dutch → UI changes to LTR, text in Dutch
  - [ ] Switch to French → UI changes to LTR, text in French
  - [ ] Language preference persisted: `localStorage.getItem('readyroad_locale')`
  - [ ] **CRITICAL**: Current route preserved after language switch (no navigation)
  
- [ ] **RTL Layout**
  - [ ] Arabic: `document.documentElement.dir === 'rtl'`
  - [ ] Arabic: `document.documentElement.lang === 'ar'`
  - [ ] EN/NL/FR: `document.documentElement.dir === 'ltr'`

### Deep Links (Mobile Only)

- [ ] **Custom Scheme**: `readyroad://exam` opens app to exam screen
- [ ] **Universal Link**: `https://readyroad.com/lessons` opens app
- [ ] **Protected Deep Links**: Protected routes require login first
- [ ] **Public Deep Links**: Public routes open directly
- [ ] **Post-Login Continuation**: After login, pending deep link navigates correctly

### Public Routes (No Auth Required)

- [ ] Homepage `/` accessible without auth
- [ ] Traffic signs `/traffic-signs` accessible
- [ ] Lessons `/lessons` accessible
- [ ] Lesson detail `/lessons/[code]` accessible
- [ ] Traffic sign detail `/traffic-signs/[code]` accessible

### Error Handling

- [ ] **Global Error Boundary**
  - [ ] Trigger runtime error → Safe fallback UI shown
  - [ ] No raw stack traces visible
  - [ ] "Try Again" button functional
  - [ ] "Go Home" button navigates to `/`
  
- [ ] **API Error Handling**
  - [ ] 401 Unauthorized → Token cleared, redirect to `/login`
  - [ ] 403 Forbidden → Appropriate error message
  - [ ] 404 Not Found → Appropriate error message
  - [ ] 429 Rate Limit → Appropriate error message
  - [ ] 500 Server Error → Appropriate error message
  - [ ] Network error → Appropriate error message

### Security & Privacy

- [ ] **No Sensitive Data Leaks**
  - [ ] Check browser console → No tokens logged
  - [ ] Check browser console → No passwords logged
  - [ ] Check network tab → Auth token in headers only
  - [ ] Check error messages → No sensitive data exposed
  
- [ ] **Token Security**
  - [ ] Token stored with correct key: `readyroad_auth_token` (both localStorage and cookie)
  - [ ] Token sent in Authorization header: `Bearer <token>`
  - [ ] Token NOT sent for `/auth/login` and `/auth/register` (public endpoints)
  - [ ] Token IS sent for `/auth/me` (protected endpoint)
  - [ ] Token cleared on 401 errors (both localStorage and cookie)
  - [ ] Token cleared on logout (both localStorage and cookie)

### Performance & UX

- [ ] Page load time < 3 seconds
- [ ] Images optimized and lazy-loaded
- [ ] Smooth animations (no jank)
- [ ] Mobile responsive on all screen sizes
- [ ] Keyboard navigation works
- [ ] Accessibility: Screen reader compatible

---

## Rollback Plan

If critical issues found post-deployment:

1. **Immediate**: Revert to previous stable version
2. **Notify**: Alert users of temporary service disruption
3. **Investigate**: Review logs and error reports
4. **Fix**: Address issues in development
5. **Re-test**: Run full smoke test checklist
6. **Re-deploy**: Deploy fixed version

---

## Contact & Support

- **Deployment Lead**: [Name]
- **Backend API Status**: [API Health URL]
- **Incident Response**: [Process/Contact]

---

## Sign-Off

- [ ] Development Lead: _______________  Date: ___________
- [ ] QA Lead: _______________  Date: ___________
- [ ] DevOps Lead: _______________  Date: ___________
- [ ] Product Owner: _______________  Date: ___________

---

**Notes:**

- All checkboxes must be verified before production release
- Document any deviations or issues in deployment notes
- Update this checklist based on production learnings
