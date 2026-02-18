# دليل تطوير مشروع "متابعة الأجهزة الطبية"

واجهة RTL عربية مبنية بـ React + TypeScript + Vite + Tailwind.

## الأوامر الشائعة
- تثبيت الحزم: `npm install`
- بناء الإنتاج: `npm run build` (إلزامي بعد أي تغيير)

## المعمارية
- التوجيه: `src/App.tsx` يوفّر روابط: قائمة الأجهزة `/devices`، الفحص الروتيني `/check`، تسجيل جهاز جديد `/device/new`.
- الصفحات:
  - `src/pages/DeviceNew.tsx`: نموذج التسجيل مع قائمة منسدلة للبحث في أنواع الأجهزة + توقيع + QR + مصمّم الملصق. يدعم: رقم مهندس الصيانة، تاريخ آخر صيانة، تاريخ الصيانة المستحقة، صور متعددة للعقد.
  - `src/pages/DevicesList.tsx`: بحث/فلترة/ترتيب وجدول نتائج وروابط عرض.
  - `src/pages/RoutineCheck.tsx`: فحوصات بنوعين: يومي (تقييم سريع) وشهري (معايير تفصيلية). مسح QR/Barcode باستخدام ZXing أو اختيار الجهاز من قائمة الأجهزة المسجلة.
  - `src/pages/AdminControl.tsx`: ثلاث علامات تبويب: المستخدمين، المعايير التصنيفية، أنواع الأجهزة الطبية.
- المكوّنات: `SignaturePad.tsx`, `QRGenerator.tsx`, `ImagePreview.tsx`, `LabelDesigner.tsx` (يدعم عرض القسم).

## البيانات والعلاقات (Database Schema)
- **departments**: id, name unique, custodian_name (اسم صاحب الذمة), devices_count
- **device_types**: id, name_ar, name_en?, description?, is_active (أنواع الأجهزة الطبية)
- **devices**: id, name, supplier, manufacturer, serial unique, department_id, device_type_id, supply_date?, install_date?, service_engineer?, engineer_phone?, last_maintenance_date?, next_maintenance_date?, photo_url?, contract_photos? (JSON array), signature_png?, description?, model?, cost?, is_under_warranty?, warranty_expiry_date?
- **routine_checks**: id, device_id, check_date, state, check_type (daily|monthly), criteria JSON?, issue?, checker_name, signature_png?
- **check_criteria**: id, key unique, label_ar, description_ar?, is_active, display_order
- **device_type_criteria**: id, device_type_id, criteria_id (ربط المعايير بأنواع الأجهزة)
- **users**: id, username, password_hash, name, email?, role, status, privileges?
- **label_templates**: id, name, json_definition, is_default?

## الفحوصات
- **فحص يومي**: تقييم سريع (ممتاز/جيد/متوسط/بحاجة صيانة) + ملاحظات + اسم الفاحص + توقيع اختياري
- **فحص شهري**: معايير تفصيلية حسب نوع الجهاز. النتيجة التلقائية:
  - ممتاز = كل المعايير true
  - جيد = 1 false
  - متوسط = 2 false
  - بحاجة صيانة = 3+ false

## الحسابات الافتراضية
- **المسؤول (Admin)**:
  - اسم المستخدم: `admin`
  - كلمة المرور: `admin123456`

## Backend API Endpoints
- `/api/device-types`: GET, POST (أنواع الأجهزة)
- `/api/device-types/:id`: PUT, DELETE
- `/api/device-types/:id/criteria`: GET, POST (معايير نوع الجهاز)
- `/api/criteria`: GET, POST, PUT, DELETE (المعايير التصنيفية)
- `/api/devices`, `/api/departments`, `/api/checks`, `/api/users`

## صفحات التقارير
- `/reports`: التقارير العامة والإحصائيات
- `/reports/maintenance`: تقرير الصيانة المستحقة - يعرض الأجهزة التي تحتاج صيانة مع:
  - فلاتر: القسم، نوع الجهاز، حالة الصيانة
  - إحصائيات: متأخرة، مستحقة اليوم، خلال 7 أيام، بدون تاريخ
  - تصدير: CSV، صورة PNG
  - روابط مباشرة للعرض والتعديل

## إرشادات إنتاجية مهمة
- استخدم دائمًا مسارات الأصول المطلقة في الواجهة: `/assets/...`.
- بعد أي تعديل تشغيلي، نفّذ بناء الإنتاج وتحقق من عدم وجود أخطاء.
- **ماسح QR/Barcode**: يستخدم مكتبة ZXing، يتطلب HTTPS وصلاحيات الكاميرا.

## دعم المتصفحات
- **Firefox/Safari/Chrome/Edge**: مدعوم بالكامل
- يتطلب الماسح HTTPS وصلاحيات الكاميرا
- على الهاتف يستخدم الكاميرا الخلفية تلقائيًا
