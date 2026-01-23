# 📱 تشغيل ReadyRoad مع Android Studio

## ✅ الطريقة 1: فتح المشروع في Android Studio

### الخطوات:

#### 1. افتح Android Studio
```
Start Menu → Android Studio
```

#### 2. افتح المشروع
```
File → Open

ثم اختر المجلد:
C:\Users\fqsdg\IdeaProjects\readyroad\mobile_app
```

#### 3. انتظر Sync
```
Android Studio سيقوم بـ:
- Gradle sync
- Download dependencies
- Index files

قد يستغرق 2-5 دقائق في المرة الأولى
```

#### 4. تشغيل Backend
```powershell
# في Terminal داخل Android Studio (أو PowerShell خارجي):
cd C:\Users\fqsdg\IdeaProjects\readyroad
.\mvnw.cmd spring-boot:run
```

#### 5. اختر Device
```
في شريط الأدوات العلوي، اختر:
- Chrome (للويب)
- أو Android Emulator (إذا كان متاحاً)
- أو جهاز Android متصل
```

#### 6. Run
```
اضغط الزر الأخضر ▶️ (Run)
أو اضغط: Shift + F10
```

---

## 🌐 الطريقة 2: تشغيل Web Version من Android Studio

### الأسرع! (بدون Android SDK)

```
1. افتح Android Studio
2. Open Project: mobile_app
3. Terminal (Alt + F12)
4. اكتب:
   flutter run -d chrome

5. انتظر... التطبيق سيفتح في Chrome!
```

---

## 📱 الطريقة 3: تشغيل على Android Emulator

### المتطلبات:
```
☐ Android Studio مثبت
☐ Android SDK مثبت
☐ Android Emulator جاهز
```

### الخطوات:

#### 1. إنشاء Emulator (إذا لم يكن موجوداً):
```
Tools → Device Manager → Create Device
→ اختر Phone (مثل: Pixel 6)
→ اختر System Image (مثل: Android 13 - API 33)
→ Finish
```

#### 2. تشغيل Emulator:
```
Device Manager → اضغط ▶️ بجانب الجهاز
انتظر حتى يفتح الإيميوليتر (1-2 دقيقة)
```

#### 3. تشغيل التطبيق:
```
في Android Studio:
- اختر الـ Emulator من القائمة العلوية
- اضغط Run ▶️
```

#### 4. انتظر Build (أول مرة: 5-10 دقائق)
```
Android Studio سيقوم بـ:
- Build APK
- Install على الإيميوليتر
- Launch التطبيق
```

---

## 🔧 Setup Android Studio (إذا لم يكن جاهزاً)

### تثبيت Android SDK:

```
1. افتح Android Studio
2. File → Settings (أو Ctrl + Alt + S)
3. Appearance & Behavior → System Settings → Android SDK
4. SDK Platforms → حدد:
   ☑ Android 13.0 (API 33)
   ☑ Android 12.0 (API 31)
5. SDK Tools → حدد:
   ☑ Android SDK Build-Tools
   ☑ Android SDK Command-line Tools
   ☑ Android Emulator
   ☑ Android SDK Platform-Tools
6. Apply → OK
7. انتظر التحميل والتثبيت (5-15 دقيقة)
```

---

## 🚀 Terminal Commands في Android Studio

### افتح Terminal في Android Studio:
```
View → Tool Windows → Terminal
أو اضغط: Alt + F12
```

### Commands المفيدة:

```bash
# تشغيل على Chrome
flutter run -d chrome

# تشغيل على Android
flutter run -d android

# عرض الأجهزة المتاحة
flutter devices

# Build APK
flutter build apk --release

# تنظيف Build
flutter clean

# تحديث Dependencies
flutter pub get

# فحص Flutter
flutter doctor
```

---

## 📊 Structure المشروع في Android Studio

عند فتح المشروع سترى:

```
mobile_app/
├── android/           ← Android-specific files
├── ios/              ← iOS-specific files
├── lib/              ← 🎯 كود Dart (الأهم!)
│   ├── main.dart
│   ├── core/
│   ├── features/
│   └── shared/
├── web/              ← Web-specific files
├── pubspec.yaml      ← Dependencies
└── README.md
```

---

## 🎯 Hot Reload في Android Studio

أثناء التطوير:

```
بعد تغيير الكود:
- اضغط: Ctrl + \ (أو ⚡ في Toolbar)
- أو اكتب في Terminal: r

التطبيق سيتحدث فوراً بدون إعادة تشغيل! ✨
```

---

## 🐛 Debugging في Android Studio

### تشغيل Debug Mode:

```
1. اضغط Debug 🐛 (بدلاً من Run ▶️)
2. أو اضغط: Shift + F9
3. ضع Breakpoints في الكود (اضغط على الرقم في الجانب)
4. التطبيق سيتوقف عند الـ Breakpoint
5. يمكنك فحص المتغيرات والـ State
```

---

## ⚡ Quick Run Options

### في Android Studio، يمكنك:

#### Run Configurations:
```
Run → Edit Configurations → +
→ Flutter
→ اختر:
   - Target: lib/main.dart
   - Device: Chrome / Android
   - Build flavor: (اتركه فارغاً)
```

#### Create Shortcut:
```
Ctrl + Shift + A
→ اكتب: "Run"
→ Assign Shortcut
```

---

## 📱 تشغيل على جهاز Android حقيقي

### الخطوات:

```
1. في الهاتف:
   Settings → About Phone
   → اضغط 7 مرات على "Build Number"
   → Developer Options ستظهر

2. Developer Options:
   → ☑ USB Debugging

3. وصّل الهاتف بالكمبيوتر (USB Cable)

4. على الهاتف:
   → اقبل "Allow USB debugging"

5. في Android Studio:
   → سترى الجهاز في القائمة
   → اختره واضغط Run ▶️
```

---

## 🔍 Flutter في Android Studio

### Extensions الموصى بها:

```
File → Settings → Plugins
ثبّت:
☑ Flutter
☑ Dart
```

### Flutter Commands في Android Studio:

```
Tools → Flutter → Flutter Doctor
Tools → Flutter → Flutter Upgrade
Tools → Flutter → Flutter Clean
```

---

## 📦 Build APK من Android Studio

### الطريقة السهلة:

```
1. في Terminal:
   flutter build apk --release

2. الملف سيكون في:
   build\app\outputs\flutter-apk\app-release.apk

3. حجمه: ~15 MB
```

### أو من Menu:

```
Build → Flutter → Build APK
```

---

## 🎨 UI Preview في Android Studio

### لمعاينة الـ Widgets:

```
1. افتح أي ملف .dart
2. في الجانب الأيمن: Flutter Outline
3. ترى شجرة الـ Widgets
4. يمكنك:
   - إعادة ترتيبها
   - حذف/إضافة Widgets
   - تغيير Properties
```

---

## ⚙️ تكوين Android Studio للـ Flutter

### Settings الموصى بها:

```
File → Settings → Languages & Frameworks → Flutter

☑ Format code on save
☑ Organize imports on save
☑ Enable hot reload
☑ Perform hot reload on save

Flutter SDK path:
C:\flutter
```

---

## 🆘 مشاكل شائعة وحلولها

### المشكلة 1: "Flutter SDK not found"
**الحل:**
```
File → Settings → Languages & Frameworks → Flutter
→ Flutter SDK path: C:\flutter
→ Apply
```

### المشكلة 2: "Android SDK not found"
**الحل:**
```
File → Settings → Android SDK
→ Android SDK Location: C:\Users\[USER]\AppData\Local\Android\sdk
→ Apply
```

### المشكلة 3: "Gradle sync failed"
**الحل:**
```
File → Invalidate Caches → Invalidate and Restart
```

### المشكلة 4: Build بطيء جداً
**الحل:**
```
File → Settings → Build, Execution, Deployment → Compiler
→ زود: Build process heap size: 2048 MB
```

---

## 📊 Performance Tips

### لتسريع Development:

```
1. استخدم Web للتطوير السريع:
   flutter run -d chrome
   (أسرع من Android Emulator)

2. استخدم Hot Reload بدلاً من Restart

3. Debug Mode للتطوير فقط
   Release Mode للـ Production

4. استخدم جهاز حقيقي بدلاً من Emulator
   (أسرع وأوفر في الـ RAM)
```

---

## ✅ Checklist قبل Run

```
☐ Android Studio مفتوح
☐ المشروع mobile_app مفتوح
☐ Flutter و Dart plugins مثبتين
☐ Backend يعمل (Port 8888)
☐ Device/Emulator جاهز
☐ Terminal جاهز
```

---

## 🚀 Quick Start Summary

### أسرع طريقة:

```
1. افتح Android Studio
2. Open: mobile_app
3. Terminal: flutter run -d chrome
4. Done! ✨
```

---

**جاهز للتطوير في Android Studio! 🎉**

لأي أسئلة، راجع: TROUBLESHOOTING.md

