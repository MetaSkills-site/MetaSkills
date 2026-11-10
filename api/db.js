/**
 * @file db.js
 * @description Framework-agnostic MongoDB/Mongoose connection manager.
 * Re-exports the robust database manager from config/database.js.
 */

export * from "./config/database.js";
export { default } from "./config/database.js";
