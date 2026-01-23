# ⚠️ حل مشكلة "Error loading data" على Android Emulator

## المشكلة:
```
Error loading data
Exception: Connection refused
address = localhost, port = 53540
```

## السبب:
Android Emulator لا يستطيع الوصول لـ `localhost` مباشرة!

---

## ✅ الحل (3 خطوات):

### 1️⃣ تأكد من أن Backend يعمل

افتح PowerShell جديد:
```powershell
cd C:\Users\fqsdg\IdeaProjects\readyroad
.\mvnw.cmd spring-boot:run
```

انتظر حتى ترى:
```
Started ReadyroadApplication in X seconds
```

---

### 2️⃣ في Android Studio Terminal

أوقف التطبيق واضغط:
```
q
```

---

### 3️⃣ أعد تشغيل التطبيق (Hot Restart كامل)

في Terminal اكتب:
```
R
```
(حرف R كبير - Hot Restart)

أو أعد تشغيل كامل:
```bash
flutter run -d emulator-5554
```

---

## 🔍 التحقق من أن كل شيء صحيح:

### تأكد من API URL:
الملف: `lib/core/constants/api_constants.dart`

يجب أن يكون:
```dart
static const String baseUrl = 'http://10.0.2.2:8888';
```

**ليس** `localhost`!

---

## 📝 ملاحظات مهمة:

### للـ Android Emulator:
```
✅ استخدم: 10.0.2.2
❌ لا تستخدم: localhost
```

### للجهاز الحقيقي:
```
✅ استخدم: IP الكمبيوتر (مثل: 192.168.1.100)
❌ لا تستخدم: localhost أو 10.0.2.2
```

### للـ Chrome/Web:
```
✅ استخدم: localhost
```

---

## 🚀 الخطوات الكاملة الآن:

```
1. ✅ Backend يعمل (نافذة منفصلة تظهر)
2. ✅ API URL = 10.0.2.2:8888
3. ✅ في Android Studio Terminal: اضغط R
4. ✅ انتظر 30 ثانية
5. ✅ البيانات ستظهر! (9 فئات)
```

---

## 🆘 إذا ما زال لا يعمل:

### اختبر Backend يدوياً:

في PowerShell:
```powershell
curl http://localhost:8888/api/v1/categories
```

يجب أن ترى JSON مع 9 فئات.

### تأكد من Port:
```powershell
Get-NetTCPConnection -LocalPort 8888
```

يجب أن يُظهر عملية Java تستمع على 8888.

---

## ✅ عندما يعمل:

ستشاهد في Android Emulator:
- ✅ قائمة بـ 9 فئات
- ✅ أزرار في الأعلى
- ✅ يمكنك النقر والتنقل
- ✅ كل شيء يعمل!

---

**الآن جرّب الحل! Backend تم تشغيله في نافذة جديدة!** 🚀

