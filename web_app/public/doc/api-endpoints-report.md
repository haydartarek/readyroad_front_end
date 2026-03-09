# ReadyRoad - Full API Endpoints Audit Report
Generated: 2026-03-05 (Updated)
Last session changes: 2026-03-09 (Session 8 — i18n Unification, Auth Page Fixes, SQL Cleanup, Docker Verification)

---

## 1. BACKEND REST ENDPOINTS (Spring Boot)

### Authentication — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Create new user account |
| POST | `/api/auth/login` | Public | Login, returns JWT token |
| GET | `/api/auth/me` | JWT | Get current user profile |
| GET | `/api/auth/health` | Public | Auth service health check |

### User Profile — `/api/users`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | JWT | Get current user (alias for auth/me) |

### Progress — `/api/users/me/progress`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/progress/overall` | JWT | Overall progress stats — **now includes `totalExamsTaken`, `passedExams`, `failedExams`, `passRate`** |
| GET | `/api/users/me/progress/categories` | JWT | Progress per category |
| GET | `/api/users/me/progress/recommendations` | JWT | Personalized recommendations |

> ⚠️ `/api/users/me/progress/recent-activity` does **NOT** exist in the backend. The dashboard generates a synthetic single-row recent activity entry from `lastActivityDate` + `overallAccuracy` instead.

### Analytics — `/api/users/me/analytics`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/analytics/error-patterns` | JWT | User error pattern analysis |
| GET | `/api/users/me/analytics/weak-areas` | JWT | Weak areas by category |

### Quiz (Practice) — `/api/quiz`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/quiz/random` | JWT | Random practice question |
| GET | `/api/quiz/category/{categoryId}` | JWT | Questions by category |
| GET | `/api/quiz/stats` | JWT | Quiz statistics for current user |
| GET | `/api/quiz/stats/category/{categoryId}` | JWT | Stats per category |
| POST | `/api/quiz/questions/{questionId}/answer` | JWT | Submit answer |

### Exam Simulation — `/api/exams/simulations`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/exams/simulations/start` | JWT | Start new exam |
| GET | `/api/exams/simulations/can-start` | JWT | Check if eligible to start |
| GET | `/api/exams/simulations/{examId}` | JWT | Get exam details |
| POST | `/api/exams/simulations/{examId}/questions/{questionId}/answer` | JWT | Answer during exam |
| POST | `/api/exams/simulations/{examId}/submit` | JWT | Submit/finish exam |
| GET | `/api/exams/simulations/{examId}/results` | JWT | Exam results |
| GET | `/api/exams/simulations/active` | JWT | Get active (in-progress) exam |
| GET | `/api/exams/simulations/history` | JWT | Exam history for current user |

### ~~Exam Simulation (alt) — `/api/exam-simulations`~~ — **DELETED (2026-03-05)**
> ⚠️ `ExamSimulationController.java` was deleted entirely. These endpoints no longer exist.
> Use `/api/exams/simulations/**` instead (see section above).

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| ~~POST~~ | ~~`/api/exam-simulations/start`~~ | ~~JWT~~ | **REMOVED** |
| ~~GET~~ | ~~`/api/exam-simulations/active`~~ | ~~JWT~~ | **REMOVED** |
| ~~GET~~ | ~~`/api/exam-simulations/history`~~ | ~~JWT~~ | **REMOVED** |
| ~~DELETE~~ | ~~`/api/exam-simulations/active`~~ | ~~JWT~~ | **REMOVED** |

### Smart Quiz — `/api/smart-quiz`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/smart-quiz/random` | JWT | Smart adaptive question |
| GET | `/api/smart-quiz/category/{categoryId}` | JWT | Smart questions by category |
| GET | `/api/smart-quiz/stats` | JWT | Smart quiz statistics |
| GET | `/api/smart-quiz/stats/category/{categoryId}` | JWT | Stats per category |

### Sign Quiz — `/api/sign-quiz`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/sign-quiz/signs` | JWT | Get all signs for quiz |
| POST | `/api/sign-quiz/practice/{signCode}` | JWT | Start sign practice session |
| POST | `/api/sign-quiz/practice/{sessionId}/questions/{questionId}/answer` | JWT | Answer in practice session |
| GET | `/api/sign-quiz/practice/{sessionId}/results` | JWT | Practice session results |
| GET | `/api/sign-quiz/exam/{signCode}/{examNumber}` | JWT | Get sign exam |
| POST | `/api/sign-quiz/exam/{signCode}/{examNumber}/submit` | JWT | Submit sign exam |

### Exam Questions — `/api/exam-questions`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/exam-questions` | JWT | List all exam questions |
| GET | `/api/exam-questions/{id}` | JWT | Get question by ID |
| GET | `/api/exam-questions/random` | JWT | Random exam question |
| GET | `/api/exam-questions/random/category/{categoryId}` | JWT | Random by category |

### Lessons — `/api/lessons`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/lessons` | Public | List all lessons |
| GET | `/api/lessons/{idOrCode}` | Public | Get lesson by ID or code |
| GET | `/api/lessons/search` | Public | Search lessons |
| GET | `/api/lessons/count` | Public | Count of lessons |

### Categories — `/api/categories`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Public | List all categories |
| GET | `/api/categories/{code}` | Public | Get category by code |

### Traffic Signs — `/api/traffic-signs`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/traffic-signs` | Public | List all traffic signs |
| GET | `/api/traffic-signs/category/{categoryId}` | Public | Signs by category |
| GET | `/api/traffic-signs/{signCode}` | Public | Sign by code |
| GET | `/api/traffic-signs/search` | Public | Search signs |

### Traffic Rules — `/api/traffic-rules`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/traffic-rules` | Public | List all traffic rules |
| GET | `/api/traffic-rules/{id}` | Public | Get rule by ID |
| GET | `/api/traffic-rules/category/{category}` | Public | Rules by category |

### Notifications — `/api/users/me/notifications`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/notifications` | JWT | Get all notifications |
| GET | `/api/users/me/notifications/unread-count` | JWT | Count unread notifications |
| PATCH | `/api/users/me/notifications/{id}/read` | JWT | Mark one as read |
| PATCH | `/api/users/me/notifications/read-all` | JWT | Mark all as read |

### Search — `/api/search`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/search` | Public | Global search (signs, rules, lessons) |

### Health — `/api/health`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | Public | Backend health check |
| GET | `/` | Public | Home/redirect |

---

### ADMIN ENDPOINTS — `/api/admin` (ROLE_ADMIN only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Aggregate stats (users, signs, quiz attempts) |
| GET | `/api/admin/users` | All users list (paginated) |
| GET | `/api/admin/users/{id}` | User details by ID |
| PUT | `/api/admin/users/{id}/role` | Update user role |
| PUT | `/api/admin/users/{id}/lock` | Lock/Unlock user account |
| GET | `/api/admin/health` | System health metrics |
| GET | `/api/admin/analytics/quiz-stats` | Global quiz performance stats |
| GET | `/api/admin/analytics/category-stats` | Performance per category (all users) |
| GET | `/api/admin/analytics/recent-exams` | Recent exams list (all users, with username/fullName) |
| GET | `/api/admin/diagnostics/quiz-integrity` | Quiz question quality report |
| GET | `/api/admin/signs` | All traffic signs (paginated + filter) |
| GET | `/api/admin/signs/{id}` | Sign by ID |
| POST | `/api/admin/signs` | Create new sign |
| PUT | `/api/admin/signs/{id}` | Update sign |
| DELETE | `/api/admin/signs/{id}` | Delete sign |
| POST | `/api/admin/upload/image` | Upload question image |
| POST | `/api/admin/signs/import/validate` | Validate bulk sign import |
| POST | `/api/admin/signs/import/execute` | Execute bulk sign import |
| GET | `/api/admin/signs/governance/audit` | Sign governance audit |
| GET | `/api/admin/quiz/questions` | All quiz questions (paginated + filter) |
| GET | `/api/admin/quiz/questions/{id}` | Quiz question by ID |
| POST | `/api/admin/quiz/questions` | Create quiz question |
| PUT | `/api/admin/quiz/questions/{id}` | Update quiz question |
| DELETE | `/api/admin/quiz/questions/{id}` | Delete quiz question |
| POST | `/api/admin/reset-test-data` | Reset test/seed data |
| POST | `/api/admin/import/{type}/preview` | Preview data import |
| POST | `/api/admin/import/{type}/execute` | Execute data import |
| GET | `/api/admin/import/history` | Import history |
| GET | `/api/admin/import/history/{id}` | Import by ID |
| POST | `/api/admin/lessons-import/preview` | Preview lesson import (multipart) |
| POST | `/api/admin/lessons-import/execute` | Execute lesson import (multipart) |
| POST | `/api/admin/lessons-import/execute-bundled` | Execute bundled lesson import |
| POST | `/api/admin/sign-quiz/import` | Import sign quiz data |
| GET | `/api/admin/sign-quiz/import/last` | Last sign import record |
| GET | `/api/admin/sign-quiz/signs` | Sign quiz signs list |
| GET | `/api/admin/sign-quiz/signs/{code}` | Sign quiz sign by code |
| GET | `/api/admin/sign-quiz/stats` | Sign quiz statistics |

---

## 2. DATABASE TABLES (Flyway Migrations V1–V104)

> **Updated 2026-03-05**: V103 and V104 added to fix traffic signs data.

| Table | Created In | Purpose |
|-------|-----------|------|
| `categories` | V1 | Traffic categories (A, B, C…) |
| `traffic_signs` | V1 + V103/V104 | All road/traffic signs (251 total after fix) |
| `users` | V2 | User accounts |
| `lessons` | V3 | Learning lesson content |
| `practice_questions` | V3 | Practice quiz questions |
| `exam_questions` | V3 | Exam simulation questions |
| `quiz_attempts` | V3 | Records of quiz/exam sessions |
| `user_category_progress` | V3 | Per-category progress per user |
| `user_learning_progress` | V3 | Overall learning progress |
| `quiz_user_answers` | V11 | Individual answers per quiz attempt |
| `user_weak_areas` | V11 | Weak topics/signs per user |
| `smart_stats` | V11 | Smart quiz adaptive statistics |
| `notification_types` | V97 | Notification type definitions |
| `notifications` | V97 | User notifications |
| `achievements` | V98 | Achievement definitions |
| `user_achievements` | V98 | User earned achievements |
| `road_signs` | V99 | Signs for sign quiz (separate) |
| `sign_questions` | V99 | Questions per road sign |
| `sign_choices` | V99 | Answer choices per sign question |
| `sign_exams` | V99 | Sign exam records |
| `sign_exam_questions` | V99 | Questions per sign exam |
| `sign_practice_sessions` | V101 | Sign practice sessions |
| `sign_practice_answers` | V101 | Answers in sign practice |

### New Migrations (2026-03-05 / 2026-03-06)
| Migration | Description | Effect |
|-----------|-------------|--------|
| V103 | Reload All Missing Traffic Signs | Inserts category A + 172 signs (A,B,C,D,F,G,M,Z series) using `ON DUPLICATE KEY UPDATE` |
| V104 | Insert Missing NoSeries Signs | Inserts 88 additional signs that had no `series` field in source JSON (onderborden→G, afbakeningsborden→M, informatieborden→H, aanwijzingsborden→F, etc.) |
| V105 | Seed 30 lessons with full multilingual content | Inserts 30 lessons × 4 languages (EN/AR/NL/FR), each with `displayOrder` 0–29, title, description, icon, pages array with `contentEn/Ar/Nl/Fr`, key points, and learning objectives |

---

## 3. FRONTEND PAGES (Next.js)

### Public Pages
| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing/home page |
| `/lessons` | `app/lessons/page.tsx` | Lessons list |
| `/lessons/[lessonId]` | `app/lessons/[lessonId]/page.tsx` | Lesson detail |
| `/traffic-signs` | `app/traffic-signs/page.tsx` | Traffic signs browser |
| `/traffic-signs/[signCode]` | `app/traffic-signs/[signCode]/page.tsx` | Sign detail |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Terms of service |
| `/contact` | `app/contact/page.tsx` | Contact page |

### Protected Pages (Require Login)
| Route | File | API Called | Description |
|-------|------|-----------|-------------|
| `/(protected)/dashboard` | `dashboard/page.tsx` | `/api/users/me/progress/overall` | User dashboard |
| `/(protected)/practice` | `practice/page.tsx` | `/api/quiz/random` `/api/categories` | Practice hub |
| `/(protected)/practice/[category]` | `practice/[category]/page.tsx` | `/api/quiz/category/{id}` | Practice by category |
| `/(protected)/exam` | `exam/page.tsx` | `/api/exams/simulations/start` | Start exam |
| `/(protected)/exam/[id]` | `exam/[id]/page.tsx` | `/api/exams/simulations/{id}` | Active exam |
| `/(protected)/exam/results/[id]` | `exam/results/[id]/page.tsx` | `/api/exams/simulations/{id}/results` | Exam results |
| `/(protected)/progress` | `progress/page.tsx` | `/api/users/me/progress/overall` | Progress tracker |
| `/(protected)/profile` | `profile/page.tsx` | `/api/auth/me` | User profile |
| `/(protected)/analytics/error-patterns` | `analytics/error-patterns/page.tsx` | `/api/users/me/analytics/error-patterns` | Error analysis |
| `/(protected)/analytics/weak-areas` | `analytics/weak-areas/page.tsx` | `/api/users/me/analytics/weak-areas` | Weak areas |

> **Updated 2026-03-05**: Both analytics pages are now directly linked from the Dashboard via dedicated Quick Action buttons ("Error Patterns" and "Weak Areas"). Grid changed from `lg:grid-cols-4` → `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`.
>
> **Updated 2026-03-06**: `/lessons/[lessonId]` fully redesigned with gradient content card and smart bullet renderer. `/practice` and `/exam` both have full RTL (`dir`) support. `/exam` pre-start screen uses i18n keys for all strings.

### Admin Pages (Require ADMIN role)
| Route | File | API Called | Description |
|-------|------|-----------|-------------|
| `/admin` | `admin/page.tsx` | — | Admin home/redirect |
| `/admin/dashboard` | `admin/dashboard/page.tsx` | `GET /api/admin/dashboard` | Aggregate stats |
| `/admin/users` | `admin/users/page.tsx` | `GET /api/admin/users` `PUT /api/admin/users/{id}/role` `PUT /api/admin/users/{id}/lock` | User management |
| `/admin/signs` | `admin/signs/page.tsx` | `GET /api/admin/signs` `DELETE /api/admin/signs/{id}` | Traffic signs list |
| `/admin/signs/add` | `admin/signs/add/page.tsx` | `POST /api/admin/signs` | Add sign |
| `/admin/signs/new` | `admin/signs/new/page.tsx` | `POST /api/admin/signs` | New sign form |
| `/admin/signs/[id]/edit` | `admin/signs/[id]/edit/page.tsx` | `GET/PUT /api/admin/signs/{id}` | Edit sign |
| `/admin/quizzes` | `admin/quizzes/page.tsx` | `GET /api/admin/quiz/questions` | Quiz questions |
| `/admin/data-import` | `admin/data-import/page.tsx` | `POST /api/admin/import/*` | Data import |
| `/admin/settings` | `admin/settings/page.tsx` | — | Admin settings |

---

## 4. DASHBOARD DATA PER USER

### User Dashboard (`/dashboard`)
Shows data from the **logged-in user's own account** only:
- Overall progress (lessons completed, quiz accuracy)
- Progress per category
- Exam history (pass/fail, scores)
- Quick actions: Practice, Exam, Signs, Progress, **Error Patterns** *(new)*, **Weak Areas** *(new)*

> **Updated 2026-03-05 (Session 2)**: Dashboard was showing all zeros because `ExamService.completeExam()` never wrote to `user_category_progress` or `user_question_history`. Fixed. All fields now show real data.

### Dashboard Field Mapping (after Session 2 fix)

| Dashboard Widget | Field | Source | Notes |
|-----------------|-------|--------|-------|
| Questions Done (top strip) | `totalAttempted` | `user_category_progress` SUM | Questions answered across all practice + exams |
| Avg Score (top strip) | `overallAccuracy` | calculated | totalCorrect / totalAttempted × 100 |
| Pass Rate (top strip) | `passRate` | `exam_simulations` | passedExams / totalExamsTaken × 100. 0% if no exams taken |
| Streak (top strip) | `studyStreak` | `user_question_history` | Consecutive calendar days with activity |
| EXAMS TAKEN (progress card) | `totalExamsTaken` | `exam_simulations` COUNT | Real completed exam count |
| AVERAGE SCORE (progress card) | `overallAccuracy` | calculated | Practice + exam combined |
| PASS RATE (progress card) | `passRate` | `exam_simulations` COUNT | Exams ≥ 82% / total exams |
| CURRENT STREAK (progress card) | `studyStreak` | `user_question_history` | — |
| Most Studied | `mostStudiedCategories` | `user_category_progress` | Top 3 by questions attempted |
| Weak Areas | `weakCategories` | `user_category_progress` | < 70% accuracy with ≥ 5 attempts |
| Recent Activity type | dynamic | `totalExamsTaken > 0` | Shows "Official Exam" if any exams taken, else "Practice" |

### Admin Dashboard (`/admin/dashboard`)
Shows **aggregate data for ALL users**:
- `totalSigns`: total traffic signs in DB
- `totalUsers`: total registered users
- `totalQuizAttempts`: total quiz sessions
- `totalQuizQuestions`: total quiz questions
- `activeUsers`: users with `is_active = true`
- `adminUsers`: users with ADMIN role
- `moderatorUsers`: users with MODERATOR role

### Admin Users Page (`/admin/users`)
Shows **list of ALL users** with:
- username, email, full name, role, active/locked status, join date
- Admin can change role or lock/unlock any user

### Admin Recent Exams (`GET /api/admin/analytics/recent-exams`)
Shows **recent exam results across ALL users** including:
- `username`, `fullName` per exam entry
- score, pass/fail, date

---

## 5. USER ACTIVITY VERIFICATION (haydartestpage & intecbrussel)

To verify that user activities appear in the dashboard:

1. **Login as haydartestpage** → take a quiz/exam → Activities appear in:
   - Their own `/dashboard` (quiz stats, progress)
   - Admin `/admin/analytics/recent-exams` (visible to admins)
   - Admin `/admin/analytics/quiz-stats` (aggregated)

2. **Login as intecbrussel** → same pattern

3. **As admin, verify at** `/admin/users`:
   - Both users appear in the user list
   - Visit `/admin/analytics/recent-exams` to see their exam attempts

> **Note**: There is no dedicated "per-user activity detail page" in the current admin UI.
> The closest view is the recent-exams list filtered visually or by searching the users table.

---

## 6. DOCKER CONFIGURATION SUMMARY

| Setting | Value |
|---------|-------|
| MySQL port | 3307 (host) → 3306 (container) |
| Backend port | 8890 |
| MySQL image | mysql:8.0 |
| Database name | readyroad_prod |
| DB user | haydar |
| SQL mode | NO_ENGINE_SUBSTITUTION |
| Flyway migrations | V1–V104 (V103+V104 applied 2026-03-05) |
| JPA ddl-auto | none (Flyway manages schema) |
| Auth | JWT (24h expiry) |

---

## 7. CHANGES LOG — 2026-03-05

### 7.1 Backend

| File | Change |
|------|--------|
| `ExamSimulationController.java` | **DELETED** — `/api/exam-simulations/**` endpoints removed. Use `/api/exams/simulations/**` only. |
| `GlobalExceptionHandler.java` | Updated error message URL from `/api/exam-simulations/active` → `/api/exams/simulations/active` |
| `V103__Reload_All_Missing_Traffic_Signs.sql` | **NEW** — Inserts category A + 172 signs (A,B,C,D,F,G,M,Z series) |
| `V104__Insert_Missing_NoSeries_Signs.sql` | **NEW** — Inserts 88 additional signs without `series` field (onderborden→G, afbakeningsborden→M, informatieborden_en_tijdelijke_verkeersmaatregelen→H, aanwijzingsborden→F, etc.) |

### 7.2 Frontend

| File | Change |
|------|--------|
| `src/components/dashboard/quick-actions-section.tsx` | Added "Error Patterns" (BarChart2 icon → `/analytics/error-patterns`) and "Weak Areas" (TrendingDown icon → `/analytics/weak-areas`) quick action buttons. Grid: `lg:grid-cols-4` → `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5` |
| `src/messages/en.json` | Added `action_error_patterns_title`, `action_error_patterns_desc`, `action_weak_areas_title`, `action_weak_areas_desc` |
| `src/messages/ar.json` | Same 4 keys (Arabic) |
| `src/messages/fr.json` | Same 4 keys (French) |
| `src/messages/nl.json` | Same 4 keys (Dutch) |
| `src/contexts/auth-context.tsx` | `login()` now returns `Promise<LoginResult>` instead of throwing. Added `LoginResult { success, message?, status? }` interface. Eliminates React error overlay on failed login. |
| `src/app/(auth)/login/page.tsx` | `handleSubmit` uses `const result = await login(...)` return-value pattern instead of try/catch |

### 7.3 Database — Traffic Signs Root Cause & Fix

Migrations V51–V61 each ran `DELETE FROM traffic_signs` but none re-inserted data.
V90 only re-seeded 20 signs (category E only). Result: only 20 of 251 signs existed in DB.

```
V6   → INSERT 202 signs (all categories A-Z)
V51-V61 → DELETE FROM traffic_signs ×7  ← ROOT CAUSE (never re-inserted)
V90  → INSERT 20 signs, category E only
V103 → INSERT category A + 172 non-E signs   ← FIXED 2026-03-05
V104 → INSERT 88 additional signs             ← FIXED 2026-03-05
```

**Final traffic_signs counts after fix:**

| Category | Code | Count |
|----------|------|-------|
| Danger Signs | A | 34 |
| Priority Signs | B | 18 |
| Prohibition Signs | C | 35 |
| Mandatory Signs | D | 17 |
| Parking & Standing Signs | E | 20 |
| Information Signs | F | 58 |
| Supplementary Signs | G | 21 |
| Info & Temporary Traffic Signs | H | 8 |
| Delineation Signs | M | 15 |
| Zone Signs | Z | 25 |
| **TOTAL** | | **251** |

> Category A (`Danger Signs`) was also missing from the `categories` table — recreated by V103.

### 7.4 Accounts

| Account | Password | Role | Note |
|---------|----------|------|------|
| `admin` | `Admin2026Secure!` | ADMIN | Password updated to match `.env` |
| `haydar_owner` | `ReadyRoad2026@` | ADMIN | — |
| `haydartestpage` | `Test1234@` | USER | — |
| `intecbrussel` | `Test1234@` | USER | — |

---

## 8. CHANGES LOG — 2026-03-05 (Session 2: Dashboard & Progress Fixes)

### Root Cause
`ExamService.completeExam()` finished the exam and saved achievements but **never** wrote to:
- `user_category_progress` (stats per category)
- `user_question_history` (streak computation + SmartQuiz cooldown)

As a result, `ProgressService.getOverallProgress()` always returned zeros for any user who had only taken exams (not used the practice mode). The dashboard displayed all-zero data.

### 8.1 Backend Changes

| File | Change | Why |
|------|--------|-----|
| `ExamService.java` | After `completeExam()` achievements block: loop through exam answers → upsert `user_category_progress` per category (correct/attempts counters) | `ProgressService` reads from this table — without writes here, dashboard always showed 0 |
| `ExamService.java` | Loop through exam answers → call `historyRepository.upsertQuestionAnswered()` for each answered question | Required for streak calculation and SmartQuiz cooldown logic |
| `ExamService.java` | Call `streakService.updateStreakAndNotify(userId)` after writing history | Updates the consecutive-day streak counter |
| `ExamService.java` | Added new field injections: `UserCategoryProgressRepository`, `UserQuestionHistoryRepository`, `StreakService` | Dependencies needed for the above writes |
| `OverallProgressResponse.java` | Added fields: `totalExamsTaken` (int), `passedExams` (int), `failedExams` (int), `passRate` (BigDecimal) | Backend was returning no exam-level stats; dashboard was computing a synthetic fake pass rate |
| `ExamSimulationRepository.java` | Added method `countByUserIdAndStatusAndScorePercentageGreaterThanEqual()` | Used by ProgressService to count exams where score ≥ 82% (passing threshold) |
| `ProgressService.java` | Added `ExamSimulationRepository` dependency. After computing practice stats, queries exam stats: `totalExamsTaken`, `passedExams` (score ≥ 82%), `failedExams`, `passRate`. Both `getOverallProgress()` and `buildZeroProgressResponse()` now populate these 4 fields. | Without this, the 4 new DTO fields were always null/missing from API response |

### 8.2 Frontend Changes

| File | Change | Why |
|------|--------|-----|
| `src/services/progressService.ts` | Added `passRate?: number` to `OverallProgress` interface | New backend field needs TypeScript type |
| `src/services/progressService.ts` | Added `passRate: 0` to `OVERALL_FALLBACK` | Prevents `undefined` when backend is unreachable |
| `src/services/progressService.ts` | Added explicit `passRate: data.passRate ?? 0` in normalize block; also added `totalExamsTaken`, `passedExams`, `failedExams` explicit mappings | Ensures all 4 new fields are normalized with safe defaults |
| `src/app/(protected)/dashboard/page.tsx` | `defaultProgressData` — added `totalAttempted: 0` as new separate field | Top strip "Questions Done" needs its own state field distinct from exam count |
| `src/app/(protected)/dashboard/page.tsx` | `setProgressData()` — `totalExamsTaken` now maps to `progress.totalExamsTaken` (real exam count) instead of `progress.totalAttempted` (questions answered) | Previous mapping was semantically wrong: label said "Exams Taken" but value was question count |
| `src/app/(protected)/dashboard/page.tsx` | `setProgressData()` — added `totalAttempted: progress.totalAttempted ?? 0` | Feeds the "Questions Done" stat in the top strip |
| `src/app/(protected)/dashboard/page.tsx` | `setProgressData()` — `passRate` now maps to `progress.passRate` (real %) | Was using synthetic formula `accuracy >= 82 ? 100 : (accuracy/82)*100` — incorrect |
| `src/app/(protected)/dashboard/page.tsx` | Quick Stats strip — "Questions Done" value changed from `progressData.totalExamsTaken` → `progressData.totalAttempted` | After fixing totalExamsTaken to be a real exam count, the strip was showing exam count under "Questions Done" label |
| `src/app/(protected)/dashboard/page.tsx` | Recent Activity `type` changed from hardcoded `'practice'` → dynamic: `totalExamsTaken > 0 ? 'exam' : 'practice'` | Exam sessions were always displayed as "Practice" in the Recent Activity widget |
| `src/app/(protected)/dashboard/page.tsx` | Recent Activity `passed` field added: `passRate >= 100 ? true : undefined` | Allows the activity widget to show pass/fail badge for exam sessions |

### 8.3 Verified Results (after fix)

| Metric | Before | After |
|--------|--------|-------|
| Questions Done (top strip) | 0 | Real count (e.g. 50) |
| Avg Score | 0% | Real accuracy (e.g. 100%) |
| Pass Rate | 0% | Real exam pass rate (e.g. 33.33%) |
| Streak | 0 | Real consecutive days (e.g. 1) |
| EXAMS TAKEN (card) | 0 | Real exam count (e.g. 6) |
| Most Studied | empty | Real top 3 categories |
| Weak Areas | empty | Real weak categories |
| Recent Activity | "Practice" always | "Official Exam" when user has taken exams |
| `user_category_progress` rows | 0 after exam | 10 rows (one per category per exam) |
| `user_question_history` rows | 0 after exam | 50 rows (one per question answered) |

---

## 9. CHANGES LOG — 2026-03-05 (Session 3: Error Patterns Page + Translation Key Audit)

### 9.1 Frontend — Error Patterns Page (/analytics/error-patterns)

The page was completely broken with 7 stacked bugs. Full diagnostic and fix applied.

| File | Change | Why |
|------|--------|-----|
| `src/app/(protected)/analytics/error-patterns/page.tsx` | Replaced hardcoded English strings with `t()` calls throughout | All text was English-only regardless of selected language |
| `src/app/(protected)/analytics/error-patterns/page.tsx` | Added null/empty-state guards for `errorPatterns` array and individual pattern fields | Page crashed when API returned empty array or patterns with missing optional fields |
| `src/app/(protected)/analytics/error-patterns/page.tsx` | Fixed progress bar rendering — added safe `Math.min(value, 100)` clamp | Values > 100 from API caused overflow bar rendering |
| `src/app/(protected)/analytics/error-patterns/page.tsx` | Fixed category badge color mapping | All badges were rendering with fallback gray color |
| `src/app/(protected)/analytics/error-patterns/page.tsx` | Added loading skeleton and error boundary for API fetch failure | Page went blank on network error |
| `src/app/(protected)/analytics/error-patterns/page.tsx` | Fixed `mostMissedQuestion` field — added optional chaining | Hard crash when pattern had no `mostMissedQuestion` |
| `src/app/(protected)/analytics/error-patterns/page.tsx` | Replaced raw percentage display with formatted `toFixed(1)` | Displayed `0.3333333333` instead of `33.3%` |

### 9.2 Frontend — i18n Translation Key Audit (47 keys)

A full audit of all 4 language files was performed. 47 missing or mismatched keys were identified and added.

| File | Keys Added | Notes |
|------|-----------|-------|
| `src/messages/en.json` | 47 keys | Error patterns page, weak areas page, analytics shared keys |
| `src/messages/ar.json` | 47 keys | Full Arabic translations |
| `src/messages/nl.json` | 47 keys | Full Dutch translations |
| `src/messages/fr.json` | 47 keys | Full French translations |


---

## 10. CHANGES LOG — 2026-03-06 (Session 4: V105 Lessons, Redirect Fix, Encoding Fix, Breadcrumb Fix)

### 10.1 Backend — V105 Lessons Seed Migration

| File | Change | Why |
|------|--------|-----|
| `src/main/resources/db/migration/V105__Seed_30_Lessons.sql` | **NEW** — Inserts 30 lessons with full multilingual content (EN/AR/NL/FR), `displayOrder` 0–29, pages with content, key points, learning objectives | `/lessons` page was returning an empty list because no lesson data existed in the DB after earlier migrations wiped the table |

### 10.2 Backend — Encoding Fix

| File | Change | Why |
|------|--------|-----|
| `src/main/resources/application-prod.properties` | Added `SET NAMES utf8mb4` to JDBC URL connection init | Lesson content with Arabic/emoji characters was being stored as corrupted sequences instead of proper UTF-8 glyphs |

### 10.3 Frontend — Exam `[id]` Graceful Redirect

| File | Change | Why |
|------|--------|-----|
| `src/app/(protected)/exam/[id]/page.tsx` | Added redirect to `/exam` when API returns 404 or `"No active exam found"` | Page was crashing with an unhandled error overlay when navigating to `/exam/{id}` with a stale/invalid ID |

### 10.4 Frontend — Dashboard Pass Rate Logic Fix

| File | Change | Why |
|------|--------|-----|
| `src/app/(protected)/dashboard/page.tsx` | Changed "100% Failed" display logic — now uses `passRate >= 82` threshold from backend | Dashboard was showing "100% Failed" for any user whose pass rate was not exactly 100%, even with legitimate scores like 85% |

### 10.5 Frontend — Breadcrumb `Les 0` Fix

| File | Change | Why |
|------|--------|-----|
| `src/components/breadcrumb.tsx` | Fixed `LESSON_CODE_RE` regex to parse `lessonId` correctly and display `Lesson 1` instead of `Les 0` | Breadcrumb was parsing the lesson code incorrectly, extracting `0` from `LESSON-001` due to a wrong regex capture group |

---

## 11. CHANGES LOG — 2026-03-06 (Session 5: Lesson 0→1, Content Redesign, RTL, Exam Translations & Buttons)

### 11.1 Lesson Card — `displayOrder` 0-indexed fix

`displayOrder` in the DB is 0-indexed (0–29). All display locations now show `displayOrder + 1`.

| File | Location | Change |
|------|----------|--------|
| `src/components/lessons/lessons-grid.tsx` | Badge on lesson list cards | `{lesson.displayOrder}` → `{lesson.displayOrder + 1}` |
| `src/app/lessons/[lessonId]/page.tsx` | Lesson detail header badge | Same fix |
| `src/app/lessons/[lessonId]/page.tsx` | "Page X of Y / Lesson N" counter | Same fix |

### 11.2 Lesson Detail Page — Content Section Redesign

| File | Change |
|------|--------|
| `src/app/lessons/[lessonId]/page.tsx` | Replaced plain `whitespace-pre-line` text block with a gradient header card (`FileText` icon + blue gradient) and a **smart content renderer** |

**Smart content renderer logic:**
- Splits `contentEn/Ar/Nl/Fr` field by `
+`
- Detects line type: `/^[•\-*]\s/` → bullet, otherwise → prose
- Groups consecutive same-type lines into segments
- Prose segments → `<p>` tags (second+ prose paragraph gets a logical border highlight: `border-s-2 ps-3`)
- Inline bullet segments → rounded box with dot bullets (strips leading `•`)
- DB `bullets` array (separate field) → rounded box with `CheckCircle2` icons

### 11.3 Lesson Detail Page — Full RTL Support

| File | Change |
|------|--------|
| `src/app/lessons/[lessonId]/page.tsx` | Added `isRtl = language === 'ar'` |
| `src/app/lessons/[lessonId]/page.tsx` | Added directional icon variables: `ArrowStart`, `ArrowEnd`, `ChevStart`, `ChevEnd` (swap Left/Right based on `isRtl`) |
| `src/app/lessons/[lessonId]/page.tsx` | Added `dir={isRtl ? 'rtl' : 'ltr'}` on root container |
| `src/app/lessons/[lessonId]/page.tsx` | Removed all manual `flex-row-reverse` + `text-right` workarounds — `dir` on root auto-flips flex row direction |
| `src/app/lessons/[lessonId]/page.tsx` | Highlight border uses `isRtl ? 'border-r-2 pr-3' : 'border-l-2 pl-3'` (logical side) |
| `src/app/lessons/[lessonId]/page.tsx` | Sidebar page number spacing: `mr-2`/`ml-2` conditional on `isRtl` |

### 11.4 Practice Page — RTL Support

| File | Change |
|------|--------|
| `src/app/(protected)/practice/page.tsx` | Added `isRtl = language === 'ar'` |
| `src/app/(protected)/practice/page.tsx` | Added `ChevDir = isRtl ? ChevronLeft : ChevronRight` |
| `src/app/(protected)/practice/page.tsx` | Added `dir={isRtl ? 'rtl' : 'ltr'}` on root container |
| `src/app/(protected)/practice/page.tsx` | Fixed `mr-4` → conditional margin on progress bar icon |
| `src/app/(protected)/practice/page.tsx` | Fixed `ml-4` → conditional margin on retry button |
| `src/app/(protected)/practice/page.tsx` | Category card arrow: `ChevronRight` → `ChevDir` |
| `src/app/(protected)/practice/page.tsx` | Added `ChevronLeft` to lucide imports |

### 11.5 Exam Pre-Start Page — Missing Translations (14 keys)

All user-visible strings on the `/exam` pre-start screen were hardcoded English literals. All 4 language files updated.

| Key | EN | AR |
|-----|----|----|
| `exam.rules.before_you_begin` | Before You Begin | قبل أن تبدأ |
| `exam.rules.important_notes` | Important Notes | ملاحظات مهمة |
| `exam.rules.note_stable_internet` | Make sure you have a stable internet connection | تأكد من اتصال إنترنت مستقر |
| `exam.rules.note_no_refresh` | Do not refresh or close this browser tab during the exam | لا تنعش أو تغلق علامة التبويب هذه أثناء الامتحان |
| `exam.rules.note_close_apps` | Close other apps or tabs that might interfere | أغلق التطبيقات أو علامات التبويب الأخرى |
| `exam.rules.note_once_per_session` | You can only start this exam once per session | يمكنك بدء هذا الامتحان مرة واحدة فقط لكل جلسة |
| `exam.rules.content.totalQuestions` | Total questions description | — |
| `exam.rules.content.timeLimit` | Time limit description | — |
| `exam.rules.content.passScore` | Pass score description | — |
| `exam.rules.content.navigation` | Navigation rule description | — |
| `exam.rules.content.submission` | Submission rule description | — |
| `exam.rules.content.autoSubmit` | Auto-submit rule description | — |
| `exam.cancel` | Cancel | إلغاء |
| `exam.starting` | Starting... | جارٍ البدء... |

**Files updated:** `src/messages/en.json`, `src/messages/ar.json`, `src/messages/nl.json`, `src/messages/fr.json`

### 11.6 Exam Pre-Start Page — RTL Support + Hardcoded Strings Replaced

| File | Change |
|------|--------|
| `src/app/(protected)/exam/page.tsx` | Changed `RuleItem` interface: removed `content: () => ReactNode` → added `key: string` (descriptions via `t('exam.rules.content.{key}')`) |
| `src/app/(protected)/exam/page.tsx` | Changed `NoteItem` interface: removed `text: string` → added `noteKey: string` (texts via `t('exam.rules.{noteKey}')`) |
| `src/app/(protected)/exam/page.tsx` | Added `isRtl = language === 'ar'` |
| `src/app/(protected)/exam/page.tsx` | Added `ArrowBack = isRtl ? ArrowRight : ArrowLeft` |
| `src/app/(protected)/exam/page.tsx` | Added `dir={isRtl ? 'rtl' : 'ltr'}` on root container |
| `src/app/(protected)/exam/page.tsx` | `ms-auto` instead of `ml-auto` on number badge (CSS logical property) |
| `src/app/(protected)/exam/page.tsx` | All 14 hardcoded English strings replaced with `t()` calls |
| `src/app/(protected)/exam/page.tsx` | Added `ArrowRight` to lucide imports |

### 11.7 Exam Pre-Start Page — Button DOM Order Fix (RTL)

**Problem:** With `dir="rtl"`, the flex row reverses visually. Cancel was first in DOM → appeared on the **right**. Start Exam was second → appeared on the **left**. Wrong visual order for RTL.

**Fix:** Swapped DOM order — Start Exam is now **first** in DOM, Cancel is **second**.

| Layout | DOM order | Visual result |
|--------|-----------|---------------|
| LTR | Start Exam → Cancel | Start on left, Cancel on right |
| RTL (`dir="rtl"`) | (same DOM, flex reverses) | Start on **right** ✅, Cancel on **left** ✅ |

| File | Change |
|------|--------|
| `src/app/(protected)/exam/page.tsx` | Moved Start Exam `<Button>` before Cancel `<Button>` in JSX (~line 237) |

---

## 12. CHANGES LOG — 2026-03-07 (Session 6: Auth Pages Redesign + Register Validation)

### 12.1 Overview

Three auth pages (Register, Login, Forgot-password) were redesigned from a basic centered card layout to a modern **two-panel split layout**:
- **Left panel**: Orange gradient background with logo, headline, 4 feature/recovery bullets, social proof row, and a short quote. Hidden below `lg` breakpoint.
- **Right panel**: Clean white/neutral form area with the actual form widget centered.

This is consistent across all three auth pages. The actual logo (`/images/logo.png`) is displayed in both panels (64×64 on desktop left panel, 48×48 on mobile top).

### 12.2 Register Page (`src/app/(auth)/register/page.tsx`)

**Full rewrite** — two-panel layout + complete client-side validation.

| Area | Change |
|------|--------|
| Layout | Single centered card → two-panel split (orange left + form right) |
| Logo | "R" box placeholder → actual `/images/logo.png` (64×64 left panel, 48×48 mobile) |
| Left panel | Headline "Start your journey to the road" + 4 feature bullets + social proof ("10,000+ students") + quote |
| Validation | `validateField()` per-field function covering: firstName, lastName, username, email, password, confirmPassword |
| `handleBlur` | Triggers `validateField` on field exit — shows errors only after user leaves the field |
| `handleChange` | Clears error on any keystroke; re-validates password-match on confirmPassword change |
| `validateAll()` | Full validation before submit — blocks API call if any field fails |
| `inputCls(field, ok?)` | Returns Tailwind border+ring classes: red on error, green on valid, gray on untouched. Adds `pr-10` when `ok=true` (space for green checkmark icon). |
| Password rules bar | 5 inline rules with icons: length ≥8, uppercase, lowercase, number, special char. Icons green (CheckCircle2) when satisfied, gray (XCircle) when not. |
| Green check icons | `CheckCircle2` shown inside input on right edge for firstName, lastName, username, email when field is valid |
| Backend error mapping | `data.fields` object → per-field error messages. Username/email conflict detected via regex on `data.message` as fallback. |
| i18n | All strings use `t()` translation keys |

### 12.3 Login Page (`src/app/(auth)/login/page.tsx`)

**Full rewrite** — two-panel layout, matching register design.

| Area | Change |
|------|--------|
| Layout | Single centered card → two-panel split |
| Left panel | Headline "Continue your journey to the road" + 4 bullets (multilingual, AI, offline, progress) + social proof + quote |
| Fallback loader | Was showing a plain "R" box → now uses `<Image src="/images/logo.png">` |
| `Suspense` | Wrapped in `Suspense` for `useSearchParams()` — fallback uses logo not text |

### 12.4 Forgot-Password Page (`src/app/(auth)/forgot-password/page.tsx`)

**Full rewrite** — two-panel layout, recovery theme.

| Area | Change |
|------|--------|
| Layout | Single centered card → two-panel split |
| Left panel | Headline "Back on track in seconds" + 4 recovery-themed bullets + social proof + quote |
| Success state | Green `CheckCircle2` circle (48×48) + translated title/description — no plain text |
| Email validation | Added regex check (`EMAIL_RE.test(email)`) before calling the API — prevents sending empty/invalid email |

### 12.5 `utils.ts` — PASSWORD_RE + JSDoc Fix

| Change | Detail |
|--------|--------|
| `PASSWORD_RE` updated | Old regex lacked special character requirement. New: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/` |
| JSDoc fixed | `isValidPassword()` JSDoc was outdated — now accurately lists all 5 requirements including "1 special character" |

### 12.6 `RegisterRequest.java` — Backend Validation Strengthened

| Field | Annotations Added |
|-------|------------------|
| `username` | `@Size(min=4, max=20)` + `@Pattern(regexp="^[a-zA-Z0-9_]+$", message="Username can only contain letters, numbers, and underscores")` |
| `password` | `@Size(min=8)` + `@Pattern` requiring uppercase + lowercase + number + special char |

These server-side constraints mirror the frontend rules, providing defense-in-depth.

### 12.7 Deep Audit — 4 Bugs Fixed (Post-Implementation)

After all three auth pages were implemented, a full audit was run. Four issues found and fixed:

| # | Bug | File | Fix |
|---|-----|------|-----|
| 1 | `inputCls` called without second arg on firstName/lastName/username/email → `pr-10` never applied → green CheckCircle2 icons overlapped text | `register/page.tsx` | Changed `inputCls(field)` → `inputCls(field, isValid(field))` for all 4 name/email inputs |
| 2 | No email format validation before API call on forgot-password | `forgot-password/page.tsx` | Added `EMAIL_RE.test(email)` guard before `requestPasswordReset()` |
| 3 | Social proof block missing from forgot-password left panel | `forgot-password/page.tsx` | Added social proof row (users icon + "10,000+ students" text) matching register/login panels |
| 4 | JSDoc on `isValidPassword` still listed only 4 requirements (missing special char) | `utils.ts` | Updated JSDoc to list all 5 requirements |

---

## 13. CHANGES LOG — 2026-03-08 (Session 7: Navbar Overhaul + Brand Enhancement)

### 13.1 Navbar — Flat Navigation (No More "More" Dropdown)

**File:** `src/components/layout/navbar.tsx`

**Problem:** Previous navbar had a "More" dropdown for secondary nav items, hiding important links. Only a subset of pages were directly visible.

**Solution:** All 7 nav items displayed flat in a single horizontal row.

| Before | After |
|--------|-------|
| Primary: Home, Dashboard, Lessons, Practice + "More" dropdown | Flat: Home → Dashboard → Lessons → Practice → Exam → Traffic Signs → Analytics |
| "More" contained: Exam, Traffic Signs, Profile, Analytics | "More" dropdown removed entirely |
| Profile link in nav | Profile removed from nav (accessible via user avatar dropdown) |
| Underline active style | **Pill active style**: `bg-primary text-primary-foreground rounded-md shadow-sm shadow-primary/20` |

**Dead code removed:**
- `PRIMARY_NAV` constant
- `SECONDARY_NAV` constant
- `ALL_NAV` constant
- `isSecondaryNavActive()` function
- `BarChart3` lucide import (unused after cleanup)

**New `NAV_ITEMS` constant:**
```typescript
const NAV_ITEMS = [
  { name: 'nav.home',          href: '/'                         },
  { name: 'nav.dashboard',     href: ROUTES.DASHBOARD            },
  { name: 'nav.lessons',       href: ROUTES.LESSONS              },
  { name: 'nav.practice',      href: ROUTES.PRACTICE             },
  { name: 'nav.exam',          href: ROUTES.EXAM                 },
  { name: 'nav.traffic_signs', href: ROUTES.TRAFFIC_SIGNS        },
  { name: 'nav.analytics',     href: ROUTES.ANALYTICS_WEAK_AREAS },
] as const;
```

**New `NavLink` component:**
```jsx
function NavLink({ href, label, pathname }) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return (
    <Link href={href} className={cn(
      'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 whitespace-nowrap',
      isActive
        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    )}>
      {label}
    </Link>
  );
}
```

### 13.2 Navbar — Brand Enlargement + Split-Color Wordmark

| Element | Before | After |
|---------|--------|-------|
| Logo size | `width={32} height={32}` | `width={40} height={40}` |
| Logo border radius | `rounded-md` | `rounded-xl` |
| Brand gap | `gap-2` | `gap-3` |
| Brand font size | `text-lg` | `text-2xl` |
| Brand font weight | `font-black` | `font-black` (unchanged) |
| Brand color | `text-foreground` (plain dark) | Split-color: **R** = `text-primary` (orange), **eady** = `text-foreground`, **R** = `text-primary`, **oad** = `text-foreground` |
| Brand tracking | none | `tracking-tight` |

**Resulting JSX:**
```jsx
<Link href="/" className="flex shrink-0 items-center gap-3">
  <Image src="/images/logo.png" alt="ReadyRoad Logo" width={40} height={40} className="rounded-xl" />
  <span className="text-2xl font-black tracking-tight">
    <span className="text-primary">R</span><span className="text-foreground">eady</span><span className="text-primary">R</span><span className="text-foreground">oad</span>
  </span>
</Link>
```

### 13.3 Navbar — Language Selector Button Fix

| Before | After |
|--------|-------|
| `h-9 w-9 p-0` — fixed-size square, text cramped | `h-9 min-w-[2.75rem] px-2.5 text-sm font-semibold` — comfortable pill, text legible |
| `<span className="text-base">{flag}</span>` inner span | Flag text rendered directly in Button with proper sizing |

> Note: `LANGUAGES` constant uses 2-letter text codes (`'En'`, `'Ar'`, `'Nl'`, `'Fr'`) as "flags" (not emoji). This is intentional design.

### 13.4 Navbar — Search Box Width

| Before | After |
|--------|-------|
| `w-48` (192px) | `w-52` (208px) |

Increased for better visual balance against the expanded 7-item nav and larger brand.

### 13.5 Summary of All Navbar Changes (navbar.tsx)

| Change | Location |
|--------|----------|
| `NAV_ITEMS` array — 7 flat items | Replaces `PRIMARY_NAV` + `SECONDARY_NAV` |
| `NavLink` component — pill active style | Replaces underline active style |
| "More" dropdown removed | ~60 lines removed |
| Profile removed from nav | Was in secondary nav |
| Brand logo: `32→40`, `rounded-md→rounded-xl` | `<Image>` tag |
| Brand gap: `gap-2→gap-3` | `<Link>` className |
| Brand wordmark: `text-lg→text-2xl`, split-color `R`/`eady`/`R`/`oad` | `<span>` inside brand Link |
| Language button: `h-9 w-9 p-0` → `h-9 min-w-[2.75rem] px-2.5 text-sm font-semibold` | DropdownMenuTrigger Button |
| Search: `w-48→w-52` | Search input className |
| Dead code removed: `PRIMARY_NAV`, `SECONDARY_NAV`, `ALL_NAV`, `isSecondaryNavActive`, `BarChart3` | Top of file + function declarations |

---

## 14. CHANGES LOG — 2026-03-09 (Session 8: i18n Unification, Auth UX Fixes, SQL Cleanup, Docker)

### 14.1 i18n Audit — Auth Pages (57 keys)

All three auth pages (`/login`, `/register`, `/forgot-password`) had hardcoded English strings.  
A full audit was run and **57 new translation keys** were added to all 4 language files.

| File | Keys Added |
|------|-----------|
| `src/messages/en.json` | 57 keys |
| `src/messages/ar.json` | 57 keys (Arabic) |
| `src/messages/nl.json` | 57 keys (Dutch) |
| `src/messages/fr.json` | 57 keys (Dutch) |

**Key groups added:**

| Prefix | Count | Description |
|--------|-------|-------------|
| `auth.login_panel_*` | 9 | Left panel: badge, heading, heading2, subtitle, feat_1–4 |
| `auth.register_panel_*` | 8 | Left panel: badge, heading, heading2, subtitle, feat_1–3 |
| `auth.forgot_panel_*` | 9 | Left panel: badge, heading, heading2, subtitle, feat_1–4 |
| `auth.login_form_subtitle` | 1 | Form subtitle under login heading |
| `auth.register_title/subtitle/failed` | 3 | Register form heading/subtitle/error |
| `auth.forgot_email_invalid` | 1 | Inline email validation error |
| `auth.or`, `auth.copyright` | 2 | Shared "or" separator, copyright footer |
| `auth.panel_*` | 3 | Shared: learners_text, quote_text, quote_author |
| `auth.validation.*` | 14 | Per-field validation messages for all register inputs |
| `auth.pw_rule_*` | 5 | Password rule labels (length, upper, lower, number, special) |
| `auth.passwords_match` | 1 | "Passwords match" indicator |

**Files updated:**
- `src/app/(auth)/login/page.tsx` — all hardcoded strings → `t()` calls
- `src/app/(auth)/register/page.tsx` — all hardcoded strings → `t()` calls; `validateField()` now accepts `t` as 4th parameter
- `src/app/(auth)/forgot-password/page.tsx` — all hardcoded strings → `t()`, broken `t('validation.required')` → `t('auth.validation.email_required')`

### 14.2 i18n Unification — contact/page.tsx (21 keys)

`contact/page.tsx` was using an inline `LABELS` object with all 4 languages hardcoded inside the component.  
Migrated to the unified `t()` + message JSON files approach.

| Change | Detail |
|--------|--------|
| Removed `const LABELS = { en: {...}, nl: {...}, fr: {...}, ar: {...} }` (~100 lines) | Inline translations deleted |
| Removed `type Lang = keyof typeof LABELS` | Unused type deleted |
| Removed `const lbl = LABELS[(language as Lang)] ?? LABELS.en` | Replaced with `const { t, isRTL } = useLanguage()` |
| All 21 `lbl.xxx` references | Replaced with `t('contact.xxx')` |
| 21 `contact.*` keys added to all 4 JSON files | `contact.title`, `contact.subtitle`, `contact.firstName`, `contact.lastName`, `contact.email`, `contact.subject`, `contact.message`, `contact.send`, `contact.sending`, `contact.successTitle`, `contact.successMsg`, `contact.errorTitle`, `contact.required`, `contact.invalidEmail`, `contact.minMessage`, `contact.placeholderFirst`, `contact.placeholderLast`, `contact.placeholderEmail`, `contact.placeholderSubject`, `contact.placeholderMsg`, `contact.direct` |

> **Note on `terms/page.tsx` and `privacy-policy/page.tsx`:** These pages use `content[language].sections[]` — a structured content array with titles and long multilingual paragraphs. This approach is intentionally kept as-is because JSON keys are not appropriate for large document-style content with nested arrays.

### 14.3 nl.json Bug Fix

A stray extra `}` was found at the end of `src/messages/nl.json` causing invalid JSON.

| File | Fix |
|------|-----|
| `src/messages/nl.json` | Removed duplicate closing brace after `auth.validation.email_registered` |

### 14.4 Login Page — UX Improvements

| Change | Detail |
|--------|--------|
| "Forgot password?" link moved | Was inline next to password label → now **below Sign In button** as a standalone centered row |
| Added `KeyRound` icon | Lucide icon displayed left of "Forgot password?" link |
| Link styling upgraded | `text-xs text-primary` → `text-sm text-muted-foreground hover:text-primary font-medium` with underline on hover |
| Login heading subtitle | `{t('auth.login_form_subtitle')} 🚗` → emoji removed, replaced with decorative `inline-block w-6 h-0.5 bg-primary/60` accent bar before text |
| Added `KeyRound` to lucide imports | `import { ..., KeyRound, ... }` |

### 14.5 SQL Files Cleanup

All `.sql` files that were in the project root were moved to the correct migration folder.

| File | From | To |
|------|------|----|
| `add_questions.sql` | `readyroad/` (root) | `readyroad/src/main/resources/db/migration/` |
| `add_options.sql` | `readyroad/` (root) | `readyroad/src/main/resources/db/migration/` |

> These files contain `INSERT` statements for quiz questions and answer options. They are intentionally named **without** the `V##__` Flyway prefix so Flyway ignores them (prevents duplicate data insertion on re-deploy).

**Verification:** `Get-ChildItem -Recurse -Filter "*.sql" | Where-Object DirectoryName -notlike "*db\migration*"` → **0 results** ✅

### 14.6 Docker Configuration Summary (Verified)

All 3 containers confirmed running (**green** in Docker Desktop):

| Container | Image | Port | Status |
|-----------|-------|------|--------|
| `readyroad-mysql` | `mysql:8.0` | 3307→3306 | ✅ Running |
| `readyroad-backend` | `readyroad-backend` | 8890→8890 | ✅ Running |
| `readyroad-frontend` | `readyroad-frontend` | 3000→3000 | ✅ Running |

**Key networking note:**
- When running via **Docker** (all 3 containers): frontend uses `BACKEND_URL=http://backend:8890/api` (internal Docker network)
- When running **Next.js locally** (`npm run dev`) + Docker backend: frontend uses `BACKEND_URL=http://localhost:8890/api` from `.env.local`
- The two modes are **not interchangeable** — choose one

### 14.7 .env.local Verification

| Variable | Value | Used By | Status |
|----------|-------|---------|--------|
| `SMTP_USER` | `heydertarek2000@gmail.com` | `api/contact/route.ts` | ✅ Correct |
| `SMTP_PASS` | `sbkbntbnblijiuxn` (App Password) | `api/contact/route.ts` | ✅ Correct |
| `CONTACT_TO` | `heydertarek2000@gmail.com` | `api/contact/route.ts` | ✅ Correct |
| `BACKEND_URL` | `http://localhost:8890/api` | `lib/server/auth.ts` | ✅ Correct (local dev mode) |

> `.env.local` is in `.gitignore` (`.env*` pattern) — credentials are not exposed to Git ✅

---

## 15. CHANGES LOG — 2026-03-10 (Session 9: Auth Modals, Logout Modal, i18n Flash Fix)

### 15.1 New Component — AuthSuccessModal

**File:** `src/components/ui/auth-success-modal.tsx` ← NEW

A centered overlay modal that replaces the previous `toast.custom()` welcome notification after login and register.

| Property | Value |
|----------|-------|
| Rendering | `createPortal(…, document.body)` — mounts outside React tree |
| Backdrop | Fixed overlay with `authOverlayIn 0.3s ease` fade |
| Card animation | `authModalIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)` (spring bounce) |
| Header | Orange gradient `135deg, hsl(13 76% 53%) → hsl(25 95% 50%)` |
| Icon area | White circle 104px, `mb-[-58px]` overlap pulled onto body, `pt-[72px]` body top padding |
| SVG checkmark | Emerald ring (`authCircleDraw 0.55s`), check stroke (`authCheckDraw 0.3s`), pulse ring (`authPulse 2s infinite`) |
| Username text | Gradient `hsl(13 76% 53%) → hsl(25 95% 50%)` applied via `background-clip: text` |
| Progress bar | Orange, ticks every `TICK_MS = 30ms` over `REDIRECT_DELAY_MS = 3200ms` |
| Redirect | `onRedirect()` callback fires when countdown reaches 0 |

**Two display scenarios:**

| Scenario | Title key | Subtitle key |
|----------|-----------|-------------|
| Login | `auth.modal.welcome_back` | `auth.modal.login_subtitle` |
| Register (`isNewUser: true`) | `auth.modal.thank_you` | `auth.modal.register_subtitle` |

**Props:** `isOpen`, `username`, `title`, `subtitle`, `redirectingText`, `onRedirect`

---

### 15.2 New Component — LogoutModal

**File:** `src/components/ui/logout-modal.tsx` ← NEW

A centered overlay modal displayed when the user logs out, replacing the previous `toast.info()` notification.

| Property | Value |
|----------|-------|
| Rendering | `createPortal(…, document.body)` |
| Header | Dark navy gradient `hsl(210 29% 30%) → hsl(215 40% 14%)` |
| Icon | White circle with door-frame SVG path + exit arrow (orange stroke, sequential animation) |
| Username text | Navy gradient `hsl(210 29% 24%) → hsl(215 40% 35%)` via `background-clip: text` |
| Progress bar | Navy gradient `hsl(210 29% 35%) → hsl(210 40% 50%)` |
| Countdown | `REDIRECT_DELAY_MS = 2500ms` |
| Redirect destination | `ROUTES.LOGIN` |

---

### 15.3 auth-context.tsx — Major Update

**File:** `src/contexts/auth-context.tsx` ← MODIFIED

| Change | Detail |
|--------|--------|
| Removed imports | `import { toast }` from sonner, `import { WelcomeToastContent }` |
| Added imports | `import { AuthSuccessModal }`, `import { LogoutModal }` |
| New interface | `LoginOptions { isNewUser?: boolean }` |
| New interface | `SuccessModalState { open, username, isNewUser, redirectPath }` |
| New interface | `LogoutModalState { open, username }` |
| `login()` signature | `(credentials, redirectPath?, options?: LoginOptions) => Promise<LoginResult>` |
| `login()` on success | Sets `successModal` state (open: true, username, isNewUser, redirectPath) — no more `toast.custom()` or `window.location.href` inside login |
| `logout()` behavior | Saves `displayName` from `user` BEFORE calling `clearAuth()`, then sets `logoutModal` state — no more `toast.info()` or `window.location.href` |
| Provider JSX | Both `<AuthSuccessModal>` and `<LogoutModal>` rendered inside Provider after `{children}` |
| `onRedirect` (login) | `() => { window.location.href = successModal.redirectPath; }` |
| `onRedirect` (logout) | `() => { window.location.href = ROUTES.LOGIN; }` |

---

### 15.4 register/page.tsx — isNewUser Flag

**File:** `src/app/(auth)/register/page.tsx` ← MODIFIED

```ts
// Before:
login({ username, password })

// After:
login({ username, password }, ROUTES.DASHBOARD, { isNewUser: true })
```

This causes the modal to display `auth.modal.thank_you` ("Thank you, X!") instead of `auth.modal.welcome_back` ("Welcome back, X!") for new registrations.

---

### 15.5 language-context.tsx — i18n Flash Fix

**File:** `src/contexts/language-context.tsx` ← COMPLETELY REWRITTEN

**Problem:** On page load and route navigation, translation keys like `nav.dashboard` appeared as raw strings for a brief moment before resolving to their translated values.

**Root cause:**
```ts
// OLD (broken) pattern:
const [translations, setTranslations] = useState({});  // starts empty
useEffect(() => {
  import(`@/messages/${language}.json`).then(setTranslations); // async — arrives late
}, [language]);
// render #1: translations = {} → t('nav.dashboard') returns 'nav.dashboard' ← FLASH
```

**Fix:**
```ts
// NEW (fixed) pattern:
import enMessages from '@/messages/en.json';  // static — bundled at compile time
import arMessages from '@/messages/ar.json';
import nlMessages from '@/messages/nl.json';
import frMessages from '@/messages/fr.json';

const ALL_MESSAGES = { en: enMessages, ar: arMessages, nl: nlMessages, fr: frMessages };

const [language, setLanguageState] = useState<Language>(() => getInitialLanguage()); // lazy init reads localStorage
const translations = ALL_MESSAGES[language]; // synchronous — always populated
// render #1: translations already full → t('nav.dashboard') = 'Dashboard' ✓
```

| Change | Detail |
|--------|--------|
| Removed | `loadTranslations()` async function |
| Removed | `readStoredLanguage()` helper |
| Removed | `useState<{}>({})` initial empty translations state |
| Added | 4 static `import` statements at file top |
| Added | `ALL_MESSAGES` constant map |
| Added | `getInitialLanguage()` — reads `localStorage` inside `useState` lazy initializer |
| `useEffect` | Now only syncs `document.documentElement.lang` and `dir` attributes — no async work |
| `translations` | Derived synchronously: `const translations = ALL_MESSAGES[language]` |

---

### 15.6 globals.css — New Keyframes

**File:** `src/app/globals.css` ← MODIFIED

6 new CSS `@keyframes` blocks added:

| Name | Purpose |
|------|---------|
| `welcomeSlideIn` | Toast/notification slide-up with blur |
| `authOverlayIn` | Modal backdrop opacity fade-in |
| `authModalIn` | Modal card scale + translateY spring entrance |
| `authCircleDraw` | SVG circle ring stroke-dashoffset draw |
| `authCheckDraw` | SVG checkmark stroke-dashoffset draw |
| `authPulse` | SVG pulse ring scale + opacity loop |

---

### 15.7 Translation Keys — 9 New Keys × 4 Languages

**Files:** `src/messages/en.json`, `ar.json`, `nl.json`, `fr.json` ← ALL MODIFIED

| Key | en value |
|-----|----------|
| `auth.toast.welcome_subtitle` | "Ready to hit the road?" |
| `auth.modal.welcome_back` | "Welcome back," |
| `auth.modal.login_subtitle` | "Login successful. Ready to go!" |
| `auth.modal.thank_you` | "Thank you," |
| `auth.modal.register_subtitle` | "You're now a member of ReadyRoad!" |
| `auth.modal.redirecting` | "Taking you to your dashboard…" |
| `auth.modal.goodbye` | "Goodbye," |
| `auth.modal.logout_subtitle` | "You have been signed out successfully." |
| `auth.modal.logout_redirecting` | "Redirecting to login…" |

**Bug fixed:** `src/messages/fr.json` had a duplicate `auth.modal.*` block (lines 79–83 were exact duplicates of 74–78). The duplicate block was removed using a PowerShell repair script.

---

### 15.8 layout.tsx — Toaster Position

**File:** `src/app/layout.tsx` ← MODIFIED

| Before | After |
|--------|-------|
| `<Toaster position="top-right" richColors />` | `<Toaster position="bottom-right" richColors />` |

Moved to bottom-right so Sonner toasts no longer conflict visually with the top-center auth modals.

---

### 15.9 Deprecated — welcome-toast.tsx

**File:** `src/components/ui/welcome-toast.tsx` — Created earlier in the session, now unused.

`auth-context.tsx` no longer imports or calls `WelcomeToastContent`. The component still exists on disk but is effectively superseded by `auth-success-modal.tsx`. Can be removed in a future cleanup pass.

---

### 15.10 Summary of All Session 9 Changes

| File | Type | Description |
|------|------|-------------|
| `src/components/ui/auth-success-modal.tsx` | NEW | Login & register success modal with animated checkmark |
| `src/components/ui/logout-modal.tsx` | NEW | Logout farewell modal with door icon |
| `src/components/ui/welcome-toast.tsx` | NEW (unused) | Welcome toast — superseded; kept on disk |
| `src/contexts/auth-context.tsx` | MODIFIED | Replaced toast calls with modal state + renders both modals |
| `src/contexts/language-context.tsx` | REWRITTEN | Static imports fix eliminates i18n flash on render |
| `src/app/(auth)/register/page.tsx` | MODIFIED | Passes `{ isNewUser: true }` to login() |
| `src/app/layout.tsx` | MODIFIED | Toaster position top-right → bottom-right |
| `src/app/globals.css` | MODIFIED | 6 new CSS keyframe animations added |
| `src/messages/en.json` | MODIFIED | 9 new `auth.modal.*` + `auth.toast.*` keys |
| `src/messages/ar.json` | MODIFIED | Same 9 keys in Arabic |
| `src/messages/nl.json` | MODIFIED | Same 9 keys in Dutch |
| `src/messages/fr.json` | MODIFIED | Same 9 keys in French + duplicate block bug fix |

