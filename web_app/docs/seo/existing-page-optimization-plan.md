# Existing Page Optimization Plan

Reviewed: 21 July 2026

## Inventory and coverage

| Page family | URLs | Current intent | Primary opportunity | Implementation |
|---|---:|---|---|---|
| Home | 1 | Product discovery and exam preparation | General Belgian category B theory preparation | P0 Metadata and H1 alignment |
| Traffic-sign index | 1 | Sign lookup and browsing | Belgian traffic signs and meanings | P0 localized Metadata and introductory copy |
| Traffic-sign details | 184 | One sign's meaning and driver response | Sign code plus localized sign name | P1 localized canonical Metadata and JSON-LD |
| Lesson index | 1 | Structured theory study | Belgian category B theory lessons | P0 localized Metadata and H1 alignment |
| Lesson details | 30 | Topic education | One governed Belgian driving-rule topic | P1 localized canonical Metadata and JSON-LD |
| About | 1 | Trust and brand | ReadyRoad identity and independent status | No change required |
| FAQ | 1 | Product and learning support | Real user questions about access, languages, and practice | Current copy retained; no legal expansion |
| Contact | 1 | Support | ReadyRoad contact and correction reports | No change required |
| Privacy / cookies / terms / disclaimer | 4 | Legal and navigational | Branded legal-document queries | No keyword optimization required |

Coverage: **224 of 224 indexable URLs**. Dynamic page rules in `keyword-map.json` make the mapping deterministic from the two public catalogs.

## Current structure summary

### Home `/`

- Current language behavior: server Metadata follows the `readyroad_locale` cookie; the same canonical URL is used in all languages.
- Current H1 before Milestone 7: success-led phrasing such as “Pass Your Belgian Driving Test With Confidence”.
- H2 structure: product capabilities, learning flow, categories, practice CTA, contact CTA.
- Existing links: traffic signs, lessons, registration, exam/practice tools, FAQ and legal pages through navigation/footer.
- Structured data: Organization, WebSite, SoftwareApplication.
- Implemented: changed the H1 and Metadata to preparation-led, category-B-relevant wording without guaranteeing success.

### Traffic signs `/traffic-signs`

- Current H1: localized “Belgian Traffic Signs”.
- H2 structure: eight sign families and empty-result state.
- Existing links: 184 detail links remain crawlable through the complete accessible index; category filters retain the same URL with query parameters.
- Structured data: inherited WebSite entities; detail pages add LearningResource and BreadcrumbList.
- Implemented: localized Metadata, natural “meaning/explanation” terminology, removal of “official library” wording, no progressive-rendering change.

### Sign details `/traffic-signs/{signCode}`

- Current H1: canonical localized sign name.
- H2 structure: guidance, exceptions when present, and learning actions.
- Existing links: sign index, practice, exam, breadcrumbs.
- Implemented: localized title, description, Open Graph, Twitter, breadcrumb labels, and LearningResource text using existing canonical fields only.
- Not changed: `sign.json`, legal meaning, summary, description, guidance, exceptions, images, URL, or API.

### Lessons `/lessons`

- Current H1 before Milestone 7: generic “Driving Theory Lessons”.
- H2 structure: collection heading; each lesson card links to its detail URL.
- Existing links: all 30 lessons, search/reset controls, navigation/footer.
- Implemented: localized Metadata and category-B-focused H1/subtitle using the existing page only.

### Lesson details `/lessons/{lessonCode}`

- Current H1: governed localized lesson title.
- H2 structure: active page title and key takeaways from governed lesson data.
- Existing links: lessons index, previous lesson, next lesson.
- Implemented: localized Metadata, breadcrumbs, and LearningResource text using existing lesson fields only.
- Not changed: lesson content or legal claims.

### About, FAQ, Contact and legal pages

- Metadata and visible copy already change with the selected language.
- H1 and H2 structures match their navigational, support, or legal intent.
- PublicPage, BreadcrumbList, and FAQPage schemas were validated in Milestone 6.
- No P0/P1 keyword change was justified. Legal pages are intentionally not used to target exam-preparation keywords.

## Title and description policy

- One primary intent per page family.
- Brand appears once, normally at the end of a title.
- Dynamic pages use the canonical localized name instead of generated keyword lists.
- Descriptions describe the existing page and contain no guarantee, official affiliation, or invented exam equivalence.
- The production canonical is `https://rijvia.be`.

## H2 recommendations not implemented

No new sections were added. The existing headings already reflect the available content. Future heading changes that introduce new legal explanations require Content Governance review.

## Pages requiring no change

`/about`, `/faq`, `/contact`, `/privacy-policy`, `/cookie-policy`, `/terms`, and `/disclaimer` require no Milestone 7 copy change. They remain mapped for branded, support, and legal intent.
