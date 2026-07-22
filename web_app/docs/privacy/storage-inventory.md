# ReadyRoad Cookie and Browser Storage Inventory

Last reviewed: 21 July 2026

| Name | Category | Type / location | Purpose | Duration | Party | Consent required | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `token` | Strictly Necessary | Secure HttpOnly cookie | Authenticated ReadyRoad session | Up to 7 days, earlier expiry, or logout | First-party | No | `src/lib/server/auth.ts` |
| `csrf_token` | Strictly Necessary | Cookie readable by the client | Double-submit CSRF protection for state-changing requests | Up to 7 days or logout | First-party | No | `src/lib/server/auth.ts` |
| `google_oauth_state` | Strictly Necessary | Secure HttpOnly cookie | Prevents OAuth request forgery during a user-requested Google sign-in | About 10 minutes or callback completion | First-party | No | `src/app/api/auth/google/start/route.ts` |
| `google_oauth_code_verifier` | Strictly Necessary | Secure HttpOnly cookie | PKCE verification for a user-requested Google sign-in | About 10 minutes or callback completion | First-party | No | `src/app/api/auth/google/start/route.ts` |
| `google_oauth_mode` | Strictly Necessary | Secure HttpOnly cookie | Preserves login or registration mode during OAuth | About 10 minutes or callback completion | First-party | No | `src/app/api/auth/google/start/route.ts` |
| `google_oauth_return_to` | Strictly Necessary | Secure HttpOnly cookie | Restores the requested ReadyRoad destination after OAuth | About 10 minutes or callback completion | First-party | No | `src/app/api/auth/google/start/route.ts` |
| `readyroad_locale` | Strictly Necessary | Cookie and local storage | Keeps the user-requested language consistent during server and client rendering | Up to 1 year or until cleared | First-party | No | `src/contexts/language-context.tsx` |
| `readyroad_cookie_consent` | Strictly Necessary | Local storage | Stores consent version, timestamp, and category choices; contains no personal data | Until the policy version changes or browser data is cleared | First-party | No | `src/lib/cookie-consent.ts` |
| `readyroad_theme` | Preferences | Local storage | Persists light or dark appearance after Preferences consent | Until withdrawn, changed, or cleared | First-party | Yes | `src/app/layout.tsx`, `src/components/layout/navbar.tsx` |
| `session_expired` | Strictly Necessary | Session storage | Shows the session-expired message once after authentication expires | Current browser tab session or first login-page read | First-party | No | `src/contexts/auth-context.tsx` |
| `current_exam` | Strictly Necessary | Local storage compatibility state | Reads and removes transient in-progress exam state used by the exam result flow | Removed when the exam completes or is invalid | First-party | No | `src/app/(protected)/exam/[id]/page.tsx` |

## Optional resources

- Analytics scripts, requests, and cookies: none currently installed.
- Marketing, advertising, retargeting, and profiling resources: none currently installed.
- Third-party embeds: none. Footer social links navigate only after an explicit click.
- IndexedDB usage: none.
- Authentication tokens in local storage: none.

Google Consent Mode v2 is initialized locally with all optional storage denied. It sends no Google request and has no Measurement ID. A future analytics integration must read the saved Analytics decision before loading any external resource.
