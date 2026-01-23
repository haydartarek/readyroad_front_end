# 🚀 فتح التطبيق من Android Studio - خطوات سريعة

## ✅ خطوات الفتح (5 دقائق):

### الخطوة 1: افتح Android Studio
```
Start Menu → Android Studio
(أو من سطح المكتب إذا كان موجوداً)
```

---

### الخطوة 2: افتح المشروع
```
في شاشة الترحيب:
1. اضغط "Open"
2. انتقل إلى:
   C:\Users\fqsdg\IdeaProjects\readyroad\mobile_app
3. اضغط "OK"

أو إذا كان Android Studio مفتوحاً:
File → Open
→ اختر: C:\Users\fqsdg\IdeaProjects\readyroad\mobile_app
```

---

### الخطوة 3: انتظر Gradle Sync (دقيقتين)
```
في الأسفل سترى:
"Gradle sync in progress..."

انتظر حتى تنتهي وترى:
"Gradle sync completed"
```

---

### الخطوة 4: افتح Terminal في Android Studio
```
في الأسفل:
- اضغط "Terminal"
- أو اضغط: Alt + F12

سترى Command Prompt أو PowerShell
```

---

### الخطوة 5: شغّل التطبيق
```
في Terminal، اكتب:

flutter run -d chrome

ثم اضغط Enter
```

---

### الخطوة 6: انتظر (30 ثانية)
```
سترى:
- Launching lib\main.dart on Chrome...
- Building application...
- Chrome سيفتح تلقائياً!
```

---

## 🎉 تم! التطبيق شغّال!

يجب أن يفتح Chrome ويعرض ReadyRoad مع:
- 9 فئات
- أزرار في الأعلى
- زر Quiz في الأسفل

---

## 🔥 Hot Reload (للتطوير):

بعد تغيير أي كود:
```
اضغط في Terminal: r
أو اضغط: Ctrl + \

التطبيق سيتحدث فوراً! ✨
```

---

## 📱 إذا أردت Android Emulator:

### أولاً: إنشاء Emulator:
```
1. Tools → Device Manager
2. Create Device
3. اختر: Pixel 6
4. Next
5. اختر: Android 13 (Tiramisu) - API 33
6. Download (إذا لم يكن محملاً)
7. Next → Finish
```

### ثم: شغّل التطبيق عليه:
```
1. Device Manager → اضغط ▶️ بجانب الجهاز
2. انتظر حتى يفتح الإيميوليتر (دقيقة)
3. في Terminal:
   flutter run -d android
4. انتظر Build (5-10 دقائق أول مرة)
5. التطبيق سيظهر على الإيميوليتر!
```

---

## ⚠️ ملاحظات مهمة:

### Backend يجب أن يعمل!
```
✅ تم تشغيله تلقائياً في نافذة منفصلة
✅ يجب أن ترى: "Started ReadyroadApplication"
✅ Port: 8888

إذا لم يعمل:
cd C:\Users\fqsdg\IdeaProjects\readyroad
.\mvnw.cmd spring-boot:run
```

### Flutter SDK Path:
```
إذا طلب منك Android Studio:
File → Settings → Languages & Frameworks → Flutter
→ Flutter SDK path: C:\flutter
→ Apply → OK
```

---

## 🎯 Commands مفيدة في Terminal:

```bash
# تشغيل على Chrome (الأسرع)
flutter run -d chrome

# تشغيل على Android
flutter run -d android

# عرض الأجهزة المتاحة
flutter devices

# إيقاف التطبيق
q

# Hot Reload
r

# Hot Restart
R

# فحص Flutter
flutter doctor
```

---

## 📊 Structure في Android Studio:

على اليسار سترى:
```
mobile_app/
├── lib/               ← الكود الرئيسي
│   ├── main.dart     ← نقطة البداية
│   ├── core/
│   ├── features/
│   └── shared/
├── android/          ← Android config
├── web/              ← Web config
└── pubspec.yaml      ← Dependencies
```

---

## 🐛 مشاكل محتملة:

### 1. "Flutter not found"
```powershell
# في Terminal:
$env:PATH += ";C:\flutter\bin"
flutter doctor
```

### 2. "Chrome not found"
```
flutter run -d edge
أو
flutter run -d windows
```

### 3. Build بطيء
```
أول مرة: 5-10 دقائق (عادي!)
المرات التالية: 30 ثانية
استخدم Chrome للتطوير (أسرع)
```

---

## ✅ Checklist:

```
☑ Android Studio مفتوح
☑ المشروع mobile_app مفتوح
☑ Gradle sync انتهى
☑ Backend يعمل (Port 8888)
☑ Terminal مفتوح
☑ كتبت: flutter run -d chrome
☑ Chrome فتح مع التطبيق! ✨
```

---

## 🎊 تهانينا!

الآن يمكنك:
- ✅ تشغيل التطبيق من Android Studio
- ✅ تعديل الكود مباشرة
- ✅ Hot Reload للتحديث الفوري
- ✅ Debug مع Breakpoints
- ✅ استخدام Flutter Inspector

---

**استمتع بالتطوير! 🚀**

للمزيد: ANDROID_STUDIO_GUIDE.md

