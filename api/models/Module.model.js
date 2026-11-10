/**
 * @file Module.model.js
 * @description Mongoose schema for educational modules.
 * @architecture Has unique compound index on subject and name, references Question model.
 */
import mongoose from "mongoose";

const ModuleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Module name is required"],
    },
    subject: {
      type: String,
      enum: ["english", "maths"],
      required: [true, "Module subject type is required"],
    },

    questionIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Question",
      default: [],
    },
    grades: {
      type: [Number],
      validate: {
        validator: function (v) {
          // Check if every element in the array is between 1 and 12
          return v.every((grade) => grade >= 1 && grade <= 12);
        },
        message: "Grades must be between 1 and 12",
      },
      default: [],
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

ModuleSchema.index({ subject: 1, name: 1 }, { unique: true });

ModuleSchema.pre("validate", function (next) {
  if (this.questionIds && this.questionIds.length > 0) {
    this.questionIds = [
      ...new Set(this.questionIds.map((id) => id.toString())),
    ];
  }
  next();
});

/**
 * @module Module
 */
export default mongoose.model("Module", ModuleSchema);
