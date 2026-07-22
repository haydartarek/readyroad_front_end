# Internal Linking Plan

Reviewed: 21 July 2026

Only existing URLs are used.

| Source | Target | Recommended anchor concept | Context | Cluster | Priority | Status |
|---|---|---|---|---|---|---|
| `/` | `/traffic-signs` | Belgian traffic signs / localized equivalent | Main learning capabilities | Belgian traffic signs | P0 | Existing |
| `/` | `/lessons` | Belgian driving theory lessons | Main learning capabilities | Category B lessons | P0 | Existing |
| Footer | `/lessons/les-19` | Priority to the right / localized equivalent | Popular theory topics | Priority rules | P1 | Corrected |
| Footer | `/lessons/les-3` | Speed limits / localized equivalent | Popular theory topics | Speed limits | P1 | Existing |
| Footer | `/traffic-signs?category=B` | Priority signs / localized equivalent | Popular theory topics | Priority signs | P1 | Existing |
| `/traffic-signs` | `/traffic-signs/{signCode}` | Canonical sign name and code | Sign catalog and complete link index | Specific sign meaning | P0 | Existing for all 184 |
| `/traffic-signs/{signCode}` | `/traffic-signs` | All Belgian traffic signs | Breadcrumb and back action | Belgian traffic signs | P1 | Existing |
| `/lessons` | `/lessons/{lessonCode}` | Canonical lesson title | Lesson collection | Specific driving rule | P0 | Existing for all 30 |
| `/lessons/{lessonCode}` | `/lessons` | All driving theory lessons | Breadcrumb and back action | Category B lessons | P1 | Existing |
| `/lessons/{lessonCode}` | Adjacent lesson URLs | Canonical lesson title | Previous/next learning path | Topic progression | P1 | Existing |
| `/faq` | `/contact` | Contact ReadyRoad / localized equivalent | Unresolved support question | Support | P2 | Existing |
| Global footer | Public/legal pages | Natural page names | Site-wide discovery | Brand/legal | P2 | Existing |

## Anchor policy

- Use localized, user-readable labels rather than repeated exact-match SEO phrases.
- Sign links retain the canonical sign name and code.
- Lesson links retain governed titles.
- Avoid adding links solely for crawlers.
- Query-parameter category links support browsing but do not replace canonical index/detail URLs.

## Validation targets

```text
Orphan indexable pages: 0
Broken internal links: 0
Over-optimized anchors: 0
Exact-match repetition: minimized
New URLs: 0
```
