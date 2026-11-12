/**
 * @file createAdmin.js
 * @description CLI utility for provisioning new administrator accounts with designated email addresses and names.
 * @architecture Part of the administrative tooling and user management tier interacting directly with the Admin collection.
 * @agent_note Expects command-line arguments for email and optional full name, exiting with code 1 if required parameters are missing.
 */

import dotenv from "dotenv";
import Admin from "../models/admin.model.js";
import connectDB from "../config/database.js";

dotenv.config();

/**
 * @desc Validates CLI arguments, connects to MongoDB, and registers a new Admin document if not already existing.
 * @returns {Promise<void>} Resolves when the admin record is verified or created.
 */
const createAdmin = async () => {
  await connectDB();

  const email = process.argv[2];
  const fullname = process.argv[3] || "Admin User";

  if (!email) {
    console.error(
      "Please provide an email: node scripts/createAdmin.js <email> [fullname]",
    );
    process.exit(1);
  }

  try {
    const exists = await Admin.findOne({ email });
    if (exists) {
      console.log("Admin already exists");
      process.exit(0);
    }

    await Admin.create({
      email,
      fullname,
      role: "admin",
    });

    console.log(`Admin created: ${email}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
