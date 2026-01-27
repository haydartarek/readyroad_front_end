# 🚀 ReadyRoad Launch Checklist

**تاريخ:** 27 يناير 2026  
**الهدف:** إطلاق المنتج للعامة (Production Release)

---

## 📊 الوضع الحالي

### ✅ Backend - 100% جاهز

- ✅ Spring Boot 4.0.1
- ✅ JWT Authentication
- ✅ MySQL Database
- ✅ 192 اختبار ناجح
- ✅ جميع الـ Endpoints تعمل

### ✅ Web App - 100% جاهز

- ✅ Next.js 16.1.4 + React 19
- ✅ 20+ صفحة كاملة
- ✅ 4 لغات (EN, AR, NL, FR)
- ✅ 29 اختبار ناجح
- ✅ API Integration كامل

### 🟡 Flutter App - 95% جاهز

- ✅ Architecture جاهز
- ✅ API Integration يعمل
- ✅ JWT يعمل
- 🔄 يحتاج: UI polish + اختبارات

---

## 📋 المهام المتبقية قبل الإطلاق

### 🎯 المرحلة 1: Flutter Final Polish (2-3 ساعات)

#### 1.1 مراجعة الشاشات الأساسية ✅ [اختياري]

**الهدف:** تطابق مع design system

**الشاشات:**

- [ ] Login Screen
  - تحقق من اللون الأساسي #DF5830
  - تحقق من border radius: 24px
  - تأكد من RTL للعربية
  
- [ ] Dashboard Screen
  - ألوان Progress bars صحيحة
  - Typography متسق
  - RTL يعمل بدون مشاكل
  
- [ ] Exam Screen
  - Timer واضح ومتباين
  - Navigation buttons سهلة الاستخدام
  - Submit dialog واضح

**الأوامر:**

```bash
cd mobile_app
flutter run -d chrome  # للمراجعة السريعة
```

---

#### 1.2 اختبارات Flutter الأساسية ✅ [اختياري]

**الهدف:** تغطية use-cases أساسية

**الاختبارات المطلوبة (5 اختبارات):**

```dart
// test/auth_test.dart
1. ✓ تسجيل دخول ناجح
2. ✓ تسجيل دخول فاشل (بيانات خاطئة)

// test/exam_test.dart
3. ✓ بدء امتحان جديد
4. ✓ إجابة سؤال وحفظ الإجابة
5. ✓ إرسال امتحان كامل
```

**الأوامر:**

```bash
cd mobile_app
flutter test
```

**الهدف:** 5+ اختبارات ناجحة

---

### 🎯 المرحلة 2: End-to-End Testing (1-2 ساعات)

#### 2.1 سيناريو المستخدم الجديد

**الهدف:** التأكد من تزامن البيانات بين المنصات

##### ✅ Web Testing

1. [ ] افتح الموقع: `http://localhost:3000`
2. [ ] سجّل مستخدم جديد:
   - Email: `testuser@example.com`
   - Password: `Test@1234`
3. [ ] سجّل دخول
4. [ ] ابدأ Practice Mode:
   - أجب على 5 أسئلة
5. [ ] اذهب لـ Dashboard:
   - تحقق من Progress: يجب أن يظهر 5 أسئلة مجابة
6. [ ] سجّل خروج

##### ✅ Mobile Testing

1. [ ] افتح التطبيق على الموبايل
2. [ ] سجّل دخول بنفس البيانات:
   - Email: `testuser@example.com`
   - Password: `Test@1234`
3. [ ] تحقق من Dashboard:
   - يجب أن يظهر نفس الـ Progress (5 أسئلة)
4. [ ] أكمل Practice:
   - أجب على 5 أسئلة إضافية
5. [ ] سجّل خروج

##### ✅ التحقق النهائي

1. [ ] ارجع للويب
2. [ ] سجّل دخول مرة أخرى
3. [ ] تحقق من Dashboard:
   - يجب أن يظهر 10 أسئلة مجابة (5 ويب + 5 موبايل)

**النتيجة المتوقعة:** ✅ التقدم متطابق بين المنصتين

---

### 🎯 المرحلة 3: Production Configuration (1 ساعة)

#### 3.1 Backend Configuration

**ملف:** `readyroad/src/main/resources/application-prod.properties`

```properties
# Database (استبدل بـ production DB)
spring.datasource.url=jdbc:mysql://<your-production-db>:3306/readyroad_db
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# JWT (استبدل بـ secret قوي)
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000

# CORS (استبدل بـ domain الفعلي)
cors.allowed-origins=https://readyroad.com,https://www.readyroad.com

# Production settings
spring.jpa.show-sql=false
logging.level.com.readyroad=INFO
```

**Environment Variables:**

```bash
# أضف في production server
export DB_USERNAME=your_db_user
export DB_PASSWORD=your_db_password
export JWT_SECRET=your-super-secret-jwt-key-at-least-256-bits-long
```

**تشغيل:**

```bash
cd readyroad
mvn clean package -DskipTests
java -jar -Dspring.profiles.active=prod target/readyroad-backend-1.0.jar
```

---

#### 3.2 Web App Configuration

**ملف:** `web_app/.env.production`

```bash
# API Base URL (استبدل بـ backend URL الفعلي)
NEXT_PUBLIC_API_BASE_URL=https://api.readyroad.com

# App URL
NEXT_PUBLIC_APP_URL=https://readyroad.com

# Analytics (اختياري)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

**Build:**

```bash
cd web_app
npm run build
npm start  # أو استخدم Vercel/Netlify
```

---

#### 3.3 Flutter App Configuration

**ملف:** `mobile_app/lib/core/constants/api_config.dart`

```dart
class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://10.0.2.2:8080';
  
  // Production
  static const String prodBaseUrl = 'https://api.readyroad.com';
  
  // Current environment
  static const bool isProduction = bool.fromEnvironment('PRODUCTION');
  static String get baseUrl => isProduction ? prodBaseUrl : devBaseUrl;
}
```

**Build للإنتاج:**

```bash
cd mobile_app

# Android
flutter build apk --release --dart-define=PRODUCTION=true
# Output: build/app/outputs/flutter-apk/app-release.apk

# iOS (على macOS)
flutter build ios --release --dart-define=PRODUCTION=true
```

---

### 🎯 المرحلة 4: Build Scripts (30 دقيقة)

#### 4.1 Backend Build Script

**ملف:** `readyroad/build-production.sh` (Linux/Mac)

```bash
#!/bin/bash
echo "🔨 Building ReadyRoad Backend..."

# Clean
mvn clean

# Run tests
echo "Running tests..."
mvn test

# Package
echo "Building JAR..."
mvn package -DskipTests

echo "✅ Build complete: target/readyroad-backend-1.0.jar"
```

**Windows:** `readyroad/build-production.ps1`

```powershell
Write-Host "🔨 Building ReadyRoad Backend..." -ForegroundColor Green

# Clean
mvn clean

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
mvn test

# Package
Write-Host "Building JAR..." -ForegroundColor Yellow
mvn package -DskipTests

Write-Host "✅ Build complete: target/readyroad-backend-1.0.jar" -ForegroundColor Green
```

---

#### 4.2 Web Build Script

**ملف:** `web_app/build-production.sh`

```bash
#!/bin/bash
echo "🔨 Building ReadyRoad Web App..."

# Install dependencies
npm install

# Run tests
echo "Running tests..."
npm test

# Build
echo "Building for production..."
npm run build

echo "✅ Build complete: .next/"
```

**Windows:** `web_app/build-production.ps1`

```powershell
Write-Host "🔨 Building ReadyRoad Web App..." -ForegroundColor Green

# Install dependencies
npm install

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
npm test

# Build
Write-Host "Building for production..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Build complete: .next/" -ForegroundColor Green
```

---

#### 4.3 Mobile Build Script

**ملف:** `mobile_app/build-production.sh`

```bash
#!/bin/bash
echo "🔨 Building ReadyRoad Mobile App..."

# Clean
flutter clean

# Get dependencies
flutter pub get

# Run tests (optional)
# flutter test

# Build Android
echo "Building Android APK..."
flutter build apk --release --dart-define=PRODUCTION=true

# Build Android App Bundle (for Play Store)
echo "Building Android App Bundle..."
flutter build appbundle --release --dart-define=PRODUCTION=true

echo "✅ Builds complete:"
echo "   - APK: build/app/outputs/flutter-apk/app-release.apk"
echo "   - AAB: build/app/outputs/bundle/release/app-release.aab"
```

**Windows:** `mobile_app/build-production.ps1`

```powershell
Write-Host "🔨 Building ReadyRoad Mobile App..." -ForegroundColor Green

# Clean
flutter clean

# Get dependencies
flutter pub get

# Build Android
Write-Host "Building Android APK..." -ForegroundColor Yellow
flutter build apk --release --dart-define=PRODUCTION=true

# Build Android App Bundle
Write-Host "Building Android App Bundle..." -ForegroundColor Yellow
flutter build appbundle --release --dart-define=PRODUCTION=true

Write-Host "✅ Builds complete:" -ForegroundColor Green
Write-Host "   - APK: build/app/outputs/flutter-apk/app-release.apk"
Write-Host "   - AAB: build/app/outputs/bundle/release/app-release.aab"
```

---

## 🎯 المرحلة 5: Deployment Checklist

### 5.1 Backend Deployment

**خيارات:**

#### Option 1: AWS EC2

```bash
# Upload JAR
scp target/readyroad-backend-1.0.jar ec2-user@your-server:~/

# SSH to server
ssh ec2-user@your-server

# Run with environment variables
export DB_USERNAME=...
export DB_PASSWORD=...
export JWT_SECRET=...
nohup java -jar -Dspring.profiles.active=prod readyroad-backend-1.0.jar > app.log 2>&1 &
```

#### Option 2: DigitalOcean Droplet

```bash
# Similar to AWS EC2
# Use systemd service for auto-restart
```

#### Option 3: Railway/Render/Heroku

- رفع الكود على Git
- ربط Repository مع Platform
- إضافة Environment Variables
- Deploy تلقائي

**الـ Checklist:**

- [ ] Database جاهزة ومُفعّلة
- [ ] SSL Certificate نشط (HTTPS)
- [ ] Environment Variables مضبوطة
- [ ] Health check endpoint يعمل: `/actuator/health`
- [ ] Logs تُحفظ بشكل صحيح

---

### 5.2 Web App Deployment

**الخيار المثالي: Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd web_app
vercel --prod
```

**Environment Variables في Vercel:**

```
NEXT_PUBLIC_API_BASE_URL=https://api.readyroad.com
NEXT_PUBLIC_APP_URL=https://readyroad.com
```

**الـ Checklist:**

- [ ] Domain مربوط (readyroad.com)
- [ ] SSL تلقائي من Vercel ✅
- [ ] Environment Variables مضبوطة
- [ ] Build ناجح
- [ ] الموقع يفتح بدون أخطاء

**البدائل:**

- Netlify
- AWS Amplify
- Cloudflare Pages

---

### 5.3 Mobile App Deployment

#### Android (Google Play Store)

**الخطوات:**

1. [ ] افتح [Google Play Console](https://play.google.com/console)
2. [ ] أنشئ تطبيق جديد
3. [ ] املأ بيانات التطبيق:
   - اسم التطبيق
   - الوصف (بالعربية والإنجليزية)
   - Screenshots (على الأقل 4)
   - Icon (512×512)
4. [ ] ارفع App Bundle:

   ```
   build/app/outputs/bundle/release/app-release.aab
   ```

5. [ ] اختر Content Rating
6. [ ] اختر Target Audience
7. [ ] أرسل للمراجعة

**المدة:** 2-7 أيام للمراجعة

#### iOS (App Store)

**الخطوات:**

1. [ ] Developer Account (99$/سنة)
2. [ ] Build على Xcode
3. [ ] Upload عبر App Store Connect
4. [ ] املأ البيانات
5. [ ] أرسل للمراجعة

**المدة:** 2-7 أيام للمراجعة

---

## 📦 الـ Quick Launch Plan (خطة سريعة)

### إذا تريد الإطلاق اليوم

#### 1️⃣ Backend (30 دقيقة)

```bash
# على Railway.app
1. سجّل حساب على Railway.app
2. New Project → Deploy from GitHub
3. أضف MySQL Database
4. أضف Environment Variables
5. Deploy تلقائي
```

#### 2️⃣ Web (15 دقيقة)

```bash
# على Vercel
cd web_app
vercel login
vercel --prod
# أضف Environment Variables في Dashboard
```

#### 3️⃣ Mobile (اختياري)

```bash
# TestFlight / Firebase App Distribution للتجربة
cd mobile_app
flutter build apk --release
# شارك الـ APK مع المستخدمين للتجربة
```

**إجمالي الوقت:** ساعة واحدة للإطلاق التجريبي! 🚀

---

## ✅ Final Launch Checklist

### قبل الإطلاق مباشرة

- [ ] **Backend:**
  - [ ] 192 اختبار ناجح ✅
  - [ ] Database production جاهزة
  - [ ] Environment variables مضبوطة
  - [ ] Health check يعمل
  - [ ] Deployed وشغال

- [ ] **Web App:**
  - [ ] 29 اختبار ناجح ✅
  - [ ] API integration يعمل مع backend الحقيقي
  - [ ] جميع الصفحات تفتح
  - [ ] 4 لغات تعمل
  - [ ] Deployed وشغال

- [ ] **Mobile App:**
  - [ ] Login يعمل
  - [ ] Exam يعمل
  - [ ] Practice يعمل
  - [ ] Data sync مع backend
  - [ ] APK جاهز للتوزيع

- [ ] **Security:**
  - [ ] HTTPS فعّال على Backend
  - [ ] HTTPS فعّال على Frontend
  - [ ] JWT secret قوي ومخفي
  - [ ] Database credentials مخفية

- [ ] **Monitoring:**
  - [ ] Backend logs تُحفظ
  - [ ] Frontend errors tracking (Sentry اختياري)
  - [ ] Database backups مُفعّلة

---

## 🎉 الخطوة التالية معك

**اختر واحد:**

### Option A: Flutter Polish ⚡

```
سأراجع معك:
- 3 شاشات أساسية (Login, Dashboard, Exam)
- تطابق design system
- RTL للعربية
- سأكتب 5 اختبارات flutter
```

### Option B: Production Setup 🔧

```
سأساعدك في:
- إعداد environment variables
- كتابة build scripts
- إعداد الـ configuration files
```

### Option C: Deploy Now! 🚀

```
سأساعدك في:
- Deploy Backend على Railway
- Deploy Frontend على Vercel
- توزيع Mobile APK
- الإطلاق في ساعة واحدة!
```

---

**أخبرني: A, B, أو C؟** 🎯
