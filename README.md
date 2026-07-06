# Restaurant SaaS - Complete Firebase Version

مشروع مطعم سحابي بصيغة SaaS يحقق متطلبات الحوسبة السحابية:

- Online application hosted on GitHub Pages
- Firebase Authentication لإنشاء حسابات وتسجيل دخول
- Cloud Firestore لتخزين بيانات المطاعم والطلبات والمنيو
- Multi-tenant: كل مستخدم/مطعم له مستند مستقل بالمسار `restaurants/{uid}`
- Dashboard لإدارة المنيو والطلبات

## Firebase المستخدم

Project ID: `restaurant-saas-c894e`

## طريقة الرفع

ارفع الملفات التالية إلى مستودع GitHub Pages بدل الملفات القديمة:

- index.html
- styles.css
- app.js
- README.md

ثم افتح الرابط:

https://mousabaltayeb74-dot.github.io/restaurant-saas/

## طريقة الاختبار

1. افتح الموقع.
2. اضغط دخول / حساب.
3. أنشئ حساب مطعم جديد.
4. أدخل إلى لوحة التحكم.
5. أضف صنفًا للمنيو.
6. أضف طلبًا تجريبيًا.
7. افتح Firebase > Firestore وستجد البيانات داخل:

`restaurants / uid / menu`

`restaurants / uid / orders`
