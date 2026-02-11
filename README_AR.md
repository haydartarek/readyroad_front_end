# 🎨 ReadyRoad Web Frontend

## 🚀 البدء السريع

### المتطلبات
- ✅ Node.js (مثبت)
- ✅ npm (مثبت)
- ✅ Backend يشتغل على http://localhost:8890

### التشغيل (خطوتين فقط!)

#### 1️⃣ شغّل Backend (terminal 1)
```powershell
cd C:\Users\heyde\Desktop\end_project\readyroad
.\QUICK-RUN.ps1
```

#### 2️⃣ شغّل Frontend (terminal 2)
```powershell
cd C:\Users\heyde\Desktop\end_project\readyroad_front_end
.\START-FRONTEND.ps1
```

**المتصفح راح يفتح تلقائياً على:** http://localhost:3000

---

## 📂 بنية المشروع

```
readyroad_front_end/
├── web_app/                    # Next.js Application
│   ├── src/
│   │   ├── app/                # App Router (Next.js 13+)
│   │   │   ├── (auth)/        # Authentication pages
│   │   │   │   ├── login/     # Login page
│   │   │   │   └── register/  # Registration page
│   │   │   ├── (protected)/   # Protected routes (require login)
│   │   │   │   ├── dashboard/ # Dashboard page
│   │   │   │   ├── exam/      # Exam flow
│   │   │   │   ├── practice/  # Practice mode
│   │   │   │   ├── progress/  # Progress tracking
│   │   │   │   ├── analytics/ # Analytics page
│   │   │   │   └── profile/   # User profile
│   │   │   ├── admin/         # Admin panel
│   │   │   ├── lessons/       # Lessons (public)
│   │   │   ├── traffic-signs/ # Traffic signs (public)
│   │   │   ├── api/           # API routes
│   │   │   ├── layout.tsx     # Root layout
│   │   │   └── page.tsx       # Homepage
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts (Auth, Theme, etc.)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities & helpers
│   │   └── styles/            # Global styles
│   ├── public/                # Static assets
│   ├── .env.local             # Environment variables
│   └── package.json           # Dependencies
│
├── mobile_app/                # Flutter Mobile App
├── START-FRONTEND.ps1         # Frontend startup script
├── FRONTEND_TESTING_RESULTS.md # Testing checklist
└── QUICK_START_GUIDE.md       # Quick start guide
```

---

## 🎯 الصفحات المتوفرة

### 🌐 Public Pages (بدون تسجيل دخول)
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Homepage | `/` | الصفحة الرئيسية |
| Login | `/login` | تسجيل الدخول |
| Register | `/register` | إنشاء حساب جديد |
| Lessons | `/lessons` | دروس القيادة (31 درس) |
| Traffic Signs | `/traffic-signs` | علامات المرور (231 علامة) |
| Terms | `/terms` | الشروط والأحكام |
| Privacy | `/privacy-policy` | سياسة الخصوصية |

### 🔒 Protected Pages (تحتاج login)
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Dashboard | `/dashboard` | لوحة التحكم |
| Exam | `/exam` | الامتحان (50 سؤال، 30 دقيقة) |
| Practice | `/practice` | التمرين (حسب الفئة) |
| Progress | `/progress` | متابعة التقدم |
| Analytics | `/analytics` | تحليلات مفصلة |
| Profile | `/profile` | الملف الشخصي |

### 👑 Admin Pages
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Admin Panel | `/admin` | لوحة الإدارة |

---

## 🔐 بيانات الاختبار

```
Username: admin
Password: Admin2026Secure!
```

---

## 🛠️ التقنيات المستخدمة

### Frontend Stack
- **Framework:** Next.js 16.1.4 (App Router)
- **UI Library:** React 19.2.3
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui (Radix UI)
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Notifications:** Sonner

### Development Tools
- **Linting:** ESLint 9
- **Testing:** Jest 29 + React Testing Library
- **Package Manager:** npm

---

## 📡 API Integration

### Backend Configuration
```env
NEXT_PUBLIC_API_URL=http://localhost:8890
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API Endpoints Used
```
Authentication:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/refresh

Exam:
  GET  /api/exams/can-start
  POST /api/exams/start
  GET  /api/exams/active
  PUT  /api/exams/{id}/submit
  GET  /api/exams/{id}/results

Practice:
  GET  /api/practice/categories
  GET  /api/practice/question/{category}
  POST /api/practice/answer

Content:
  GET  /api/lessons
  GET  /api/lessons/{id}
  GET  /api/traffic-signs
  GET  /api/traffic-signs/{id}

User:
  GET  /api/users/me
  GET  /api/users/statistics
  PUT  /api/users/profile
```

---

## 🌍 اللغات المدعومة

- 🇸🇦 العربية (Arabic) - RTL
- 🇬🇧 English - LTR
- 🇫🇷 Français (French) - LTR
- 🇳🇱 Nederlands (Dutch) - LTR

---

## 📝 Scripts المتوفرة

```powershell
# Development (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

---

## 🧪 Testing

### Run Frontend Tests
```powershell
cd web_app
npm test
```

### Manual Testing Checklist
راجع الملف: `FRONTEND_TESTING_RESULTS.md`

---

## 🔧 Development Workflow

### 1. إضافة صفحة جديدة
```bash
# مثال: إضافة صفحة "About"
cd src/app
mkdir about
# أنشئ page.tsx في about/
```

### 2. إضافة component جديد
```bash
cd src/components
# أنشئ ملف component
# مثال: MyComponent.tsx
```

### 3. إضافة API route
```bash
cd src/app/api
mkdir my-endpoint
# أنشئ route.ts
```

---

## 🐛 Troubleshooting

### المشكلة: "Cannot connect to backend"
```powershell
# الحل: تأكد أن Backend شغال
cd C:\Users\heyde\Desktop\end_project\readyroad
.\QUICK-RUN.ps1
```

### المشكلة: "Module not found"
```powershell
# الحل: أعد تثبيت dependencies
cd web_app
rm -r node_modules
npm install
```

### المشكلة: "Port 3000 already in use"
```powershell
# الحل: غير البورت
# في terminal:
$env:PORT=3001
npm run dev
```

### المشكلة: "CORS error"
```
تحقق من CORS configuration في Backend:
- application.yml
- CorsConfig.java
```

---

## 📊 Next Steps بعد الاختبار

### إذا Frontend يشتغل جيد (80%+)
1. ✅ إصلاح bugs (يومين)
2. ✅ تحسين UI/UX (يوم)
3. ✅ Testing شامل (يوم)
→ **Total: 4 أيام**

### إذا بعض الصفحات ناقصة (50-80%)
1. ⚠️  إكمال Core features (3 أيام)
2. ⚠️  Secondary features (2 أيام)
3. ⚠️  Polish & testing (يوم)
→ **Total: 6 أيام**

### إذا الكثير ناقص (< 50%)
1. 🔨 تحديد المطلوب بالضبط
2. 🔨 تقسيم العمل
3. 🔨 تطوير تدريجي
→ **Total: ~10 أيام**

---

## 📞 Resources

### Documentation
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

### Project Files
- `FRONTEND_TESTING_RESULTS.md` - نتائج الاختبار
- `QUICK_START_GUIDE.md` - دليل سريع
- `README.md` - Documentation (English)

---

## ✅ Current Status

```
📊 Project Status: Testing Phase
🎯 Next Action: Frontend Testing & Evaluation
⏱️  Time Required: 30-45 minutes
📝 Output: Detailed testing report
```

---

**🚀 Ready to start? Run `.\START-FRONTEND.ps1` now!**
