# Restaurant SaaS - Cloud Computing Project

هذا المشروع يحول فكرة المطعم من موقع ثابت إلى نموذج SaaS:

## يحقق ماذا؟

- Online Application: التطبيق يعمل عبر الإنترنت بعد رفعه على GitHub Pages أو Somee.
- SaaS: كل مطعم ينشئ حساب ويستخدم النظام كخدمة.
- Multi-user / Multi-tenant: كل مطعم يمثل Tenant مستقل.
- Dashboard: لكل مطعم لوحة تحكم خاصة.
- Subscription Plans: Free / Basic / Pro.
- Menu Management: إضافة وحذف أصناف المنيو.
- Orders Management: استقبال وإدارة الطلبات.

## مهم جدًا

النسخة الحالية تعمل مباشرة باستخدام LocalStorage للتجربة السريعة.
حتى تصبح Cloud SaaS كاملة أمام الأستاذ، اربطها بـ Firebase:

1. افتح Firebase Console.
2. أنشئ Project جديد باسم Restaurant SaaS.
3. فعّل Authentication بالبريد وكلمة المرور.
4. فعّل Cloud Firestore.
5. أنشئ Collections:
   - tenants
   - menuItems
   - orders
6. أضف Firebase Config داخل ملف app.js أو أنشئ firebase.js.

## نموذج قاعدة البيانات المقترح

### tenants
- tenantId
- ownerName
- tenantName
- email
- plan
- createdAt

### menuItems
- itemId
- tenantId
- name
- price
- image
- createdAt

### orders
- orderId
- tenantId
- customerName
- items
- status
- createdAt

## لماذا هذا SaaS؟

لأنه ليس موقع مطعم واحد فقط. هو منصة يستطيع أكثر من مطعم التسجيل فيها، وكل مطعم يحصل على بياناته ولوحة التحكم الخاصة به.

## كيف ترفعه؟

ارفع الملفات التالية إلى GitHub repository أو Somee:

- index.html
- styles.css
- app.js
- README.md
