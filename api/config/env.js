/**
 * @file env.js
 * @description Loads environment variables from the root .env file.
 * @architecture Ensures environment configurations are loaded into process.env before other modules execute.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve root .env (two levels up from api/config)
const rootEnvPath = path.resolve(__dirname, "../../.env");
const apiEnvPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(apiEnvPath)) {
  dotenv.config({ path: apiEnvPath });
} else {
  dotenv.config();
}
