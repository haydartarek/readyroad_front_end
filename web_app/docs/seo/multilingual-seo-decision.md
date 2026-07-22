# Multilingual SEO Decision

Reviewed: 21 July 2026

## Current architecture

ReadyRoad serves English, Dutch, French, and Arabic on the same URL. The selected locale is stored in the `readyroad_locale` cookie and the server uses that value for initial HTML and Metadata. Canonical URLs are language-neutral.

## Implemented strategy

- Keep one canonical URL per page.
- Generate localized titles, descriptions, Open Graph text, Twitter text, breadcrumb labels, and LearningResource text from the server-selected locale.
- Keep canonical sign and lesson fields as the source of dynamic Metadata.
- Keep Arabic `lang="ar"` and `dir="rtl"`; use LTR for EN, NL, and FR.
- Default uncookied crawlers to English.
- Do not create fake alternate-language URLs.

## Hreflang decision

**Hreflang is intentionally not implemented because localized URLs do not exist.**

Multiple `hreflang` values cannot point to the same canonical URL and truthfully represent distinct language pages. Paths such as `/ar`, `/nl`, `/fr`, and `/en` were not created.

## Limits of the shared-URL approach

- A crawler without the locale cookie primarily indexes the English representation.
- Search engines cannot reliably maintain four separately ranked language documents for one canonical URL.
- Localized Metadata improves consistency for users and locale-aware requests, but it is not equivalent to dedicated language URLs.
- Arabic search visibility may therefore underperform the quality of the Arabic content.

## Future recommendation, not implemented

A future approved migration could use stable locale-prefixed URLs with self-canonicals and reciprocal `hreflang`, while preserving redirects and avoiding duplicate content. That is an architecture and URL migration, not a Milestone 7 optimization.

Status: **NOT IMPLEMENTED / REQUIRES SEPARATE APPROVAL**.
