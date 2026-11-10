import mongoose from "mongoose";
import "../config/env.js";
import Module from "../models/Module.model.js";

const migrate = async () => {
  const isRollback = process.argv[2] === "rollback";

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      `Connected to MongoDB for ${isRollback ? "rollback" : "migration"}...`,
    );

    if (isRollback) {
      // ROLLBACK LOGIC
      try {
        await Module.collection.dropIndex("subject_1_name_1");
        console.log("Dropped new unique index: subject_1_name_1");
      } catch (err) {
        if (err.code === 27) {
          console.log("New index subject_1_name_1 not found, skipping drop.");
        } else {
          console.error("Error dropping new index:", err.message);
        }
      }

      try {
        await Module.collection.createIndex({ subject: 1 });
        console.log("Recreated old index: subject_1_order_1");
      } catch (err) {
        console.error("Error creating old index:", err.message);
      }
    } else {
      // MIGRATION LOGIC
      // 1. Drop old index if it exists
      try {
        await Module.collection.dropIndex("subject_1_order_1");
        console.log("Dropped old index: subject_1_order_1");
      } catch (err) {
        if (err.code === 27) {
          console.log("Old index subject_1_order_1 not found, skipping drop.");
        } else {
          console.error("Error dropping old index:", err.message);
        }
      }

      // 2. Find and resolve duplicates
      const cursor = Module.collection.aggregate([
        {
          $group: {
            _id: { subject: "$subject", name: "$name" },
            docs: { $push: "$_id" },
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ]);

      const duplicates = await cursor.toArray();
      let removedCount = 0;

      for (const group of duplicates) {
        const docIds = group.docs;
        // Keep the first one, delete the rest
        const deleteIds = docIds.slice(1);

        const result = await Module.collection.deleteMany({
          _id: { $in: deleteIds },
        });
        removedCount += result.deletedCount;
        console.log(
          `Resolved duplicates for subject: ${group._id.subject}, name: ${group._id.name}. Removed ${result.deletedCount} docs.`,
        );
      }

      console.log(`\nTotal duplicate modules removed: ${removedCount}`);

      // 3. Create the new unique index
      try {
        await Module.collection.createIndex(
          { subject: 1, name: 1 },
          { unique: true },
        );
        console.log("Created new unique index: subject_1_name_1");
      } catch (err) {
        console.error("Error creating new index:", err.message);
      }
    }

    console.log("---------------------------------------------------");
    console.log(`${isRollback ? "Rollback" : "Migration"} completed.`);
    process.exit(0);
  } catch (error) {
    console.error(`${isRollback ? "Rollback" : "Migration"} failed:`, error);
    process.exit(1);
  }
};

migrate();
