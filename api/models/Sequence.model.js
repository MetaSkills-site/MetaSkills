/**
 * @file Sequence.model.js
 * @description Mongoose schema for defining the sequence of modules for a specific grade and subject.
 * @architecture Contains a unique compound index on grade and subject, and an array of references to Module documents.
 */
import mongoose from "mongoose";

const SequenceSchema = new mongoose.Schema(
  {
    grade: {
      type: Number,
      required: [true, "Grade is required for sequence"],
      validate: {
        validator: function (v) {
          return v >= 1 && v <= 12;
        },
        message: "Grade must be between 1 and 12",
      },
    },
    subject: {
      type: String,
      enum: ["english", "maths"],
      required: [true, "Subject is required for sequence"],
    },
    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
  },
  {
    timestamps: true,
  },
);

SequenceSchema.index({ grade: 1, subject: 1 }, { unique: true });

/**
 * @module Sequence
 */
export default mongoose.model("Sequence", SequenceSchema);
