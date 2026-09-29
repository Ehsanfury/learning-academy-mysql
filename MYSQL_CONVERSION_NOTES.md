# یادداشت تبدیل PostgreSQL به MySQL

این پروژه از PostgreSQL به MySQL/MariaDB تبدیل شد. خلاصه تغییرات:

## پیکربندی و وابستگی‌ها
- `backend/package.json`: `pg` و `pg-hstore` حذف و `mysql2` اضافه شد.
- `backend/config/db.js`, `config/sequelize.cjs`, `config/env.js`: `dialect` به `mysql` تغییر کرد، پورت پیش‌فرض 5432 → 3306.
- تمام فایل‌های `.env.example` و `docker-compose*.yml` و `.github/workflows/ci.yml` به‌روزرسانی شدند.
- `backend/package-lock.json` حذف شد (شامل وابستگی‌های `pg` بود) — بعد از دانلود پروژه حتماً `npm install` را در `backend/` اجرا کنید تا دوباره ساخته شود.

## مدل‌ها (Sequelize)
- `DataTypes.JSONB` → `DataTypes.JSON` (در همه‌ی ۲۴ فایل مدل)
- `DataTypes.ARRAY(...)` → `DataTypes.JSON` (چون MySQL نوع آرایه ندارد)
- مقادیر پیش‌فرض `Sequelize.literal("'[]'::jsonb")` → `[]` ساده جاوااسکریپتی

## کوئری‌ها
- `Op.iLike` → `Op.like` (در MySQL با کولیشن پیش‌فرض، LIKE خودش case-insensitive است)
- `Op.contains` روی ستون‌های JSON (که مخصوص Postgres JSONB است) در `lessonService.js` و `adminService.js` با `JSON_EXTRACT`/`JSON_UNQUOTE` بازنویسی شد
- کوئری خام در `aiController.js`: کوتیشن دوتایی Postgres (`"alias"`) → بک‌تیک MySQL، و پارامترهای `$name` (که اصلاً با replacements سازگار نبودند) → `:name`
- `returning: true` (مخصوص Postgres) از `xpService.js` و `loadLessonContent.js` حذف شد
- اسکریپت‌های تشخیصی (`check-db.js`, `check-scenarios*.js`, `add-vocabulary-columns.js`, `drop-and-sync.js`): جایگزینی `pg_indexes` با `information_schema.statistics`، افزودن `table_schema = DATABASE()`، الیاس کردن `COUNT(*)`، و بک‌تیک برای کلمات رزرو (`order`, `interval`, `key`)
- `ensure-test-db.js` کاملاً بازنویسی شد (از `pg` به `mysql2`؛ MySQL برخلاف Postgres از `CREATE DATABASE IF NOT EXISTS` پشتیبانی می‌کند)

## اسکیمای دیتابیس
- `backend/schema.sql` و `backend/database/schema.sql`: `UUID DEFAULT gen_random_uuid()` → `CHAR(36) DEFAULT (UUID())`، `JSONB` → `JSON`، `SERIAL` → `AUTO_INCREMENT`
- توجه: منبع اصلی ساخت جداول در واقع `backend/migrations/001-initial-schema.js` است که مستقیماً از روی مدل‌های Sequelize (`sequelize.sync`) جدول می‌سازد؛ این دو فایل schema.sql بیشتر جنبه مرجع/مستندسازی دارند.

## نکات باقی‌مانده که باید حتماً بررسی کنید
1. **بدون MySQL واقعی نمی‌شد این تبدیل را اجرا و تست کرد** — پیشنهاد می‌کنم بعد از نصب، `npm run migrate` و `npm run seed` را روی یک دیتابیس MySQL محلی اجرا و تست کنید.
2. در `services/adminService.js` (تابع `getAchievements`) یک باگ از قبل موجود در نسخه‌ی Postgres پیدا شد: کوئری به دنبال ستونی به نام `title` در جدول `achievements` می‌گردد، در حالی که آن جدول فقط `name`/`description` دارد. این باگ ربطی به تبدیل دیتابیس ندارد و همان‌طور که بود نگه داشته شد — پیشنهاد می‌کنم جداگانه بررسی شود.
3. اگر جایی در کد بک‌اند (خارج از فایل‌های بازبینی‌شده در بالا) کوئری خام SQL با syntax مخصوص Postgres نوشته باشد که در این بررسی دیده نشده، لازم است دستی اصلاح شود.

## روش تمرین لایتنر (Leitner) - اضافه‌شده در 2026-09-26

یک روش دوم و مستقل برای مرور لغات اضافه شد، در کنار SM-2 موجود (بدون تغییر توی SM-2):

- **جدول جدید**: `leitner_progress` (فایل `models/LeitnerProgress.js`) — با فیلدهای `box` (۱ تا ۵)، `correct_streak`، `last_review_date`، `next_review_date`
- **سرویس**: `services/leitnerService.js` — منطق ساده: پاسخ درست → یک جعبه بالاتر، پاسخ غلط → برگشت به جعبه ۱. فاصله‌ی هر جعبه: جعبه۱=۱روز، جعبه۲=۳روز، جعبه۳=۷روز، جعبه۴=۱۴روز، جعبه۵=۳۰روز (قابل تنظیم در بالای فایل، `BOX_INTERVALS_DAYS`)
- **کنترلر و روت**: `controllers/leitnerController.js` و `routes/leitnerRoutes.js`، مونت‌شده روی `/api/review/leitner`:
  - `GET /api/review/leitner/due` — کلمات سررسیده
  - `GET /api/review/leitner/stats` — آمار (شامل تعداد کلمات هر جعبه)
  - `POST /api/review/leitner/:wordId/review` با بدنه‌ی `{ "isCorrect": true|false }`
- جدول در `models/index.js` رجیستر و association‌هاش (User، Vocabulary) اضافه شده، پس `npm run migrate` خودکار جدولش رو می‌سازه (نیازی به ویرایش دستی migration نیست چون از روی مدل‌ها sync می‌کنه)
- `schema.sql` هم برای مستندسازی به‌روزرسانی شد

### کاری که هنوز روی فرانت‌اند لازمه
این کار فقط سمت بک‌اند بود. برای استفاده‌ی واقعی، صفحه‌ی تمرین لغات فرانت باید یک گزینه‌ی انتخاب روش (SM-2 یا لایتنر) اضافه کنه و بر اساس انتخاب کاربر، به یکی از دو اندپوینت `/api/review/...` یا `/api/review/leitner/...` درخواست بزنه.

### فرانت‌اند (اضافه‌شده)
`src/pages/Review/ReviewPage.jsx` یک سوییچ SM-2/لایتنر گرفت (هم توی هدر صفحه‌ی مرور، هم توی صفحه‌ی پایان جلسه). با انتخاب هرکدام:
- کلمات سررسیده از اندپوینت متناظر (`/review/due` یا `/review/leitner/due`) گرفته می‌شن
- دکمه‌های «می‌دانم/نمی‌دانم» به `POST /review/:id/review {quality}` یا `POST /review/leitner/:id/review {isCorrect}` می‌زنن

⚠️ یک باگ از قبل موجود و بی‌ربط به این تغییرات هم پیدا شد: در `src/pages/Dashboard/__tests__/DashboardPage.test.jsx` یک تگ JSX به‌اشتباه بسته شده (`<MemoryRouter>...</MemoryClientProvider>`) که باعث خطای سینتکسی در اون فایل تست می‌شه. دست نزدم چون خارج از محدوده‌ی این کار بود.
