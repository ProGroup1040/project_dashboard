# Project Dashboard - مقايسة شقة مدينتي

## المهام المكتملة

- [x] صفحة رئيسية (Dashboard) مع نبذة عن الشركة وفريق العمل ومحتويات المشروع
- [x] قسم مقايسة التشطيب مع بنود مفصلة (11 بند)
- [x] قسم مقايسة الأثاث مع خيارات لكل غرفة (16 غرفة)
- [x] قسم Smart Home System مع خيارين
- [x] قسم مقايسة الستائر مع خيارين لكل ستارة (4 ستائر)
- [x] نظام الاختيار التفاعلي (العميل يختار من كل قسم)
- [x] تجميع الإجمالي التلقائي لكل الاختيارات
- [x] عرض الصور مع كل بند/خيار (صور CDN حقيقية)
- [x] تصميم RTL عربي فاخر (ذهبي وداكن)
- [x] صفحة ملخص الاختيارات النهائية
- [x] أزرار اختيار الكل / إلغاء الكل في التشطيب
- [x] ميزة الطباعة
- [x] خط Cairo العربي
- [x] شريط الإجمالي المتحرك في الأعلى

## المهام المعلقة

- [ ] حفظ checkpoint ونشر الموقع
- [x] تكبير لوجو Professor يميناً وشمالاً في هيدر الصفحة الرئيسية
- [x] إضافة نقاط التميز الخمس في قسم نبذة عن الشركة
- [x] بناء قسم فريق العمل التفاعلي الهيراركي (الشرائح 5-20)
- [x] مطابقة بيانات كل عضو مع صورته الصحيحة من شرائح البرزنتيشن
- [x] تعديل عرض مهام العضو ليظهر بجانبه فوراً عند الضغط (inline popup)
- [x] رفع صور بشمهندس محمد محمود وبشمهندس مصطفى قنديل على CDN
- [x] إضافة مستوى "إدارة المشروع" في الهيراركي بين المستوى 1 والمستوى 2
- [x] استخراج الـ 17 مرحلة من الشريحة 22
- [x] بناء تاب الجدول الزمني التفاعلي مع تتبع المرحلة الحالية
- [x] بناء جداول Database: users, phase_statuses, complaints, complaint_replies
- [x] إنشاء المستخدمين الـ 5 في قاعدة البيانات (ادمين, 2 engineers, malek, client)
- [x] بناء صفحة Login مع نظام الصلاحيات (ادمين/engineer/aftersales/client)
- [x] تحديث تاب الجدول الزمني بأزرار تغيير حالة المرحلة (للمهندس فقط)
- [x] إضافة نظام الشكاوى مع رفع الصور (للعميل) والرد (للمهندس) والإغلاق (لملك/admin)
- [x] إضافة جدول الدفعات التلقائي في تاب الملخص (50% تعاقد، 20% بعد مؑ11، 20% بعد مؑ15، 10% بعد مؑ16)
- [ ] إضافة أيقونات واتساب وأرقام التليفون على كارد كل عضو في فريق العمل

---

## Pro Group Integrated Pricing System (NEW MODULE)

### Phase 1: Database & Data Setup
- [x] Add schema tables: brands, modules, spaces, products, product_types, variables, pricing_rules, basket_items, quotations
- [x] Generate and apply migration SQL
- [x] Seed pricing data: Pro Furniture → Bedroom → Bed (full working example)

### Phase 2: Wizard UI (Step-by-step)
- [x] Brand selector (Layer 1)
- [x] Space/Category selector (Layer 2-3)
- [x] Product selector (Layer 4)
- [x] Product type selector (Layer 5)
- [x] Specifications form (Layer 6): dimensions, materials, fabric, finish, add-ons
- [x] Design complexity selector: Basic / Standard / Premium / Custom
- [x] Quantity input + live price display

### Phase 3: Pricing Engine & Basket
- [x] Formula: (Base + Materials + Add-ons) × Complexity × Quantity
- [x] Real-time price update
- [x] Basket: add, edit, remove items
- [x] Running total

### Phase 4: Quotation Generator
- [x] Structured quotation from basket
- [x] Quick Estimate + Refined Estimate
- [x] Print/export view

### Phase 5: Polish & Delivery
- [ ] Arabic RTL, responsive desktop UI
- [x] Vitest tests for pricing engine (9 tests passing)
- [ ] Checkpoint and delivery

## Bug Fixes & Improvements (from video feedback - Mar 27)
- [ ] Fix critical bug: rooms/spaces not loading in step 2 after brand selection
- [ ] Fix content disappearing when selecting items in pricing wizard
- [ ] Fix navigation: selections not persisting, user gets sent back to step 1
- [ ] Add Pro Group branding/logo to pricing wizard header
- [ ] Add client login option (separate from engineer login)

## Kitchen Module - Professor Kitchens (NEW - Mar 31)
- [ ] Create kitchen DB schema: kitchen_materials, kitchen_accessories, kitchen_marble, kitchen_cladding, kitchen_colors, kitchen_units, kitchen_quotations, kitchen_work_orders
- [ ] Seed all data from Excel: 28 materials, 50+ accessories, 34 marble types, 42 cladding items, color options
- [ ] Build kitchen pricing wizard page (/kitchen)
- [ ] Unit table with dropdowns: رقم القطعة, مكان (علوي/سفلي/طولي/بلاكار), عرض, ارتفاع, خامة, جدار
- [ ] Accessories section: multi-select with quantities and prices
- [ ] Marble section: type + wall label + price per m²
- [ ] Cladding & decor section
- [ ] Colors section: وزر + إضاءة + زجاج + بوكس داخلي + مقابض + قطاعات زجاج
- [ ] Live price calculation: (امتار × سعر الخامة) + اكسسوارات + رخام + تجاليد
- [ ] Generate Quotation (مقايسة) - print view
- [ ] Generate Work Order (امر شغل) - print view
- [ ] Fix Back button in all pricing wizard steps

## Negotiation Session Module (Sections 1-19)
- [ ] DB schema: negotiation_sessions, session_steps, session_accessories, session_objections, session_changes, excel_imports
- [ ] tRPC router: negotiation procedures (create, update steps, submit)
- [ ] 7-step guided wizard UI (Recap → Design → Accessories → Quotation → Objections → Smart Options → Closing)
- [ ] Excel import: upload, parse, group by category, calculate totals
- [ ] Accessory enrichment: image, video, 3 benefits, alternatives from DB
- [ ] Dimension-based mapping: Base Units / Wall Units / Island / Dressing
- [ ] Smart negotiation logic: remove/replace/discount with live total updates
- [ ] Change log tracking: before/after price per change
- [ ] Validation rules: 80% accessories reviewed, objections logged, closing step
- [ ] KPI dashboard: top objections, rejected accessories, conversion rate per engineer
- [ ] CRM pipeline integration: Negotiation Session stage between Design Approved and Proposal
- [ ] Vitest tests for negotiation engine

## Kitchen Pricing Platform — Full System (May 2026)
- [ ] Add DB tables: playbook_items, media_library, sales_scripts, transport_rules, quotation_items_v2, approval_logs
- [ ] Build backend db helpers and tRPC routers for new tables
- [ ] Build 11-step pricing engine with internal + client view modes
- [ ] Build Playbook card system per item
- [ ] Build Media Library with auto-suggestion
- [ ] Build Sales Script Generator
- [ ] Build Smart Warnings system (8 warning types)
- [ ] Build Analytics Dashboard (12 KPI cards)
- [ ] Build Approval Workflow (discount/free items/override)
- [ ] Build Role-based access (6 roles)
- [ ] Build Output generator (internal quotation, client quotation, WhatsApp summary, scripts)
