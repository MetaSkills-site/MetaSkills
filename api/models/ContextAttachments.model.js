/**
 * @file ContextAttachments.model.js
 * @description Mongoose schema for context attachments.
 * @architecture Relates to Question model to store attachment text content.
 */
import mongoose from "mongoose";

const ContextAttachmentsSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    text: {
      slate: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, "Content slate content is required"],
      },
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  },
  {
    timestamps: true,
  },
);

/**
 * @module ContextAttachment
 */
export default mongoose.model("ContextAttachment", ContextAttachmentsSchema);
