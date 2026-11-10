/**
 * @file Notification.model.js
 * @description Mongoose schema for user notifications.
 * @architecture Stores notification data and references Users who have seen them.
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  data: [
    {
      title: {
        type: String,
        required: true,
      },
      content: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      type: {
        type: String,
        enum: ["info", "warning", "success", "error"],
        default: "info",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  seenBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Notification = mongoose.model("Notification", notificationSchema);

/**
 * @module Notification
 */
export default Notification;
