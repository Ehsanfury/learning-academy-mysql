/**
 * testSetup.js
 * Path: backend/tests/setup/testSetup.js
 * Description: Test setup and teardown
 * Changes:
 * - ✅ FIXED: Drop database between test suites
 * - ✅ FIXED: Force sync for each test run
 */

import { beforeAll, afterAll, afterEach } from "vitest";
import sequelize from "../../config/db.js";

// قبل از همه تست‌ها
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Test database connected");

    // ✅ حذف کامل و ایجاد مجدد
    await sequelize.drop({ cascade: true });
    await sequelize.sync({ force: true });
    console.log("✅ Test database synced (dropped and recreated)");
  } catch (error) {
    console.error("❌ Test database setup failed:", error.message);
    throw error;
  }
});

// بعد از هر تست
afterEach(async () => {
  // پاک کردن داده‌ها بعد از هر تست (اختیاری)
});

// بعد از همه تست‌ها
afterAll(async () => {
  try {
    await sequelize.close();
    console.log("✅ Test database connection closed");
  } catch (error) {
    console.error("❌ Error closing test database:", error.message);
  }
});
