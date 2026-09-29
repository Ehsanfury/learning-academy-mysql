/**
 * 001-initial-schema.js
 * Path: backend/migrations/001-initial-schema.js
 * Description: Initial database schema migration
 * Changes:
 * - ✅ REWRITTEN: The previous version of this migration hand-defined 11
 *   tables using the wrong (default Sequelize) table names, e.g. "Users"
 *   instead of the "users" that every model actually declares via
 *   `tableName:`. It also never created 11 other tables the app depends on
 *   (tickets, scenarios, scenario_sessions, stories, story_progress,
 *   notifications, user_notifications, mentors, mentor_sessions, exercises,
 *   ai_conversations) - meaning `npm run migrate` (the path CI and any real
 *   deployment uses) produced a database that didn't match the models at
 *   all, and every query against those tables failed.
 * - ✅ FIXED: This migration now builds the schema directly from the actual
 *   Sequelize model definitions in ../models/index.js (single source of
 *   truth), so table/column names are guaranteed to match what the app
 *   queries, instead of being hand-transcribed and drifting out of sync.
 */

export default {
  up: async (queryInterface, Sequelize) => {
    const { default: db } = await import("../models/index.js");

    // Create every registered model's table, in dependency order.
    // force:false = don't drop existing tables; alter:false = plain create.
    await db.sequelize.sync({ force: false, alter: false });
  },

  down: async (queryInterface) => {
    const { default: db } = await import("../models/index.js");

    // Drop all tables in reverse dependency order to respect FKs.
    await db.sequelize.drop({ cascade: true });
  },
};
