# Rijvia Flutter — فحص الجاهزية للمتاجر — 2026-10-14

**حالة النشر: NOT READY FOR STORE SUBMISSION.** هذا فحص تنفيذ محلي وفق المصادر الرسمية المفتوحة في هذا التاريخ، وليس موافقة Apple/Google أو شهادة مطابقة قانونية. لم تُرفع حزمة أو تُعدّل إعدادات المتاجر أو الويب أو الباكيند.

## ما أُصلح محليًا

| المتطلب | الدليل والتصحيح |
| --- | --- |
| استهداف Android الحالي | `android/app/build.gradle.kts`: رفع compileSdk وtargetSdk من 35 إلى **36**، المطلوب للتطبيقات الجديدة والتحديثات منذ 31 أغسطس 2026. لم تُرقَّ التبعيات أو AGP. |
| خط أساس Flutter المثبت | minSdk وNDK من FlutterExtension المثبت: API **24** / Android 7، وNDK **28.2.13676358** بدل القيم القديمة21/27. لا ترقية Flutter أو تبعيات؛ يلزم تثبيت أدوات SDK المطابقة قبل البناء. |
| توقيع إصدار Android | أزيل توقيع debug من release. إعداد upload keystore من متغيرات بيئة، مع إيقاف مهمة release إذا لم تتوفر القيم الأربع وملف صالح. لا مفتاح أُنشئ أو كُشف. |
| أرقام الإصدار | استخدام flutter.versionCode وflutter.versionName من pubspec بدل أرقام مستقلة ثابتة في Gradle. رقم البناء الفعلي لم يُرفع. |
| الاتصال ونُسخ Android | منع cleartext في main مع إبقاء استثناء التطوير داخل debug فقط. تعطيل Android Auto Backup للبيانات المحلية؛ لا تغيير للنسخ الاحتياطية على السيرفر. |
| API الإصدار | تحقق بدء تشغيل release يمنع عنوان HTTP/localhost/emulator أو بيانات اعتماد/استعلامًا مضمنًا. يجب تمرير عنوان HTTPS الفعلي عبر API_BASE_URL؛ لم يُخمن عنوان إنتاج أو يُنقل ملف env. |
| لغات iOS | إضافة ar/en/nl/fr إلى CFBundleLocalizations. الحد الأدنى iOS 13 قائم. |
| أيقونات iOS | إعادة تصدير 15 صورة AppIcon بصيغة RGB دون alpha. الأيقونة الكبيرة 1024×1024. تأكيد برمجي أن جميع بكسلات الشعار المعتمة بقيت كما هي؛ لم تُعدَّل ملفات الهوية الأصلية. |
| الوصول والتخطيط | فحص AA للنصوص وألوان الأزرار الحالية، وتكبير 200% للغات الأربع، والمقاسات المطلوبة والوضعين. هذه نتائج للمكونات المختبرة، وليست اعتماد وصول شاملًا لكل أجهزة القراءة. |
| المستندات قبل الدخول | مكوّن مشترك في الترحيب والدخول والتسجيل، ونفس فاتح المستندات في الحساب، مع رابط لغة صريح لكل لغة، و/en لإعادة ضبط لغة الويب المحفوظة وفق proxy الحالي. رسالة مترجمة عند رفض/فشل فتح المتصفح. لا تغيير لنص السياسات. |
| فحص مدخلات النشر | وضع `-StorePreflightOnly` في `validate-local.ps1` يفحص الأدوات ومدخل HTTPS ووجود التوقيع دون بناء/رفع/شبكة أو عرض أسرار. يوقف التنفيذ عند النقص، ويبقي حالة المتجر غير جاهزة حتى لو توفرت المدخلات. |

## المتطلبات التي تحتاج استكمالًا قبل النشر

| المتطلب | الحالة الحالية | الإجراء اللازم |
| --- | --- | --- |
| Android SDK وبناء AAB | **محجوب بالبيئة**: لا SDK في مساري local.properties أو Windows المعتاد، ولا جهاز Android متصل. | تجهيز SDK 36 ثم بناء وفحص AAB موقّع ومراقبة تثبيته وتشغيله على جهاز حقيقي. لم يُدّع نجاح بناء Gradle. |
| 16 KB والـ64-bit | AGP 8.11.1 قائم، وNDK مرتبط الآن بإعداد Flutter المثبت28.2.13676358. لا حزمة حالية تثبت محاذاة مكتبات Flutter والإضافات. | فحص ELF/zip alignment للحزمة الفعلية وPAGE_ALIGNMENT_16K ثم تجربة جهاز/محاكي 16 KB. لا يكفي تغيير targetSdk أو NDK. |
| توقيع Google Play | لا إثبات اعتماد upload key أو Play App Signing. | تزويد إعدادات التوقيع محليًا، ومطابقة package id والشهادة مع التطبيق في Play Console؛ لا تغيير تلقائي لمعرف التطبيق القائم. |
| بناء iOS | Windows دون Mac/Xcode متاح، ولا Apple Team موثق في المشروع. | Mac مع **Xcode 26 أو أحدث وSDK iOS 26 أو أحدث**، توقيع archive وفحصه على iPhone/iPad، ثم Validate App. |
| Google الأصلي | GoogleOAuthService يستعمل جسر المتصفح، ويرفض Native برسالة native_unavailable. نجاح Flutter Web ليس نجاح Android/iOS. | إعداد العملاء الأصليين ومعرفات الحزمة وSHA/redirects وتكامل أصلي آمن، مع الإبقاء على عقد الباكيند وعدم تضمين Client Secret. يحتاج إعدادات مالك الحساب. |
| خيار الدخول في iOS | لا تكامل أصلي بديل يحقق 4.8 مع إخفاء البريد. | توفير Sign in with Apple أو بديل يحقق شروط 4.8 إن استُخدم Google لحساب التطبيق. البريد/كلمة المرور وحدهما لا يثبتان استيفاء هذه الشروط. |
| شراء المحتوى الرقمي | ExamPaymentService يستخدم Stripe Checkout؛ لا StoreKit/Google Play Billing ولا تحقق إيصالات متاجر في هذا النطاق. | اعتماد مسار شراء متوافق: مشتريات المتاجر مع تحقق السيرفر واستعادة المشتريات ومزامنة الاستحقاق؛ أو برنامج بديل مسموح للبلدان المحددة مع إثبات التسجيل ومتطلباته. لا نفترض أن مجرد استهداف بلجيكا يعفي من الشروط. |
| حذف الحساب داخل التطبيق | زر تأكيد قائم في profile_screen يستدعي DELETE /api/users/me، ثم يسجل الخروج بعد النجاح. | اختبار الحذف من حساب اختبار مخصص، والإبقاء على الرفض/الإلغاء آمنًا، والتحقق من حذف البيانات وربط موفر الهوية. لم يُحذف حساب المالك لاختبارها. |
| طلب حذف من الويب | سياسة الخصوصية تذكر نموذج التواصل وحقوق المحو؛ صفحة /contact تعمل ولكنها عامة دون مسار حذف بارز. | اعتماد رابط عام واضح لطلب الحذف في Data safety يذكر Rijvia ويمكن استعماله دون تثبيت التطبيق. لا يُعد وجود DELETE API رابط حذف عامًا. لم تُعدّل نسخة الويب. |
| سياسة الخصوصية | /privacy-policy و/terms و/contact تعمل. السياسة الحالية تصف الويب وSecure HttpOnly cookies؛ التطبيق الأصلي يستعمل secure storage. | مراجعة نص يغطي المعالجة الأصلية والتخزين والمشتريات والمزوّدين والاحتفاظ، واعتماد بيانات Data safety وApp Privacy من مالك الخدمة؛ لا نشر إفصاحات غير مثبتة. |
| Privacy manifests | عُثر على manifests في app_links وflutter_secure_storage وshared_preferences_foundation وurl_launcher_ios. لا manifest مطابق عُثر عليه في مسار path_provider_foundation المثبت. | إنشاء/مراجعة تقرير الخصوصية المجمع في Xcode والتحقق من Required Reason APIs والإضافات المضمّنة فعليًا. لا إضافة manifest فارغ لإظهار مطابقة وهمية. |
| بيانات صفحة المتجر | لم تُفتح Play Console/App Store Connect أو تُعدّل بياناتهما. | التصنيف العمري الحالي، Data safety/App Privacy، support/privacy URLs، بيانات التاجر/DSA عند انطباقها، دول التوزيع، وصف دقيق، الحقوق، وحساب مراجعة متاح. |
| صور المتجر | معرض UI المحلي يتضمن حساب المالك وبيانات اختبار موسومة. | ليس حزمة صور متجر. تجهيز صور بالمقاسات المطلوبة من بناء فعلي وحساب مخصص خالٍ من بيانات شخصية، مع تمثيل الميزات المدفوعة بدقة. |
| اختبارات ما قبل النشر | لا شراء Sandbox ولا TestFlight/Play internal testing، ولا شهادة تمرير/قارئ شاشة على جهاز أصلي. | رحلات دخول/استعادة/لغة/تعلم/امتحان/شراء/استعادة شراء/حذف حساب، والشبكة البطيئة والعودة من الخلفية والروابط، على الحزم الموقعة. لا إجراء معاملة حقيقية. |

## قرار المالك وحدود الإغلاق

وافق المالك على إكمال تعديلات Flutter وفحص النشر، وقرر **تأجيل ربط المتاجر والمصادقة الأصلية**. قال إنه سينفذ الاختبار على الأجهزة بنفسه. لا سؤال موافقة معلق لهذه الأجزاء، ولا توسيع إلى الويب/الباكيند أو إعدادات الحسابات. البنود المؤجلة تمنع إعلان جاهزية رفع المتجر حتى تنفذ وتختبر لاحقًا.

دليل التنفيذ والتحقق على Android/iOS: `OWNER_DEVICE_QA_2026-10-14.md`. لا SDK مثبت في هذه البيئة، ومسار Android المحلي القديم Linux غير موجود على Windows؛ لا تثبيت أو تغيير global config تلقائيًا. لم يُنشأ AAB أو archive.

### تحقق الإضافات المحلية بعد قرار المالك

- `store-public-links-validation.log`: **15 حالة ناجحة** للمسارات الأربع، الروابط الثلاثة في الوضعين وعند360px/200%، رفض/استثناء فاتح المتصفح، والعودة المتأخرة بعد مغادرة الشاشة.
- `store-auth-pages-validation.log`: **8 حالات ناجحة**، كل حالة تفحص الترحيب والدخول والتسجيل عند390px/200%، أربع لغات والوضعين، بما فيها تمرير قائمة التسجيل إلى الروابط. ثلاث معاينات جديدة موسومة Widgets، لا صور متجر.
- `store-analyze.log`: **7 مدخلات، دون مشاكل**. صحّح تحميل اللغة والتمرير في مساعد الاختبار قبل نجاح الإعادة؛ لم تستلزم التشخيصات تغييرًا بمنطق التطبيق.
- PowerShell parser ناجح؛ ثلاثة فحوص موجّهة للمدخل الغائب وHTTP وشكل HTTPS أكدت التوقف عند نقص الأدوات والتوقيع، وبقاء STORE_SUBMISSION=NOT_READY. عنوان example.invalid كان مدخل اختبار شكل فقط، ولم يُكتب في إعداد التطبيق أو يُطلب عبر الشبكة.
- نتائج UI السابقة114 تبقى مسجلة بوقتها؛ لم تُعد المجموعة الكاملة أو يُستخدم عددها بدل فحص حزمة أصلية.

## إعداد التوقيع المحلي

متغيرات البيئة اللازمة، دون تسجيل قيمها في الملفات أو المحادثة:

- RIJVIA_ANDROID_KEYSTORE_PATH
- RIJVIA_ANDROID_STORE_PASSWORD
- RIJVIA_ANDROID_KEY_ALIAS
- RIJVIA_ANDROID_KEY_PASSWORD

يجب أن تكون مفتاح الرفع المعتمد للتطبيق، لا مفتاحًا عشوائيًا جديدًا. استعمال إعدادات release يتطلب كذلك API_BASE_URL صحيحًا عبر dart-define. هذه التعليمات لا تعني أن الحزمة جاهزة للرفع قبل إغلاق الجدول أعلاه.

## المصادر الرسمية

- [Google Play: Target API level](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Apple: Upcoming requirements — SDK, iOS minimum and age ratings](https://developer.apple.com/news/upcoming-requirements/)
- [Apple: App Review Guidelines — completeness, payments, login and privacy](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play: Payments policy and regional programs](https://support.google.com/googleplay/android-developer/answer/10281818)
- [Google Play: Account deletion](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Android: 16 KB page sizes](https://developer.android.com/guide/practices/page-sizes)
- [Apple: Privacy manifests](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
- [Apple: App icons](https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon/)
- [Rijvia: Privacy policy](https://rijvia.be/privacy-policy)، [Terms](https://rijvia.be/terms)، [Contact](https://rijvia.be/contact).
