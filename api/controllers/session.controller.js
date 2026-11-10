/**
 * @file session.controller.js
 * @description Controller for managing user sessions.
 * @architecture Handles retrieving active sessions and terminating specific or all sessions.
 */
import Session from "../models/session.model.js";
import expressAsyncHandler from "express-async-handler";

/**
 * @desc    Get all active sessions with user details
 * @route   GET /api/sessions
 * @access  Admin
 */
const getActiveSessions = expressAsyncHandler(async (req, res) => {
  // Populate the 'id' field which references the User model
  // Selecting name, email, and pfp from the User model
  const sessions = await Session.find().populate(
    "id",
    "fullname email profilePicture profileImageData grade",
  );

  res.status(200).json(sessions);
});

/**
 * @desc    Delete a specific session by ID
 * @route   DELETE /api/sessions
 * @access  Admin
 */
const deleteSession = expressAsyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    res.status(400);
    throw new Error("Session ID is required");
  }

  const session = await Session.findById(id);

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  await session.deleteOne();
  res.status(200).json({ message: "Session deleted successfully" });
});

/**
 * @desc    Delete all active sessions
 * @route   DELETE /api/sessions/all
 * @access  Admin
 */
const deleteAllSessions = expressAsyncHandler(async (req, res) => {
  await Session.deleteMany({});
  res.status(200).json({ message: "All sessions cleared successfully" });
});

export default { getActiveSessions, deleteSession, deleteAllSessions };
