# ReadyRoad Active API Surface

Updated: 2026-03-25

This report intentionally lists only the active API families that are still part of the current project architecture.

Removed duplicate endpoint families are intentionally omitted from this report.

## Active learner-facing systems

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Categories

- `GET /api/categories`

### Traffic signs

- `GET /api/traffic-signs`
- `GET /api/traffic-signs/{signCode}`
- `GET /api/traffic-signs/search`
- `GET /api/traffic-signs/category/{categoryId}`

### Lessons

- `GET /api/lessons`
- `GET /api/lessons/{id}`
- `GET /api/lessons/category/{categoryId}`

### Practice questions by lesson

- `GET /api/practice-questions/{id}`
- `GET /api/practice-questions/lesson/{lessonId}`

### Theory-question bank

This is the active general question system used by the current learner exam and quiz flows.

- `GET /api/quiz/random`
- `GET /api/quiz/category/{categoryId}`
- `GET /api/quiz/stats`
- `GET /api/quiz/stats/category/{categoryId}`
- `GET /api/quiz/theory-exam`
- `POST /api/quiz/questions/{questionId}/answer`

### Exam simulation

- `POST /api/exams/simulations/start`
- `GET /api/exams/simulations/can-start`
- `GET /api/exams/simulations/active`
- `GET /api/exams/simulations/history`
- `GET /api/exams/simulations/{examId}`
- `POST /api/exams/simulations/{examId}/questions/{questionId}/answer`
- `POST /api/exams/simulations/{examId}/submit`
- `GET /api/exams/simulations/{examId}/results`

### Progress and analytics

- `GET /api/users/me`
- `GET /api/users/me/progress/overall`
- `GET /api/users/me/progress/categories`
- `GET /api/users/me/progress/recommendations`
- `GET /api/users/me/analytics/weak-areas`
- `GET /api/users/me/analytics/error-patterns`
- `GET /api/users/me/notifications/unread-count`

### Sign quiz system

This is the dedicated traffic-sign question system used by `/practice`, `/traffic-signs/[signCode]/practice`, and `/traffic-signs/[signCode]/exam/[examNumber]`.

- `GET /api/sign-quiz/signs`
- `GET /api/sign-quiz/categories`
- `GET /api/sign-quiz/user-progress`
- `POST /api/sign-quiz/practice/{signCode}`
- `GET /api/sign-quiz/practice/{sessionId}`
- `POST /api/sign-quiz/practice/{sessionId}/questions/{questionId}/answer`
- `GET /api/sign-quiz/practice/{sessionId}/results`
- `GET /api/sign-quiz/exam/{signCode}/{examNumber}`
- `POST /api/sign-quiz/exam/{signCode}/{examNumber}/submit`
- `GET /api/sign-quiz/random-practice`
- `POST /api/sign-quiz/random-practice/check`

### Assessment system

- `GET /api/assessment/categories`
- `GET /api/assessment/categories/{slug}/levels`
- `GET /api/assessment/categories/{slug}/levels/{level}`
- `POST /api/assessment/sessions`
- `POST /api/assessment/sessions/{sessionId}/answer`
- `POST /api/assessment/sessions/{sessionId}/complete`

## Admin-facing systems

### Admin theory-question management

- `GET /api/admin/quiz/questions`
- `GET /api/admin/quiz/questions/{id}`
- `POST /api/admin/quiz/questions`
- `PUT /api/admin/quiz/questions/{id}`
- `DELETE /api/admin/quiz/questions/{id}`
- `POST /api/admin/upload/image`

### Admin user management

- `GET /api/admin/users`
- `PUT /api/admin/users/{id}/role`
- `PUT /api/admin/users/{id}/lock`

### Admin data import

- `POST /api/admin/import`
- `POST /api/admin/sign-quiz/import`

## Health and diagnostics

- `GET /api/health`
- `GET /actuator/health`
- `GET /v3/api-docs`
- `GET /swagger-ui/index.html`

## Notes

- The project now uses one active general theory-question bank and one dedicated traffic-sign question bank.
- Old duplicate systems were removed to avoid conflicting behavior before deployment.

## Recent admin quiz fixes

### Admin quiz edit stability

The admin quiz edit flow for `PUT /api/admin/quiz/questions/{id}` was adjusted after runtime failures appeared on pages such as `/admin/quizzes/126/edit`.

Applied changes:

- Backend update logic in `readyroad/src/main/java/com/readyroad/readyroadbackend/service/AdminQuizService.java` was refactored so existing answer options are updated on the managed entity inside the transaction instead of relying on a merge-style save path.
- The option synchronization now temporarily moves existing `displayOrder` values, flushes, then reuses or removes option rows safely before the final flush.
- This removed the duplicate-key failure on `quiz_answer_options.uq_question_display_order` during question updates.
- The same backend change also avoided the follow-up validation state where the entity was temporarily seen as having `0` options during update.

### Admin breadcrumb fix

The admin breadcrumb behavior around dynamic quiz edit routes was also adjusted.

Applied changes:

- In `readyroad_front_end/web_app/src/lib/admin-routes.ts`, numeric route segments such as quiz IDs no longer produce breadcrumb links.
- In `readyroad_front_end/web_app/src/components/admin/AdminBreadcrumb.tsx`, breadcrumb items without an `href` are rendered as plain text instead of a clickable link.
- This prevents invalid requests such as `/admin/quizzes/126?_rsc=...` from being generated by the breadcrumb trail.

### Verification outcome

- Backend rebuild completed successfully after the changes.
- Direct authenticated retest of `PUT /api/admin/quiz/questions/126` returned `200 OK`.
- The updated response preserved the expected 3 answer options and confirmed that the save path is working again.

## Recent final exam cleanup

### Final exam explanation removal

The final theory exam flow was adjusted so multilingual explanation content is no longer exposed or edited in the final-exam path.

Applied changes:

- In the admin theory-question flow, the explanation block was removed from the quiz create/edit UI used for `/admin/quizzes` management.
- Backend admin mapping now clears `explanationEn`, `explanationAr`, `explanationNl`, and `explanationFr` when theory-bank questions are created or updated for this flow.
- `AdminQuizQuestionResponse` no longer returns explanation fields for `/api/admin/quiz/questions` and `/api/admin/quiz/questions/{id}`.
- `TheoryExamQuestionResultDTO` no longer includes explanation fields in the stateless final theory exam result payload returned by `POST /api/quiz/theory-exam/check`.

### Final exam results and dashboard alignment

The learner-facing final exam result flow was also cleaned so review screens show selected/correct answers only, without explanation text.

Applied changes:

- `GET /api/exams/simulations/{examId}/results` now remains focused on answer review data such as `allAnswers`, `incorrectQuestions`, category breakdown, timing, and score data without multilingual explanation fields.
- The protected final exam result pages under `/exam/results` and `/exam/results/{id}` were updated to rely on answer review data only.
- The learner dashboard was kept aligned with the final-exam-only requirement by loading only the latest exam-history item for the recent activity card.

### Cleanup and verification outcome

- Stale translation keys for the removed admin explanation section were deleted from the frontend locale files.
- Backend rebuild completed successfully after the final exam cleanup.
- Frontend rebuild completed successfully after the UI and translation cleanup.
- Live end-to-end verification with a fresh user confirmed that final exam payloads no longer expose `explanationEn`, `explanationAr`, `explanationNl`, or `explanationFr` in exam start, exam history, or final result review payloads.

## Recent admin reset feature removal

### Permanent removal status

The former admin maintenance feature behind `POST /api/admin/reset-test-data` was removed completely from the system.

Applied changes:

- The admin quizzes page no longer renders a reset button, confirmation modal, related translations, or any client-side call path for the removed feature.
- The backend controller endpoint was deleted, along with the supporting repository methods, entity fields, and schema-specific code that existed only for that operation.
- The old `is_test_data` schema support was removed from the live database, and the migration history was repaired so the active Flyway descriptions no longer reference the removed feature name.
- The active API surface list intentionally omits the removed route because it is no longer part of the deployable architecture.

### Live route verification

Direct live verification was performed after rebuild and redeploy.

- Anonymous `POST /api/admin/reset-test-data` now returns `401`, which confirms the admin security layer still applies to the `/api/admin/**` namespace.
- Authenticated admin `POST /api/admin/reset-test-data` now returns `404`, which confirms the route itself no longer exists in the deployed backend.
- This combination confirms that the feature was removed from the application layer rather than merely hidden in the UI.
