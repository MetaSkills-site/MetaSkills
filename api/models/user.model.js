/**
 * @file user.model.js
 * @description Mongoose schema for the user entity.
 * @architecture Stores user profiles, progress, ratings, and carrots history with helper static methods.
 */
import mongoose from "mongoose";

const UserSchema = mongoose.Schema(
  {
    profilePicture: {
      type: String,
      default: "",
    },
    fullname: {
      type: String,
      trim: true,
      required: [true, "Full name is required"],
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "is invalid"],
    },
    lastSeen: {
      type: Number,
      default: Date.now,
    },
    week: {
      type: Number,
      default: 1,
    },
    days: {
      type: [Number],
      default: [-1, -1, -1, -1, -1, -1, -1],
    },
    grade: {
      type: Number,
      required: false, // Optional - users set this after OAuth login
      enum: {
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        message: "{VALUE} is not a valid class",
      },
    },

    carrots: {
      count: {
        type: Number,
        min: 0,
        default: 0,
      },
      lastdate: {
        type: Date,
        default: Date.now,
      },
      history: {
        type: [Number],
        default: [0, 0, 0, 0, 0, 0, 0],
      },
    },
    rating: {
      type: Number, // Natively supports decimals/doubles
      default: 1200,
    },
    vocabRating: {
      type: Number,
      default: 1200,
    },
  },
  { timestamps: true },
);

/**
 * @desc    Adds a positive amount of carrots to the user's account
 * @param   {string|ObjectId} userId - The ID of the user
 * @param   {number} amount - The positive amount of carrots to add
 * @returns {Promise<Document>} The updated user document
 */
UserSchema.statics.addCarrots = async function (userId, amount) {
  if (typeof amount !== "number" || amount <= 0) {
    throw new Error("addCarrots: amount must be a positive number");
  }
  return await this.adjustCarrots(userId, amount);
};

/**
 * @desc    Adjusts the user's carrot count and updates the weekly history array
 * @param   {string|ObjectId} userId - The ID of the user
 * @param   {number} amount - The amount to add or subtract
 * @returns {Promise<Document>} The updated user document
 */
UserSchema.statics.adjustCarrots = async function (
  userId,
  amount,
  session = null,
) {
  if (typeof amount !== "number") {
    throw new Error("adjustCarrots: amount must be a number");
  }

  try {
    const user = await this.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    if (!user.carrots) {
      user.carrots = {
        count: 0,
        lastdate: new Date(),
        history: [0, 0, 0, 0, 0, 0, 0],
      };
    }

    const carrots = user.carrots;

    if (carrots.count + amount < 0) {
      throw new Error("adjustCarrots: result cannot be negative");
    }

    const stripTime = (d) =>
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const normalizedToday = stripTime(new Date());
    const normalizedLastDate = stripTime(
      carrots.lastdate ? new Date(carrots.lastdate) : new Date(),
    );

    const diffTime = normalizedToday - normalizedLastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      if (diffDays >= 7) {
        carrots.history = [0, 0, 0, 0, 0, 0, 0];
      } else {
        // Shift history left by diffDays
        for (let i = 0; i < diffDays; i++) {
          carrots.history.shift();
          carrots.history.push(0);
        }
      }
      carrots.lastdate = normalizedToday;
    }

    carrots.count += amount;
    // history[6] is always today's earnings
    carrots.history[6] += amount;

    // Use markModified since we are mutating a nested object
    user.markModified("carrots");
    await user.save({ session });
    return user;
  } catch (error) {
    console.error("Error adjusting carrots:", error);
    throw error;
  }
};

UserSchema.methods = {};

/**
 * @module User
 */
export default mongoose.model("User", UserSchema);
