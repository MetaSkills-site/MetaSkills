/**
 * @file Responses.model.js
 * @description Mongoose schema for user responses to questions.
 * @architecture Tracks time taken, accuracy, and relationships to User, Question, Module, and Passages models. Handles marathon mode conditionals.
 */
import mongoose from "mongoose";

const ResponsesSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    isMarathon: {
      type: Boolean,
      default: false,
    },
    questionId: {
      type: mongoose.Types.ObjectId,
      ref: "Question",
      required: function () {
        return !this.isMarathon;
      },
    },
    moduleId: {
      type: mongoose.Types.ObjectId,
      ref: "Module",
      required: function () {
        return !this.isMarathon;
      },
    },
    passageId: {
      type: mongoose.Types.ObjectId,
      ref: "Passages",
      required: false,
    },
    response: {
      type: mongoose.Schema.Types.Mixed, // String for MCQ (e.g., "A"), String/Number for SA
      required: function () {
        return !this.isMarathon;
      },
    },

    timeTaken: {
      type: Number, // in seconds
      required: [true, "Time taken is required"],
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    marathonType: {
      type: String,
      required: function () {
        return this.isMarathon;
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * @module Responses
 */
export default mongoose.model("Responses", ResponsesSchema);
