
# ReadyRoad Next.js 14 Web Application - Complete Architecture

**Project:** ReadyRoad Belgian Driving License Platform  
**Framework:** Next.js 14 (App Router)  
**Backend:** Java Spring Boot REST API (localhost:8890)  
**Architecture:** Server Components + Client Components + TypeScript  
**Security:** JWT Authentication with /users/me endpoints  
**Styling:** Tailwind CSS + Shadcn/ui Components  
**Languages:** 4 (Arabic, English, Dutch, French) with RTL  
**Design Reference:** Style Guide (Orange Primary #DF5830, Modern Radius 24px)  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design System Implementation](#2-design-system-implementation)
3. [Architecture Patterns](#3-architecture-patterns)
4. [Folder Structure](#4-folder-structure)
5. [Routing & Navigation](#5-routing--navigation)
6. [Page Specifications](#6-page-specifications)
7. [Component Library](#7-component-library)
8. [Authentication System](#8-authentication-system)
9. [API Integration](#9-api-integration)
10. [State Management](#10-state-management)
11. [Multi-Language (i18n)](#11-multi-language-i18n)
12. [SEO & Metadata](#12-seo--metadata)
13. [Performance Optimization](#13-performance-optimization)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment](#15-deployment)
16. [Development Roadmap](#16-development-roadmap)

---

## 1. Project Overview

### **Purpose**
ReadyRoad Next.js web app is a responsive, production-ready platform for Belgian driving license preparation with:

- ✅ **Responsive Design** (Desktop, Tablet, Mobile)
- ✅ **Server-Side Rendering** (SSR for protected pages)
- ✅ **Static Site Generation** (SSG for public content)
- ✅ **50-question Exam Simulation** (Belgian rules)
- ✅ **Advanced Analytics** (C1: Error Patterns, C2: Weak Areas)
- ✅ **200+ Traffic Signs** (with SSG for SEO)
- ✅ **31 Theory Lessons** (with PDF downloads)
- ✅ **Real-time Progress Tracking**
- ✅ **4-language Support** with RTL

---

## 2. Design System Implementation

### **2.1 Based on Style Guide**

**Reference Design Tokens:**
```typescript
// src/styles/tokens.ts

export const tokens = {
  colors: {
    primary: '#DF5830',      // Orange (from style guide)
    surface: '#FFFFFF',
    border: '#DF2EC4',       // Light border
    focusRing: '#FFFFFF',
    
    // Semantic colors
    success: '#51CF66',
    warning: '#FFA94D',
    error: '#FF6B6B',
    info: '#4ECDC4',
    
    // Neutrals
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  
  spacing: {
    0: '0',
    2: '2px',
    4: '4px',
    6: '6px',
    8: '8px',
    10: '10px',
    12: '12px',
    14: '14px',
    16: '16px',
    18: '18px',
    20: '20px',
  },
  
  borderRadius: {
    default: '24px',      // From style guide
    small: '12px',
    large: '32px',
    full: '9999px',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      '1p': '1px',
      '2p': '2px',
      '3p': '3px',
      '4p': '4px',
      '6p': '6px',
      '8p': '8px',
      '10p': '10px',
      '15p': '15px',
      '20p': '20px',
      '30p': '30px',
    },
    fontWeight: {
      1: 400,
      2: 500,
      3: 600,
      4: 700,
      5: 800,
    },
  },
  
  elevation: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
};
2.2 Tailwind Configuration
typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss';
import { tokens } from './src/styles/tokens';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        surface: tokens.colors.surface,
        border: tokens.colors.border,
        success: tokens.colors.success,
        warning: tokens.colors.warning,
        error: tokens.colors.error,
        info: tokens.colors.info,
        gray: tokens.colors.gray,
      },
      spacing: tokens.spacing,
      borderRadius: {
        ...tokens.borderRadius,
      },
      fontFamily: tokens.typography.fontFamily,
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: tokens.typography.fontWeight,
      boxShadow: {
        sm: tokens.elevation.sm,
        md: tokens.elevation.md,
        lg: tokens.elevation.lg,
        xl: tokens.elevation.xl,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
2.3 Component Variants (Based on Style Guide)
typescript
// src/components/ui/button.tsx

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[24px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        hover: 'bg-[#FF7A50] text-white',  // Lighter orange
        disabled: 'bg-gray-400 text-gray-600 cursor-not-allowed',
        outline: 'border-2 border-primary text-primary hover:bg-primary/10',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
2.4 Card Component (From Style Guide)
typescript
// src/components/ui/card.tsx

import { cn } from '@/lib/utils';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-[24px] bg-white shadow-md transition-shadow hover:shadow-lg',
      className
    )}
    {...props}
  />
));

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
2.5 Input Component (Style Guide)
typescript
// src/components/ui/input.tsx

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-[12px] border border-gray-300 bg-white px-4 py-2 text-base',
        'ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-gray-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';
2.6 Chips Component (Style Guide)
typescript
// src/components/ui/chip.tsx

export const Chip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'primary' | 'default' | 'outline';
    selected?: boolean;
  }
>(({ className, variant = 'default', selected, ...props }, ref) => {
  const variants = {
    primary: 'bg-primary text-white',
    default: 'bg-gray-200 text-gray-800',
    outline: 'border-2 border-gray-300 bg-white text-gray-800',
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors',
        'hover:opacity-80 cursor-pointer',
        selected && 'ring-2 ring-primary ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
2.7 Alert Component (Style Guide)
typescript
// src/components/ui/alert.tsx

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'info' | 'warning' | 'error';
  }
>(({ className, variant = 'info', children, ...props }, ref) => {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: '🛈',
      iconBg: 'bg-blue-500',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: '⚠',
      iconBg: 'bg-orange-500',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '⚠',
      iconBg: 'bg-red-500',
    },
  };
  
  const config = variants[variant];
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-3 rounded-[24px] border-2 p-4',
        config.bg,
        config.border,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-white text-sm',
          config.iconBg
        )}
      >
        {config.icon}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
});
3. Architecture Patterns
3.1 Next.js 14 App Router Structure
text
✅ Server Components (default)
   - Fetch data on server
   - No JavaScript sent to client
   - Better performance & SEO

✅ Client Components ('use client')
   - Interactive UI
   - State management
   - Browser APIs

✅ Route Groups
   - (auth) - Login/Register
   - (protected) - Dashboard, Exam, etc.
   - (public) - Traffic Signs, Lessons

✅ Layouts
   - Root layout (global)
   - Protected layout (auth check)
   - Public layout (SEO optimized)
3.2 Server vs Client Component Decision Tree
text
Does component need:
├─ User interaction (onClick, onChange)? → Client Component
├─ useState, useEffect hooks? → Client Component
├─ Browser APIs (localStorage, window)? → Client Component
├─ Real-time data (WebSocket)? → Client Component
└─ None of above? → Server Component (default)

Examples:
✅ Server: Exam results display (static after fetch)
❌ Client: Exam timer (needs useEffect)
❌ Client: Language selector (needs useState)
✅ Server: Traffic signs list (SSG, no interaction)
4. Folder Structure
text
readyroad-nextjs/
├── public/
│   ├── images/
│   │   ├── signs/               # Traffic sign images
│   │   ├── logos/
│   │   └── og-images/
│   ├── pdfs/                    # Lesson PDFs
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (protected)/
│   │   │   ├── layout.tsx       # Auth middleware
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── exam/
│   │   │   │   ├── page.tsx     # Exam rules
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx         # Exam questions
│   │   │   │   │   └── overview/
│   │   │   │   │       └── page.tsx     # Question overview modal
│   │   │   │   └── results/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx     # Results
│   │   │   ├── practice/
│   │   │   │   ├── page.tsx             # Category selection
│   │   │   │   ├── [category]/
│   │   │   │   │   ├── page.tsx         # Difficulty selection
│   │   │   │   │   └── session/
│   │   │   │   │       └── [id]/
│   │   │   │   │           └── page.tsx # Practice questions
│   │   │   ├── analytics/
│   │   │   │   ├── error-patterns/
│   │   │   │   │   └── page.tsx         # Feature C1
│   │   │   │   └── weak-areas/
│   │   │   │       └── page.tsx         # Feature C2
│   │   │   └── progress/
│   │   │       ├── page.tsx
│   │   │       └── categories/
│   │   │           └── [categoryCode]/
│   │   │               └── page.tsx
│   │   ├── traffic-signs/
│   │   │   ├── page.tsx                 # SSG: All signs
│   │   │   └── [signCode]/
│   │   │       └── page.tsx             # SSG: Sign detail
│   │   ├── lessons/
│   │   │   ├── page.tsx                 # SSG: All lessons
│   │   │   └── [lessonCode]/
│   │   │       └── page.tsx             # SSG: Lesson detail
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts         # NextAuth (optional)
│   │   ├── layout.tsx                   # Root layout
│   │   ├── page.tsx                     # Homepage
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                          # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── chip.tsx
│   │   │   └── tabs.tsx
│   │   ├── exam/
│   │   │   ├── exam-timer.tsx           # Client component
│   │   │   ├── question-card.tsx
│   │   │   ├── question-navigator.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   └── overview-modal.tsx
│   │   ├── analytics/
│   │   │   ├── error-pattern-card.tsx   # C1
│   │   │   ├── weak-area-card.tsx       # C2
│   │   │   └── recommendation-widget.tsx
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── language-selector.tsx    # Client component
│   │   └── shared/
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       └── seo-head.tsx
│   ├── lib/
│   │   ├── api.ts                       # Axios client
│   │   ├── auth.ts                      # JWT helpers
│   │   ├── utils.ts                     # Utility functions
│   │   ├── constants.ts                 # App constants
│   │   └── types.ts                     # TypeScript types
│   ├── contexts/
│   │   ├── auth-context.tsx
│   │   ├── language-context.tsx
│   │   └── theme-context.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-timer.ts
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tokens.ts
│   │   └── themes.css
│   ├── messages/                        # i18n translations
│   │   ├── en.json
│   │   ├── ar.json
│   │   ├── nl.json
│   │   └── fr.json
│   └── middleware.ts                    # Route protection
├── .env.local
├── .env.production
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
5. Routing & Navigation
5.1 Public Routes (No Auth Required)
typescript
// SSG (Static Site Generation)
/                          → Homepage
/traffic-signs             → Signs library
/traffic-signs/[signCode]  → Sign detail (200+ pre-rendered pages)
/lessons                   → Lessons library
/lessons/[lessonCode]      → Lesson detail (31 pre-rendered pages)
/login                     → Login page
/register                  → Register page
5.2 Protected Routes (Auth Required)
typescript
// SSR (Server-Side Rendering) + Client Components
/dashboard                 → User dashboard
/exam                      → Exam rules & start
/exam/[id]                 → Exam questions (dynamic)
/exam/results/[id]         → Exam results
/practice                  → Practice category selection
/practice/[category]       → Difficulty selection
/practice/[category]/session/[id]  → Practice questions
/analytics/error-patterns  → Feature C1
/analytics/weak-areas      → Feature C2
/progress                  → Progress overview
/progress/categories/[code] → Category detail
/profile                   → User profile & settings
5.3 Middleware for Route Protection
typescript
// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;
  
  // Protected route prefixes
  const protectedPaths = [
    '/dashboard',
    '/exam',
    '/practice',
    '/analytics',
    '/progress',
    '/profile',
  ];
  
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  
  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to dashboard if accessing auth pages with valid token
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|pdfs).*)',
  ],
};
6. Page Specifications
6.1 Homepage (SSG)
typescript
// src/app/page.tsx (Server Component)

import { Metadata } from 'next';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { StatsSection } from '@/components/home/stats-section';
import { CTASection } from '@/components/home/cta-section';

export const metadata: Metadata = {
  title: 'ReadyRoad - Belgian Driving License Exam Prep',
  description: 'Master the Belgian driving license exam with 50 practice exams, 200+ traffic signs, and intelligent analytics.',
  openGraph: {
    title: 'ReadyRoad - Belgian Driving License Platform',
    description: 'Comprehensive exam preparation platform',
    images: ['/images/og-home.png'],
  },
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
    </main>
  );
}
Hero Section Component:

typescript
// src/components/home/hero-section.tsx

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-white py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left: Text Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Discover the{' '}
                <span className="text-primary">World's Hidden</span> Wonders
              </h1>
              <p className="text-lg text-gray-600 lg:text-xl">
                Find the unique destinations and hidden gems you've
                always wanted to discover with ReadyRoad.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg">
                  Explore Now
                </Button>
              </Link>
              <Link href="/traffic-signs">
                <Button variant="outline" size="lg" className="text-lg">
                  View Traffic Signs
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary">200+</div>
                <div className="text-sm text-gray-600">Traffic Signs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">50</div>
                <div className="text-sm text-gray-600">Practice Exams</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-gray-600">Students</div>
              </div>
            </div>
          </div>
          
          {/* Right: Image Grid */}
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-4">
              <div className="relative h-48 overflow-hidden rounded-[24px] bg-gray-200">
                <Image
                  src="/images/destinations/dest1.jpg"
                  alt="Destination 1"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-64 overflow-hidden rounded-[24px] bg-gray-200">
                <Image
                  src="/images/destinations/dest2.jpg"
                  alt="Destination 2"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="relative h-64 overflow-hidden rounded-[24px] bg-gray-200">
                <Image
                  src="/images/destinations/dest3.jpg"
                  alt="Destination 3"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 overflow-hidden rounded-[24px] bg-gray-200">
                <Image
                  src="/images/destinations/dest4.jpg"
                  alt="Destination 4"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
6.2 Dashboard Page (SSR)
typescript
// src/app/(protected)/dashboard/page.tsx

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { ProgressOverviewCard } from '@/components/dashboard/progress-overview-card';
import { QuickActionsSection } from '@/components/dashboard/quick-actions-section';
import { WeakAreasPreview } from '@/components/dashboard/weak-areas-preview';
import { RecentActivityList } from '@/components/dashboard/recent-activity-list';
import { apiClient } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Dashboard | ReadyRoad',
  description: 'Your personalized driving exam preparation dashboard',
};

async function getProgressData() {
  // Server-side data fetching
  const [progress, weakAreas, recentActivity] = await Promise.all([
    apiClient.get('/users/me/progress/overall'),
    apiClient.get('/users/me/analytics/weak-areas?limit=3'),
    apiClient.get('/users/me/exams/recent?limit=5'),
  ]);
  
  return {
    progress: progress.data,
    weakAreas: weakAreas.data.weakAreas.slice(0, 3),
    recentActivity: recentActivity.data,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  const { progress, weakAreas, recentActivity } = await getProgressData();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
        <p className="text-gray-600">Here's your progress overview</p>
      </div>
      
      <div className="space-y-8">
        {/* Progress Overview */}
        <ProgressOverviewCard data={progress} />
        
        {/* Quick Actions */}
        <QuickActionsSection />
        
        {/* Weak Areas (Feature C2 Preview) */}
        {weakAreas.length > 0 && (
          <WeakAreasPreview weakAreas={weakAreas} />
        )}
        
        {/* Recent Activity */}
        <RecentActivityList activities={recentActivity} />
      </div>
    </div>
  );
}
Progress Overview Card Component:

typescript
// src/components/dashboard/progress-overview-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProgressOverviewCardProps {
  data: {
    totalExamsTaken: number;
    averageScore: number;
    passRate: number;
    currentStreak: number;
  };
}

export function ProgressOverviewCard({ data }: ProgressOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Exams Taken"
            value={data.totalExamsTaken}
            icon="📝"
          />
          <MetricCard
            label="Average Score"
            value={`${data.averageScore.toFixed(1)}%`}
            icon="📊"
            trend={data.averageScore >= 82 ? 'up' : 'neutral'}
          />
          <MetricCard
            label="Pass Rate"
            value={`${data.passRate.toFixed(1)}%`}
            icon="✅"
            trend={data.passRate >= 70 ? 'up' : 'down'}
          />
          <MetricCard
            label="Current Streak"
            value={`${data.currentStreak} days`}
            icon="🔥"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="flex items-start space-x-3 rounded-[24px] border-2 border-gray-200 p-4">
      <div className="text-3xl">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <div className="mt-1 flex items-center text-sm">
            {trend === 'up' && (
              <span className="text-green-600">↑ Good progress</span>
            )}
            {trend === 'down' && (
              <span className="text-red-600">↓ Needs improvement</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
6.3 Exam Page - Start Exam (SSR + Client)
typescript
// src/app/(protected)/exam/page.tsx (Server Component)

import { Metadata } from 'next';
import { ExamRulesCard } from '@/components/exam/exam-rules-card';
import { StartExamButton } from '@/components/exam/start-exam-button';  // Client component
import { apiClient } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Start Exam | ReadyRoad',
  description: 'Take a Belgian driving license exam simulation',
};

async function checkExamEligibility() {
  try {
    const response = await apiClient.get('/users/me/exams/eligibility');
    return response.data;
  } catch (error) {
    return { canTakeExam: true, examsTakenToday: 0, dailyLimit: 1 };
  }
}

export default async function ExamPage() {
  const eligibility = await checkExamEligibility();
  
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Belgian Driving Exam</h1>
          <p className="mt-2 text-lg text-gray-600">
            Test your knowledge under real exam conditions
          </p>
        </div>
        
        <ExamRulesCard />
        
        {eligibility.canTakeExam ? (
          <StartExamButton />
        ) : (
          <div className="rounded-[24px] border-2 border-orange-200 bg-orange-50 p-6 text-center">
            <p className="text-lg font-semibold text-orange-800">
              Daily Limit Reached
            </p>
            <p className="mt-2 text-orange-700">
              You've taken {eligibility.examsTakenToday}/{eligibility.dailyLimit} exams today.
              Come back tomorrow!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
Exam Rules Card:

typescript
// src/components/exam/exam-rules-card.tsx (Server Component)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export function ExamRulesCard() {
  const rules = [
    { icon: '📝', text: '50 questions (randomly selected)' },
    { icon: '⏱️', text: '45 minutes time limit' },
    { icon: '✅', text: 'Pass: 41/50 correct (82%)' },
    { icon: '🔒', text: 'No answer reveal during exam' },
    { icon: '⏸️', text: 'Cannot pause or exit' },
    { icon: '🚀', text: 'Auto-submit when time expires' },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📋</span> Official Exam Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 rounded-[12px] border border-gray-200 p-3"
            >
              <span className="text-2xl">{rule.icon}</span>
              <span className="text-sm font-medium">{rule.text}</span>
            </div>
          ))}
        </div>
        
        <Alert variant="warning">
          <p className="font-semibold">⚠️ Important</p>
          <p className="mt-1 text-sm">
            This exam simulates the real Belgian driving license test.
            Once started, you cannot pause or change answers after submission.
          </p>
        </Alert>
      </CardContent>
    </Card>
  );
}
Start Exam Button (Client Component):

typescript
// src/components/exam/start-exam-button.tsx ('use client')

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export function StartExamButton() {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const handleStartExam = async () => {
    setIsStarting(true);
    
    try {
      const response = await apiClient.post('/users/me/simulations', {
        type: 'EXAM',
      });
      
      const { simulationId } = response.data;
      
      // Navigate to exam page
      router.push(`/exam/${simulationId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start exam');
      setIsStarting(false);
    }
  };
  
  return (
    <>
      <Button
        size="lg"
        className="w-full text-xl"
        onClick={() => setShowConfirmDialog(true)}
      >
        Start Exam
      </Button>
      
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Exam?</DialogTitle>
            <DialogDescription>
              Once started, you cannot pause the exam. You have 45 minutes
              to complete 50 questions. Are you ready?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStartExam} isLoading={isStarting}>
              Yes, Start Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
6.4 Exam Questions Page (Client Component)
typescript
// src/app/(protected)/exam/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExamTimer } from '@/components/exam/exam-timer';
import { QuestionCard } from '@/components/exam/question-card';
import { QuestionNavigator } from '@/components/exam/question-navigator';
import { ProgressBar } from '@/components/exam/progress-bar';
import { OverviewDialog } from '@/components/exam/overview-dialog';
import { SubmitConfirmDialog } from '@/components/exam/submit-confirm-dialog';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: Array<{
    number: 1 | 2 | 3;
    textEn: string;
    textAr: string;
    textNl: string;
    textFr: string;
  }>;
}

interface ExamState {
  simulationId: number;
  questions: Question[];
  answers: Record<number, number>;
  currentQuestionIndex: number;
  expiresAt: string;
  timeLimitMinutes: number;
}

export default function ExamQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const simulationId = parseInt(params.id as string);
  
  const [examState, setExamState] = useState<ExamState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverview, setShowOverview] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load exam data
  useEffect(() => {
    loadExamData();
  }, [simulationId]);
  
  // Auto-save answers to localStorage
  useEffect(() => {
    if (examState) {
      localStorage.setItem(
        `exam_${simulationId}_answers`,
        JSON.stringify(examState.answers)
      );
    }
  }, [examState?.answers, simulationId]);
  
  async function loadExamData() {
    try {
      const response = await apiClient.get(`/users/me/simulations/${simulationId}`);
      const data = response.data;
      
      // Restore answers from localStorage if available
      const savedAnswers = localStorage.getItem(`exam_${simulationId}_answers`);
      const answers = savedAnswers ? JSON.parse(savedAnswers) : {};
      
      setExamState({
        simulationId: data.simulationId,
        questions: data.questions,
        answers,
        currentQuestionIndex: 0,
        expiresAt: data.expiresAt,
        timeLimitMinutes: data.timeLimitMinutes,
      });
      setIsLoading(false);
    } catch (error: any) {
      toast.error('Failed to load exam');
      router.push('/exam');
    }
  }
  
  function handleAnswerSelect(questionId: number, optionNumber: number) {
    if (!examState) return;
    
    setExamState({
      ...examState,
      answers: {
        ...examState.answers,
        [questionId]: optionNumber,
      },
    });
  }
  
  function navigateToQuestion(index: number) {
    if (!examState) return;
    setExamState({ ...examState, currentQuestionIndex: index });
  }
  
  async function handleSubmitExam() {
    if (!examState) return;
    
    setIsSubmitting(true);
    
    try {
      const answersArray = Object.entries(examState.answers).map(([questionId, optionNumber]) => ({
        questionId: parseInt(questionId),
        selectedOption: optionNumber,
      }));
      
      const response = await apiClient.put(`/users/me/simulations/${simulationId}`, {
        answers: answersArray,
      });
      
      // Clear localStorage
      localStorage.removeItem(`exam_${simulationId}_answers`);
      
      // Navigate to results
      router.push(`/exam/results/${simulationId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit exam');
      setIsSubmitting(false);
    }
  }
  
  function handleTimeExpired() {
    toast.warning('Time expired! Submitting exam...');
    handleSubmitExam();
  }
  
  if (isLoading || !examState) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = examState.questions[examState.currentQuestionIndex];
  const isLastQuestion = examState.currentQuestionIndex === examState.questions.length - 1;
  const answeredCount = Object.keys(examState.answers).length;
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              Question {examState.currentQuestionIndex + 1} of {examState.questions.length}
            </h2>
          </div>
          
          <ExamTimer
            expiresAt={new Date(examState.expiresAt)}
            onTimeExpired={handleTimeExpired}
          />
        </div>
        
        <ProgressBar
          current={examState.currentQuestionIndex + 1}
          total={examState.questions.length}
        />
      </header>
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={examState.answers[currentQuestion.id]}
            onAnswerSelect={(option) => handleAnswerSelect(currentQuestion.id, option)}
          />
        </div>
      </main>
      
      {/* Footer Navigation */}
      <footer className="sticky bottom-0 border-t bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <QuestionNavigator
            currentIndex={examState.currentQuestionIndex}
            totalQuestions={examState.questions.length}
            onPrevious={() => navigateToQuestion(examState.currentQuestionIndex - 1)}
            onNext={() => navigateToQuestion(examState.currentQuestionIndex + 1)}
            onOverview={() => setShowOverview(true)}
            onSubmit={() => setShowSubmitDialog(true)}
            isLastQuestion={isLastQuestion}
          />
        </div>
      </footer>
      
      {/* Overview Dialog */}
      <OverviewDialog
        open={showOverview}
        onOpenChange={setShowOverview}
        questions={examState.questions}
        answers={examState.answers}
        currentIndex={examState.currentQuestionIndex}
        onQuestionSelect={(index) => {
          navigateToQuestion(index);
          setShowOverview(false);
        }}
      />
      
      {/* Submit Confirm Dialog */}
      <SubmitConfirmDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        answeredCount={answeredCount}
        totalQuestions={examState.questions.length}
        onConfirm={handleSubmitExam}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

