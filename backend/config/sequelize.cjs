/**
 * sequelize.cjs
 * Path: backend/config/sequelize.cjs
 * Description: Sequelize CLI configuration (CommonJS)
 * Changes:
 * - ✅ FIXED: sequelize-cli always loads this file via require(), and this
 *   backend package has "type": "module". Node's require() of an ESM file
 *   (the old sequelize.js which used `export default`) returns an interop
 *   wrapper object ({ __esModule: true, default: {...} }) instead of the
 *   plain config object. sequelize-cli does not unwrap this, so every CLI
 *   command (migrate, seed, etc.) failed immediately with
 *   "Unknown arguments: __esModule, default". Using plain CommonJS here
 *   (module.exports) and a .cjs extension avoids that entirely.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const common = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "mysql",
  logging: false,
  seederStorage: "sequelize",
  seederStorageTableName: "SequelizeData",
};

module.exports = {
  development: { ...common },
  test: {
    ...common,
    database: `${process.env.DB_NAME}_test`,
  },
  production: {
    ...common,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
};
