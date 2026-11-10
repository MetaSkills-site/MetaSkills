import dotenv from "dotenv";
import Admin from "../models/admin.model.js";
import connectDB from "../config/database.js";

dotenv.config();

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
