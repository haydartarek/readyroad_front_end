# Web / Mobile parity audit

تم تدقيق `web_app` و`mobile_app` على أساس أن `readyroad` هو مصدر الحقيقة المشترك. لا توجد مزامنة Git تلقائية بين واجهتي العميل؛ تحديث `web_app` لا ينسخ صفحة أو طلب HTTP إلى Flutter. المزامنة الصحيحة هي أن يستخدم الطرفان نفس مسارات Backend والعقود والهوية والصلاحيات.

## ما تم توحيده محليًا

- جلسة Auth واحدة داخل Flutter بدل إنشاء `AuthBloc` جديد عند كل deep link.
- انتهاء JWT (`401`) يخرج المستخدم عبر نفس AuthBloc، ويمنع بقاء واجهة قديمة لحساب منتهي.
- `User` يقرأ `role`, `preferredLanguage`, و`isActive` من `/api/users/me`.
- الحساب والخطة يقرآن من `/api/account/access`؛ `ADMIN` و`MODERATOR` يحصلان على `unlimited` من Backend، ولا توجد قيمة محلية بديلة.
- Profile، Analytics، Notifications، Lessons، Practice/Quiz، Exam، Statistics، Favorites، والشراء تستخدم Backend المشترك.
- المفضلة والإحصاءات المحلية أصبحت معزولة بمفتاح المستخدم حتى لا تنتقل بيانات مستخدم إلى حساب آخر على الجهاز.
- روابط الويب ذات البادئة `/ar`, `/en`, `/fr`, `/nl` تُحوّل إلى المسار canonical داخل Flutter.
- `/api/exams/simulations` هو مصدر حالة الامتحان، الوقت، الأسئلة، الإجابات، الـtimeout، والـpaywall؛ لا توجد مفاتيح إجابة أو تصحيح محلي.
- إصلاح استئناف الدرس بعد progress محفوظ، ومنع انتهاء مؤقت الامتحان من التجمّد عند وجود اختيار محلي غير مُرسل.
- حذف نسخ practice القديمة تم فقط لأنها استُبدلت بخدمة Quiz الخلفية الحالية؛ لم تُحذف نسخ أخرى بلا إثبات استبدال.

## مسارات Flutter الحالية

| مجموعة الويب | حالة Flutter |
|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | منفذة بعقود Auth الحالية |
| `/dashboard` | يفتح Home للحساب الموثق مع بيانات الحساب من Backend |
| `/exam`, `/practice`, `/quiz` | منفذة؛ الامتحان persistent مع free preview/paywall |
| `/lessons`, `/lessons/{code}` | القائمة والتفاصيل وprogress والصور |
| `/traffic-signs` وSign Quiz | الفئات والتفاصيل والاختبار الخلفي |
| `/statistics`, `/analytics/*` | إحصاءات progress وتحليل weak areas/error patterns |
| `/favorites`, `/search`, `/profile`, `/notifications` | منفذة ببيانات المستخدم الموثق |
| صفحات التسويق والقوانين وSEO | تبقى Web-only؛ لا تُحوّل إلى شاشة Flutter تعليمية مصطنعة |
| `/admin/*` | تبقى Web admin surface؛ Backend يحميها بـ`ADMIN` ولا يُسمح للموبايل بتجاوزها |

## حدود التحقق

- تم تشغيل Flutter على Chrome ضد `http://localhost:8890`، وظهرت شاشة Login دون أخطاء Console.
- `flutter analyze`: ناجح.
- `flutter test`: ناجح (12 اختبارًا).
- `flutter build web --dart-define=API_BASE_URL=http://localhost:8890`: ناجح. تحذير Wasm يخص `flutter_secure_storage_web` ولا يمنع JavaScript build.
- `web_app`: 107 suites / 670 tests ناجحة، وlint ناجح.
- Playwright فعلي على Next المحلي: 23/23 ناجحة للصفحات العامة، RTL، security headers، ومسارات exam في اللغات الأربع.
- Backend tests المركزة للدفع والامتحان والصلاحيات ورفع/حذف الصور ناجحة.

لم يتم تنفيذ دفع مالي حقيقي، QA على جهاز Android فعلي، أو نشر/تعديل Production في هذه المرحلة. هذه بوابات تحقق منفصلة وليست بيانات يمكن استنتاجها من نجاح build المحلي.
