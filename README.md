# RijVia

**Belgian driving theory learning platform for Category B candidates**

RijVia is a multilingual learning platform built to help candidates prepare for the Belgian theoretical driving exam through structured lessons, traffic-sign study, targeted practice, exam simulation, progress tracking, and administration tools.

The product is designed for learners who want one clear place to study Belgian traffic theory in **Arabic, Dutch, French, and English**, with full support for both left-to-right and right-to-left interfaces.

**Live website:** https://rijvia.be  
**Public API:** https://api.rijvia.be

---

## Table of contents

- [About RijVia](#about-rijvia)
- [Product goals](#product-goals)
- [Main learning experience](#main-learning-experience)
- [Theory categories](#theory-categories)
- [Languages and RTL support](#languages-and-rtl-support)
- [Repository structure](#repository-structure)
- [Web application](#web-application)
- [Mobile application](#mobile-application)
- [Backend integration](#backend-integration)
- [Administration](#administration)
- [Testing and quality](#testing-and-quality)
- [CI/CD and production deployment](#cicd-and-production-deployment)
- [Local development](#local-development)
- [Environment configuration](#environment-configuration)
- [Project conventions](#project-conventions)
- [Security](#security)
- [Related repository](#related-repository)
- [Author and ownership](#author-and-ownership)

---

## About RijVia

RijVia started as a full-stack learning project and developed into a production-oriented platform focused specifically on Belgian driving theory.

The platform combines:

- structured theoretical lessons;
- traffic-sign learning and reference material;
- category-based practice;
- random practice;
- theory exam simulation;
- multilingual questions and explanations;
- user progress and weak-area tracking;
- account and learning notifications;
- administration tools for theory content;
- automated testing, health checks, and production deployment.

The goal is not to reproduce a handbook as static pages. RijVia is built around an interactive learning flow in which users can study, practise, receive feedback, identify weak topics, and return to the areas that need more attention.

---

## Product goals

### 1. Make Belgian driving theory easier to understand

Traffic rules can be difficult when they are presented only as legal text. RijVia structures the material into clear categories, lessons, examples, questions, and explanations.

### 2. Support multilingual learners

The complete product is designed around four languages:

- Arabic (`ar`)
- Dutch (`nl`)
- French (`fr`)
- English (`en`)

Arabic is treated as a first-class locale with RTL layout support.

### 3. Train with exam-oriented questions

Learners can practise by category, use random practice, and work with an exam-style simulator.

### 4. Learn from mistakes

The platform is designed to do more than mark an answer as correct or incorrect. Explanations, performance data, repeated practice, and weak-area analysis help the learner understand the rule behind an answer.

### 5. Keep the learning bank manageable

The administration environment provides dedicated tools for question management, category readiness, exposure statistics, eligibility checks, traffic-sign content, and other operational controls.

---

## Main learning experience

### Lessons

The lesson area presents Belgian driving theory in structured sections so learners can build understanding before starting exam-style practice.

### Traffic signs

RijVia includes dedicated traffic-sign learning and practice areas with multilingual content and visual references.

### Practice by topic

Learners can focus on one theory category at a time. The platform uses a controlled category structure so practice, analytics, recommendations, and administration remain aligned.

### Random practice

Random practice provides broader repetition across the available question bank.

### Theory exam simulation

The exam experience is separated from normal practice so candidates can train in a more exam-oriented flow.

### Explanations

Questions can provide explanations in all supported languages. The objective is to teach the rule behind the answer instead of encouraging memorisation of answer positions.

### Progress and weak areas

Learning data can be used to identify areas that need more practice and to support more targeted study.

### Notifications

The platform includes user-facing notification support for relevant account and learning events.

---

## Theory categories

RijVia organises Category B theory learning around eight primary areas:

1. Priority and intersections
2. Speed, roads and distances
3. Manoeuvres, overtaking and lanes
4. Parking, stopping and positioning
5. Traffic signs, signals and traffic control
6. Road users and public transport
7. Vehicle and technical safety
8. Driver, law and safety

Internal category identifiers are implementation details. User-facing interfaces are designed to show clear translated category names rather than technical codes.

---

## Languages and RTL support

| Locale | Language | Direction |
| --- | --- | --- |
| `ar` | Arabic | RTL |
| `nl` | Dutch | LTR |
| `fr` | French | LTR |
| `en` | English | LTR |

Responsive and multilingual behaviour is verified as part of the automated browser test suite.

---

## Repository structure

This repository contains the two client applications for RijVia:

```text
.
├── web_app/                 # Next.js web application
├── mobile_app/              # Flutter mobile application
├── .github/workflows/       # Web, mobile and deployment workflows
└── README.md
```

The backend is maintained in a separate repository.

The repository name is retained for Git history continuity. The product and public-facing brand are **RijVia**.

---

# Web application

## Technology

The web client currently uses:

- **Next.js 16.2.11**
- **React 18.3.1**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Radix UI primitives**
- **Lucide icons**
- **Axios**
- **Jest**
- **Testing Library**
- **Playwright**
- **ESLint 9**

The application uses Next.js routing, multilingual route handling, authenticated areas, protected administration routes, public learning pages, metadata, sitemap generation, and production Docker builds.

### Simplified web structure

```text
web_app/
├── src/
│   ├── app/                 # Next.js routes and layouts
│   ├── components/          # Shared UI and feature components
│   ├── contexts/            # Application contexts
│   ├── lib/                 # API helpers, configuration and shared utilities
│   ├── messages/            # ar / nl / fr / en translations
│   ├── services/            # Client-side service layer
│   └── types/               # Shared TypeScript types
├── public/                  # Static assets
├── tests/e2e/               # Playwright end-to-end tests
├── Dockerfile               # Production frontend image
├── package.json
└── .env.example
```

### Main web areas

The learner-facing application includes areas such as:

- home page;
- lessons;
- traffic-sign study;
- traffic-sign practice;
- category practice;
- random practice;
- exam simulation;
- authentication;
- user dashboard and learning information;
- account-related pages;
- multilingual SEO entry points.

---

# Administration

The administration interface is part of the web application and is protected by role-based access.

Administrative areas include functionality for:

- theory question management;
- question creation and editing;
- category management;
- category readiness and health information;
- question exposure analytics;
- traffic-sign management;
- learning and exam history;
- user administration;
- analytics and operational checks.

Admin UX follows the same RijVia visual system as the rest of the product and is tested for responsive behaviour.

Technical identifiers can remain in API requests and filters where they are required, while the visible interface prefers readable translated names.

---

# Mobile application

The repository also contains the Flutter client.

## Technology

The mobile application currently uses:

- **Flutter 3.38.5**
- **Dart 3.10-compatible SDK**
- `provider`
- `flutter_bloc`
- `dio`
- `get_it`
- `shared_preferences`
- `flutter_secure_storage`
- `app_links`
- `intl`
- Flutter localization support

The mobile package is private and is not intended for publication to pub.dev.

## Mobile CI

For relevant mobile changes, GitHub Actions performs:

1. dependency installation;
2. Dart formatting verification;
3. Flutter static analysis;
4. Flutter tests;
5. Android debug APK build;
6. temporary artifact upload.

This keeps mobile validation independent from the web pipeline.

---

# Backend integration

The clients communicate with the RijVia backend API.

Typical local web development uses a backend origin such as:

```text
http://localhost:8890
```

Production uses:

```text
https://api.rijvia.be
```

The backend provides domain logic for authentication, users, questions, categories, exams, progress, administration, traffic-sign data, health checks, and other platform functions.

---

# Testing and quality

RijVia uses several layers of automated verification.

## Unit tests

```bash
npm test -- --runInBand
```

## Type checking

```bash
npx tsc --noEmit
```

## Linting

```bash
npm run lint
```

## Production build

```bash
npm run build
```

## End-to-end tests

```bash
npm run test:e2e
```

Playwright validates important public, authenticated, administrative, routing, multilingual, and responsive browser flows.

## Docker verification

The Web CI pipeline also builds the production frontend Docker image before a verified `main` revision is eligible for production deployment.

---

# CI/CD and production deployment

RijVia uses GitHub Actions as a deployment gate rather than deploying every source change directly.

## Web CI flow

```text
Branch / Pull Request
        ↓
npm ci
        ↓
Jest + coverage
        ↓
TypeScript check
        ↓
ESLint
        ↓
Next.js production build
        ↓
Playwright
        ↓
Frontend Docker build
```

A failing step blocks the delivery path.

## Production deployment flow

A successful Web CI run caused by a push to `main` can trigger the production deployment workflow.

The production workflow:

1. resolves a verified frontend revision;
2. resolves a verified backend revision;
3. configures pinned SSH access from GitHub secrets;
4. invokes the production release gate on the server;
5. waits for release health verification;
6. performs public smoke checks;
7. records the deployed release;
8. removes temporary SSH material from the runner.

Conceptually:

```text
Merge to main
     ↓
Web CI success
     ↓
Resolve verified revisions
     ↓
Production release gate
     ↓
Service health verification
     ↓
Public smoke checks
     ↓
Release recorded
```

Pull requests are tested but do not deploy to production.

---

# Local development

## Web requirements

- Node.js 20
- npm
- a running RijVia backend

## Clone and start the web application

```bash
git clone https://github.com/haydartarek/readyroad_front_end.git
cd readyroad_front_end/web_app
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell equivalent for the environment file:

```powershell
Copy-Item .env.example .env.local
```

Open:

```text
http://localhost:3000
```

## Run the full web verification locally

```bash
npm test -- --runInBand
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
```

## Run the mobile application

```bash
cd mobile_app
flutter pub get
flutter analyze
flutter test
flutter run
```

---

# Environment configuration

The web environment template documents the expected local variables.

Example:

```env
BACKEND_URL=http://localhost:8890/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:8890
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_OAUTH_CLIENT_ID=replace_with_google_oauth_client_id
SMTP_USER=replace_with_smtp_username
SMTP_PASS=replace_with_smtp_app_password
SMTP_FROM=info@rijvia.be
CONTACT_TO=info@rijvia.be
```

Real production secrets must never be committed.

---

# Project conventions

## Product naming

The public product name is:

```text
RijVia
```

New public documentation, metadata, UI text, and product-facing assets should use the RijVia identity.

## Category presentation

Category codes can be required internally by the API, database, filters, or compatibility layers. User-facing screens should prefer translated category names instead of technical identifiers.

## Multilingual behaviour

New learner-facing content should be considered across all four supported locales.

## RTL

Arabic layouts must be checked in RTL rather than assuming LTR styles will automatically work.

## Responsive UI

New screens should be tested at both mobile and desktop widths.

## Production safety

Production changes should pass the relevant CI workflow before being merged and deployed.

---

# Security

RijVia follows practical security rules:

- secrets are supplied through environment configuration;
- production credentials are not stored in the repository;
- protected API functionality is enforced by backend authentication and authorization;
- admin routes are role-protected;
- deployment SSH material is supplied through GitHub secrets;
- temporary SSH material is removed from the runner after deployment;
- production deployment uses verified revisions;
- backend health is checked during delivery;
- public smoke checks must pass for a successful deployment.

If a credential is accidentally committed, it should be treated as compromised and rotated immediately.

---

# Related repository

The backend source code is maintained separately:

- **RijVia Backend:** https://github.com/haydartarek/readyroad

Additional links:

- **Live platform:** https://rijvia.be
- **Public API:** https://api.rijvia.be
- **GitHub:** https://github.com/haydartarek
- **LinkedIn:** https://www.linkedin.com/in/haydartarek-dev/
- **Portfolio:** https://haydartarek.github.io/portfolio_site/

---

# Author and ownership

RijVia is designed, developed, maintained, and operated by **Haydar Tarek**.

**Author:** Haydar Tarek  
**GitHub:** https://github.com/haydartarek  
**GitHub email:** 94225472+haydartarek@users.noreply.github.com  
**Project contact:** info@rijvia.be  
**LinkedIn:** https://www.linkedin.com/in/haydartarek-dev/  
**Portfolio:** https://haydartarek.github.io/portfolio_site/

---

## Status

RijVia is an actively maintained project. The web application, mobile application, backend integration, automated test pipelines, and production deployment workflow continue to evolve as the platform grows.
