# Mandatory Execution Protocol

Treat the following plan as a mandatory execution protocol, not as optional guidance, suggestion, or preference.

You must execute all applicable instructions exactly as written for every non-trivial task, debugging session, bug report, code analysis, refactor, architectural change, verification flow, and implementation task.

Do not skip steps.  
Do not reorder steps unless the plan explicitly requires replanning.  
Do not weaken, compress, summarize, or reinterpret any instruction.  
Do not modify code before diagnosis is complete and the root cause is confirmed with high confidence.  
Do not mark any task as complete without verification evidence.  
Do not apply speculative fixes.  
Do not introduce unrelated changes.  
Do not use temporary, fragile, or hacky solutions when a correct root-cause fix is possible.

---

## Deep Diagnostic Map

### 0. Deep Test First

Perform a very strong deep test at the very beginning to diagnose the problem.

Run an extremely deep analysis to identify the real root cause of the issue before taking any action.

Assume worst-case scenarios so the final solution still works correctly under stress, edge cases, and failure conditions.

Analyze the problem completely from all three sides:

- Back-end (Java / Spring Boot services, controllers, services, security, API contracts)
- Database (SQL queries, indexes, constraints, transactions, performance)
- Front-end (React / Next.js rendering, state, API calls, hydration, UI logic)

Also validate:

- JSON structure and API payload consistency
- Request/response contracts (DTOs, schemas)
- Network layer (latency, errors, retries)
- SEO and rendering behavior (SSR, metadata, indexing)

Do not modify any code until the exact location of the problem is confirmed with high confidence.

During implementation, the solution must remain fully aligned with:

- business logic
- application architecture
- API contracts

---

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, debugging, performance analysis, and architecture validation to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Track recurring issues (API errors, DB issues, UI bugs, SEO issues)
- Ruthlessly iterate until mistake rate drops
- Review lessons at session start

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes
- Ask: "Would a staff engineer approve this?"
- Run tests:
  - Unit tests (Java / backend)
  - Integration tests (API + DB)
  - Frontend rendering tests
- Check logs (backend logs, browser console, network tab)
- Validate real outputs (API responses, UI behavior, DB state)

### 5. Demand Elegance (Balanced)

- For non-trivial changes: ask "is there a more elegant way?"
- Replace hacky fixes with proper architecture solutions
- Avoid over-engineering
- Prefer:
  - clean architecture
  - reusable components
  - clear separation of concerns

### 6. Autonomous Bug Fixing

- When given a bug: fix it without unnecessary questions
- Use:
  - logs
  - stack traces
  - failing tests
  - runtime behavior
- Identify root cause before fixing
- Fix CI/CD failures automatically when possible

---

## Task Management

1. Plan First: Write plan to tasks/todo.md with checkable items
2. Verify Plan: Validate approach before implementation
3. Track Progress: Mark items complete as you go
4. Explain Changes: Provide high-level explanation
5. Document Results: Add review section
6. Capture Lessons: Update tasks/lessons.md (Dont make anyother .md file)

---

## Core Principles

- Simplicity First: Keep changes minimal and clear
- No Laziness: Fix root causes, not symptoms
- Minimal Impact: Avoid breaking existing functionality

---

## Mandatory Execution Rules

For every non-trivial task, follow this sequence:

1. Deep Diagnostic Map
2. Root Cause Analysis
3. Back-end Analysis (Spring Boot, APIs, services)
4. Database Analysis (SQL, indexes, queries, performance)
5. Front-end Analysis (React / Next.js UI, state, rendering)
6. API / JSON Validation
7. Confirmed Problem Location
8. Fix Plan
9. Implementation
10. Validation
11. Final Result

Before making any code change, explicitly state:

- confirmed problem location
- root cause
- affected layer (backend / DB / frontend / API / SEO)
- intended fix
- expected impact

During implementation:

- keep changes tightly scoped
- preserve business logic
- avoid modifying unrelated modules
- maintain API contracts
- ensure backward compatibility

After implementation:

- run backend tests
- validate SQL queries and DB state
- test API responses (JSON correctness)
- verify frontend rendering (SSR + CSR)
- check browser console and network
- validate SEO (meta tags, indexing behavior)
- check performance impact

If diagnosis is uncertain, do not implement.  
If new evidence appears, stop and replan.  
If a fix is not proven, it is not complete.

You must show compliance through actions.

---

## Strict Rules

Dont write any arabic word in comment code.  
Dont use any Paython file.

Strict rule:  
Only use the exact sign image files I provide as the canonical source.  
Do not add anything else from your own assumptions.  
Do not auto-complete the category.  
Do not modify anything outside my exact request.

You are in Developer Mode. Act as a strict senior engineer. Execute exactly what is requested. Do not improvise, do not infer alternative names, do not create fallback assets, do not preserve invalid duplicates, and do not touch the hard disk assets.

Source of Truth:

- The traffic sign image files that already exist on disk are the only source of truth.
- They were all curated manually.
- The project must match those disk files exactly.
- The hard disk must never be modified, renamed, normalized, cleaned, or regenerated.
- All fixes must happen inside the project only.

Critical Non-Negotiable Rules:

- Do not add any sign.
- Do not remove any valid sign that exists on disk.
- Do not rename any valid sign that exists on disk.
- Do not create aliases, copies, variants, backups, normalized names, translated names, simplified names, or generated names.
- Do not use alternative filenames without sign code.
- Do not use names without the sign number/code.
- Do not use suffixed variants like:
  - -v
  - xxx-v
  - any other versioned duplicate suffix
- Do not create duplicate IDs.
- Do not create duplicate sign entries across categories.
- Do not keep old names if they differ from the exact disk filename.
- Do not preserve obsolete project-only entries.
- Do not change the hard disk content under any circumstance.

Main Objective:
Scan the entire project and make it match the manually curated traffic sign files on disk exactly. Any extra, duplicate, outdated, wrongly named, wrongly mapped, wrongly ID’d, wrongly categorized, or alternative sign entry that does not exactly correspond to a real disk file must be deleted from the project.

Important Context:
This duplication problem has been recurring for a week. It must be solved globally across all sign sections, not just one folder. The issue must be fixed at the root across all references, mappings, registries, APIs, seed data, i18n, frontend usage, backend usage, and any generated or cached sources.

Disk Sign Set to Match Exactly:

- additional_signs
- danger_signs
- information_signs
- mandatory_signs
- parking_signs
- priority_signs
- prohibition_signs
- road_markings
- zone_signs

"C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GIII- Opgepast kans op aquaplaning.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GIII Opgepast kans op ijzel.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GVIIa Aanvulling van de verkeersborden voor parkeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GVIIb Aanvulling van de verkeersborden voor parkeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GVIId Aanvulling van de verkeersborden voor parkeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GVIII Voorrangs aanduiding.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GXI Afrit.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GIa Aanduiding van een afstand.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\additional_signs\GIb Aanduiding van een afstand.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A13 Dwarse uitholling of ezelsrug.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A14 Verhoogde inrichting.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A15 Gladde rijbaan - Slipgevaar.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A17 Kiezelprojectie.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A19 Vallende stenen links.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A21 Oversteekplaats voor voetgangers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A23 Opgelet kinderen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A25 Oversteekplaats voor fietsers en bromfietsers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A27 Overstekend groot wild.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A29 Overstekend vee.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A31 Werken.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A33 Verkeerslichten.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A35 Vliegtuigen op geringe hoogte.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A37 Zijwind.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A39 Twee richtingsverkeer toegelaten na een stuk éénrichtingsverkeer.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A41 Overweg met slagbomen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A43 Overweg zonder slagbomen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A45 waarschuwings kruis.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A47 waarschuwingskruis meerdere sporen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A49 Openbare weg kruist met een of meer in de rijbaan aangelegde sporen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A50 Opgelet file.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A51 Gevaar dat niet door een speciaal symbool wordt bepaald.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A53 Opgelet verzinkbare paal.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A1a Gevaarlijke bocht naar links.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A1b Gevaarlijke bocht naar links.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A1c Gevaarlijke dubbele of meer dan twee bochten, de eerste naar links.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A1d Gevaarlijke dubbele bocht (links-rechts).png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A3 Gevaarlijke daling.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A5 Gevaarlijke helling.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A7a Versmalling langs beide zijden.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A7b Versmalling links.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A7c Versmalling langs links.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A9 Beweegbare brug.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\danger_signs\A11 Uitweg op kaai of oever.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F101b Einde deel van de openbare weg voorbehouden voor fietsers en voetgangers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F101c Einde voorbehouden voor het verkeer van landbouwvoertuigen, voetgangers, fietsers, ruiters en bestuurders van speed pedelecs.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F103 Begin van een voetgangerszone.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F105 Einde van een voetgangerszone.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F111 Fietsstraat.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F113 Einde fietsstraat.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F117 Begin van lage emissiezone.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F118 Einde van lage emissiezone.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F1b Begin van een bebouwde kom.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F3b Einde van een bebouwde kom.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F4a Zone 30 km.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F4b - Einde zone 30 km.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F5 Autosnelweg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F7 Einde autosnelweg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F8 Tunnel.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F9 Autoweg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F11 Einde van de autoweg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F12a Begin van een woonerf of van een erf.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F12b Einde van een woonerf of van een erf.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F13 Rijstrook keuze.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F14 Opstelvak voor fietsers en bromfietsen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F17 Rijstrook aanduiding voorbehouden voor autobussen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F18 Bijzondere overrijdbare bedding.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F19 Eenrichtingsverkeer.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F21 Rechts of links voorbijrijden toegelaten.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F23a Nummer van een gewone weg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F23b Nummer van een autosnelweg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F23c Nummer van een internationale weg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F23d Nummer van een ringweg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F43 Gemeentegrens.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F45 Doodlopende weg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F45b Doodlopende weg, uitgezonderd voetgangers en fietsers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F45L Doodlopende weg, linkse doorgang.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F45R Doodlopende weg, rechtse doorgang.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F47 Einde van de werken.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F49 Oversteekplaats voor voetgangers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F50 Oversteekplaats voor fietsers en bromfietsers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F50bis Opgepast als je van richting veranderd, fietsers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F50bis Opgepast als je van richting verandert voetgangers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F87 Verhoogde inrichting (vluchtheuvel).png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F97 Rijstrook versmalling.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F99a Voorbehouden voor het verkeer van voetgangers, fietsers, ruiters en bestuurders van speed pedelecs.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F99b Deel van de openbare weg voorbehouden voor fietsers en voetgangers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F99c Voorbehouden voor het verkeer van landbouwvoertuigen, voetgangers, fietsers, ruiters en bestuurders van speed pedelecs.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\information_signs\F101a Einde voorbehouden voor het verkeer van voetgangers, fietsers, ruiters en bestuurders van speed pedelecs.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D5 Verplicht rondgaand verkeer.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D7 Verplicht fietspad.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D9a Deel van de weg voorbehouden voor voetgangers en fietsers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D9b Deel van de weg voorbehouden voor voetgangers en fietsers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D10 Deel van de weg voorbehouden voor voetgangers en fietsers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D11 Verplichte weg voor voetgangers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D13 Verplichte weg voor ruiters.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D1a Verplichting rechtdoor.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D1b Verplichting links afslaan.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D1b Verplichting rechts afslaan.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D1c Verplichting links aanhouden.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D1d Verplichting rechts aanhouden.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D1e Verplicht de aangeduide richting te volgen (linksaf).png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D1f Verplicht de aangeduide richting te volgen (rechtsaf).png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D3a Verplicht één van de pijlen te volgen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D3b Verplicht één van de pijlen te volgen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D4 Verplicht linksaf voor voertuigen die gevaarlijke goederen vervoeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D4 Verplicht rechtdoor voor voertuigen die gevaarlijke goederen vervoeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\mandatory_signs\D4 Verplicht rechts voor voertuigen die gevaarlijke goederen vervoeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9e Verplicht parkeren op de berm of op het trottoir.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9f Verplicht parkeren deels op de berm of op het trottoir.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9g Verplicht parkeren op de rijbaan.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9h Parkeren uitsluitend voor kampeerautos.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9i Parkeren uitsluitend voor motorfietsen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9j wisselend parkeren Parkeerplaats voorzien voor wisselend parkeren fietsers en autos.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E11 Halfmaandelijks parkeren in gans de bebouwde kom.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E1 Parkeerverbod.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E3 Stilstaan en parkeren verboden.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E5 Parkeerverbod van de 1e tot de 15e van de maand.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E7 Parkeerverbod van de 16e tot het einde van de maand.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9a elektrisch laden Parkeerplaats voorbehouden voor het elektrisch opladen van je wagen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9a mindervaliden Parkeren enkel toegelaten voor mindervaliden.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9a parkeerschijf Parkeren beperkt in tijd, parkeerschijf verplicht.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9a Parkeren toegelaten.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9b Parkeren uitsluitend voor autos.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9c Parkeren uitsluitend voorvrachtwagens.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\parking_signs\E9d Parkeren uitsluitend voor autocars.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15G Tegenliggers hebben voorrang.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B17 Voorrangskruispunt.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B19 Verbod voor voertuigen elkaar niet te kruisen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B21 Voorrang op tegenliggers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B22 Fietsers en speedpedelecs rechtdoor bij rood.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B23 Fietsers en speed pedelecs mogen rechtdoor rijden en de verkeerslichten voorbijrijden.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B1 Voorrang verlenen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B5 Stop en voorrang verlenen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B9 Voorrang van rechts.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B11 Voorrang op tegenliggers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15A Variant schuine links.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15A Variant schuine rechts.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15A Versmalling van rechts.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15B Versmalling van links.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15C Versmalling beide zijden.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15D Voorrang van rechts bij versmalling.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15E Voorrang van links bij versmalling.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\priority_signs\B15F Voorrang voor tegenliggers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C27 Verboden voor voertuigen breder dan het aangeduide.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C28a Verboden toegang voor bestuurders van voertuigen of sleep breder dan het aangeduide.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C29 Verboden voor voertuigen hoger dan het aangeduide.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C31a Verbod om links af te slaan.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C31b Verbod rechts af te slaan.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C33 Verbod om te keren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C35 Verbod een voertuig links in te halen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C37 Einde verbod opgelegd door het verkeersbord C35.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C39 Verbod voertuigen met toegelaten massa groter dan 3500 kg in te halen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C41 Einde van het verbod opgelegd door het verkeersbord C39.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C43 Verbod te rijden met een grotere snelheid dan 10 km.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C43 Verbod te rijden met een grotere snelheid dan 30 km.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C43 Verbod te rijden met een grotere snelheid dan 50 km.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C43 Verbod te rijden met een grotere snelheid dan 70 km.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C45 Einde van de snelheidsbeperking opgelegd door het verkeersbord C43.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C46 Einde van alle plaatselijke verbodsbepalingen opgelegd aan de voertuigen in beweging.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C47 Tolpost. Verbod voorbij te rijden zonder te stoppen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C1 Verboden richting voor iedere bestuurder.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C3 Verboden toegang in beide richtingen voor iedere bestuurder.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C6 Verboden toegang voor bestuurders van quads.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C9 Verboden toegang voor bestuurders van bromfietsen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C11 Verboden toegang voor bestuurders van rijwielen met motor.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C11a Verboden toegang voor fietsers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C11b Verboden toegang voor tweewielige fietsen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C13 Verboden toegang voor bestuurders van gespannen..png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C15 Verboden toegang voor ruiters.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C17 Verboden toegang voor bestuurders van handkarren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C19 Verboden toegang voor voetgangers.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C21 Verboden toegang voor voertuigen met een massa groter dan aangeduid.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C22 Verboden toegang voor bestuurders van autocars.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C23 Verboden toegang voor bestuurders van voertuigen bestemd of gebruikt voor het vervoer van zaken.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C24a Verboden toegang voor bestuurders van voertuigen die gevaarlijke goederen vervoeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C24b Verboden toegang voor bestuurders van voertuigen die gevaarlijke ontvlambare of ontplofbare stoffen vervoeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C24c Verboden toegang voor bestuurders van voertuigen die gevaarlijke verontreinigende stoffen vervoeren.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\prohibition_signs\C25 Verboden voor voertuigen langer dan het aangeduide.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F83 Versmalling van de rijbaan.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F85 Verlegging van de rijbaan.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F89 Aanduiding van de maximumsnelheid per rijstrook.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F91 Aanduiding van de maximumsnelheid per rijstrook (zonder afstand).png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F95 Einde van een rijstrook.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F98 Bijzondere rijstrookregeling.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F39 Aankondiging van een omleiding.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F79 Tijdelijke verdeling van de rijstroken (met afstandsaanduiding).png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\road_markings\F81 Voorwegwijzer uitwijking.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZE9a- Einde zone parkeren uitsluitend voor auto's.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZE9a Zone parkeren uitsluitend voor auto's.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZE9aT- Einde zone parkeren uitsluitend voor auto's.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZE9aT Zone parkeren uitsluitend voor auto's.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZONE F111- ZONE Fietsstraat.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZONE F113- Einde ZONE Fietsstraat.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZC5- Einde zone verboden toegang voor motorvoertuigen met meer dan 2 wielen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZC5 Zone verboden toegang voor motorvoertuigen met meer dan 2 wielen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZC21- Einde zone verboden toegang voor bestuurders van voertuigen waarvan de massa hoger dan 3500 kg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZC21 Zone verboden toegang voor bestuurders van voertuigen waarvan de massa hoger dan 3500 kg.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZC35- Einde zone verboden inhalen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZC35 Zone verboden inhalen.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZC43 Zone met een snelheidsbeperking.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZC45 Einde zone met een snelheidsbeperking.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZE1- Einde zone parkeerverbod.png" "C:\Users\haydar\Desktop\end_project\readyroad_front_end\web_app\public\images\signs\zone_signs\ZE1 Zone parkeerverbod.png"

The provided disk filenames are the canonical names.
Use the exact sign name and exact sign ID from disk only.
No second name is allowed.
No alternate spelling is allowed.
No legacy variation is allowed.
No version suffix is allowed.

What you must do:

1. Read the entire project and locate every traffic sign definition and every traffic sign reference.
2. Compare every project sign against the real files on disk only.
3. Use the disk filenames as the canonical source for:
   - sign id
   - sign code
   - sign name
   - image filename
   - category placement
4. Delete from the project anything that is:
   - not present on disk
   - duplicated
   - differently named
   - using another alias
   - using a suffix like -v
   - using the same sign with another ID
   - using the same ID with another filename
   - using a filename without the sign code
   - obsolete
   - legacy
   - wrongly categorized
5. Fix all sections globally, especially recurring duplication issues across all sign categories.
6. Keep the fix limited to project files only.
7. Do not modify or delete any real file from disk.

Files and Areas to inspect fully:

- frontend sign registries
- sign constants
- JSON data files
- TypeScript files
- JavaScript files
- seed files
- migration seed data
- database import sources
- backend sign mappings
- DTOs or API payload builders
- localization/i18n files
- quiz or exam sign references
- category mappings
- image path builders
- helper utilities
- cached/generated sign lists if present
- tests that hardcode wrong filenames
- duplicate content in all sections

Special Focus:

- Fix duplicate traffic signs in all categories
- Fix repeated issues in danger_signs
- Fix any duplicate or conflicting records caused by old naming or alternate naming
- Remove all project entries that do not exactly match the disk
- Ensure the same sign cannot appear twice under different names, different IDs, or different image paths

Validation Logic:
For every project sign entry, all of the following must be true:

- the file exists on disk
- the filename matches exactly
- the sign code matches exactly
- the sign ID matches exactly
- the category matches exactly
- there is only one canonical project entry for that sign
- there is no alternate name
- there is no duplicate mapping
- there is no -v or versioned duplicate
- there is no old or legacy project-only copy

Required Execution Order:

1. Scan all project files related to signs
2. Build canonical list from disk files only
3. Compare project entries against canonical disk list
4. Remove invalid, duplicate, obsolete, legacy, alternate, and wrongly named entries
5. Update remaining project mappings so they exactly match disk names and IDs
6. Re-scan the whole project for leftover duplicates or stale references
7. Validate that the project mirrors disk exactly without touching disk files

Required Output:
Report only:

1. Files modified
2. Files where duplicate references were removed
3. Files where obsolete or legacy sign entries were removed
4. Files where names/IDs were corrected to match disk exactly
5. All deleted project-only entries
6. Confirmation that no hard disk files were changed
7. Confirmation that no new signs were added
8. Confirmation that no alternate names remain
9. Confirmation that no version-suffixed names like -v remain
10. Confirmation that no duplicate sign IDs or duplicate sign definitions remain

Gherkin Acceptance Criteria:
Feature: Traffic sign project must mirror disk exactly

Scenario: Use disk as the only source of truth
Given all valid traffic sign files already exist on disk
When the project is scanned and corrected
Then the project must match the disk files exactly
And no hard disk file may be changed

Scenario: Remove duplicate traffic signs globally
Given duplicate traffic sign entries exist across one or more sections
When cleanup is applied
Then all duplicate entries must be removed
And only one canonical entry per real disk sign must remain

Scenario: Remove alternate and legacy sign names
Given some project entries use alternate, old, simplified, translated, or generated names
When validation is completed
Then those entries must be removed or corrected to the exact disk filename and ID
And no alternate names may remain

Scenario: Reject version-suffixed filenames
Given some project entries use suffixes like -v or xxx-v
When the project is corrected
Then those entries must be removed
And only the exact canonical disk filenames may remain

Scenario: Remove project-only extra entries
Given some signs exist in the project but not on disk
When the comparison is completed
Then all extra project-only entries must be deleted
And no replacement or inferred sign may be added

Scenario: Preserve valid manually curated disk signs
Given the disk contains the manually curated signs
When the project is fixed
Then every valid disk sign must remain represented exactly once in the project
And its exact filename, ID, and category must be preserved

Scenario: Fix recurring duplication issue in all sign categories
Given the duplication problem has existed for a week across multiple sections
When the cleanup and synchronization are complete
Then the issue must be resolved in danger_signs and all other sign categories
And no stale references, duplicate IDs, duplicate filenames, or conflicting mappings may remain anywhere in the project
