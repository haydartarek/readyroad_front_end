# ReadyRoad Web App

Next.js 16 web application for Belgian driving license exam preparation.

## Tech Stack

- **Framework:** Next.js 16.1.4 (App Router + Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Notifications:** Sonner

## Features

### Core Features
- **Exam Simulation:** 50 questions, 45 minutes, 82% pass threshold (Belgian standards)
- **Practice Mode:** Category-based practice with instant feedback
- **Progress Tracking:** Overall stats, category progress, study streaks
- **Analytics Dashboard:** Error patterns, weak areas recommendations
- **Traffic Signs:** 210+ signs with SSG for SEO
- **Lessons:** 31 theory lessons with SSG

### Multi-language Support
- English (EN)
- Arabic (AR) with RTL support
- Dutch (NL)
- French (FR)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (protected)/        # Auth-required pages
│   │   ├── dashboard/
│   │   ├── exam/
│   │   ├── practice/
│   │   ├── analytics/
│   │   └── progress/
│   ├── lessons/            # SSG lessons
│   ├── traffic-signs/      # SSG traffic signs
│   ├── login/
│   └── register/
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── exam/
│   ├── practice/
│   └── analytics/
├── contexts/               # React Context providers
├── lib/                    # Utilities and API client
└── messages/               # i18n translations
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on port 8890

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8890/api
NEXT_PUBLIC_APP_URL=https://readyroad.be
```

## API Integration

The app connects to the Spring Boot backend API:

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | User registration |
| `POST /auth/login` | User login |
| `GET /auth/me` | Get current user |
| `GET /exams/simulations/can-start` | Check if user can start exam |
| `POST /exams/simulations/start` | Start new exam |
| `GET /exams/simulations/:id` | Get exam data |
| `POST /exams/simulations/:id/questions/:qid/answer` | Submit answer |
| `GET /exams/simulations/:id/results` | Get exam results |
| `GET /categories` | Get all categories |
| `GET /quiz/random` | Get random practice questions |
| `GET /quiz/category/:code` | Get category questions |
| `GET /users/me/progress/overall` | Get overall progress |
| `GET /users/me/progress/categories` | Get category progress |
| `GET /users/me/analytics/error-patterns` | Get error patterns |
| `GET /users/me/analytics/weak-areas` | Get weak areas |

## Build Status

```
✓ Compiled successfully
✓ TypeScript: No errors
✓ Static pages: 256 generated
✓ SSG: 31 lessons + 210 traffic signs
```

## Known Warnings

1. **Middleware Deprecation:** Next.js 16 shows a warning about middleware convention changing to "proxy". The current auth middleware works correctly; this is a future migration notice.

2. **Multiple Lockfiles:** Warning about workspace root inference. Can be silenced by setting `turbopack.root` in next.config.ts.

## Development

```bash
# Type checking
npm run lint

# Build
npm run build

# Run tests (if configured)
npm test
```

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT
