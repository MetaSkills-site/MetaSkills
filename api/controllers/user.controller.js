/**
 * @file user.controller.js
 * @description Controller for managing user authentication, profiles, and interactions.
 * @architecture Handles Google OAuth, user profiles, session tracking, and gamification state (carrots).
 */
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import Responses from "../models/Responses.model.js";
import VocabProgress from "../models/VocabProgress.model.js";
import Notification from "../models/Notification.model.js";
import ErrorModel from "../models/Errors.model.js";
import expressAsyncHandler from "express-async-handler";
import generateToken from "../utils/genToken.js";
import { OAuth2Client } from "google-auth-library";
import mongoose from "mongoose";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * @desc    Create a new user session
 * @param   {string} id - User ID
 * @param   {string} token - Authentication token
 * @returns {boolean} True if successfully created
 */
const newSession = expressAsyncHandler(async (id, token) => {
  try {
    await Session.findOneAndUpdate(
      { id, onModel: "User" },
      { $set: { token } },
      { upsert: true, new: true },
    );
    return true;
  } catch (err) {
    throw new Error("Could not create a new session", { cause: err });
  }
});
/**
 * @desc    Logout user and delete session
 * @route   POST /api/users/logout
 * @access  Private
 */
const deleteSession = expressAsyncHandler(async (req, res) => {
  try {
    let token = req.cookies && req.cookies.authToken;
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (req.user && req.user._id) {
      await Session.deleteMany({ id: req.user._id });
    } else if (token) {
      await Session.deleteOne({ token });
    }

    res.clearCookie("authToken", cookieOptions).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (err) {
    res.status(500);
    throw new Error("Failed to end session", { cause: err });
  }
});

/**
 * @desc    Authenticate user via Google OAuth
 * @route   POST /api/users/google-auth
 * @access  Public
 */
const googleAuth = expressAsyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error("Google credential is required");
  }

  try {
    // Verify Google token
    const googleClientId =
      process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email || !name) {
      res.status(400);
      throw new Error("Invalid Google token - missing required fields");
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Existing user - login and sync profile info if not already set
      if (!user.fullname) user.fullname = name;
      if (!user.profilePicture && picture) user.profilePicture = picture;
      await user.save();

      const userObj = user.toObject();
      const token = generateToken(userObj);

      if (await newSession(user._id, token)) {
        res.cookie("authToken", token, cookieOptions).json({
          message: "Logged in successfully",
          user: userObj,
        });
      } else {
        throw new Error("Session could not be created");
      }
    } else {
      // New user - create account without grade
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const users = await User.create(
          [
            {
              fullname: name,
              email: email,
              profilePicture: picture || "",
              carrots: {
                count: 0,
                lastdate: new Date(),
                history: [0, 0, 0, 0, 0, 0, 0],
              },
              // grade will be set later via completeProfile
            },
          ],
          { session },
        );
        user = users[0];

        const userObj = user.toObject();
        const token = generateToken(userObj);

        if (await newSession(user._id, token)) {
          await session.commitTransaction();
          res.cookie("authToken", token, cookieOptions).status(201).json({
            message: "Account created successfully",
            user: userObj,
          });
        } else {
          throw new Error("Session could not be created");
        }
      } catch (e) {
        await session.abortTransaction();
        throw e;
      } finally {
        session.endSession();
      }
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401);
    throw new Error("Google authentication failed: " + error.message, {
      cause: error,
    });
  }
});

/**
 * @desc    Complete user profile (set grade)
 * @route   POST /api/users/complete-profile
 * @access  Private
 */
const completeProfile = expressAsyncHandler(async (req, res) => {
  const { grade } = req.body;

  if (!grade) {
    res.status(400);
    throw new Error("Grade is required");
  }

  // Validate grade is between 1-12
  const gradeNum = parseInt(grade);
  if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 12) {
    res.status(400);
    throw new Error("Grade must be between 1 and 12");
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { grade: gradeNum } },
      { new: true, runValidators: true },
    ).select("-__v");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const updatedUser = user.toObject();

    // Generate new token reflecting the updated grade
    const token = generateToken(updatedUser);

    // Update session in DB
    await newSession(user._id, token);

    // Issue new cookie
    res.cookie("authToken", token, cookieOptions).json({
      message: "Profile completed successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to update profile: " + error.message, {
      cause: error,
    });
  }
});

/**
 * @desc    List all users (paginated, searchable, filterable)
 * @route   GET /api/users
 * @access  Admin
 */
const list = expressAsyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, search, grades } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (grades) {
      const gradesArray = Array.isArray(grades)
        ? grades.map(Number)
        : grades.split(",").map(Number);
      if (gradesArray.length > 0) {
        query.grade = { $in: gradesArray };
      }
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      data: users,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(400).json({
      error: `Error: ${err.message}`,
    });
  }
});

/**
 * @desc    Middleware to fetch and append user profile to req
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware
 * @param   {string} id - User ID from params
 */
const getUserById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: `Error: ${err}`,
      });
    }
    req.profile = user;
    next();
  });
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUser = expressAsyncHandler(async (req, res) => {
  if (req.body.carrots || req.body.lastSeen || req.body.days || req.body.week) {
    res.status(403);
    throw new Error("You can't alter these values");
  }
  let updated = { ...req.body };
  if (req.body.email) {
    if (await User.findOne({ email: req.body.email })) {
      res.status(400).json({
        success: false,
        message: "This email is already registered to an account",
      });
    }
  }

  var user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updated },
    {
      new: true,
      runValidators: true,
    },
  ).select("-__v");
  if (!user) {
    res.status(404);
    throw new Error("User cannot be found");
  } else {
    res.json({ message: "Profile updated successfully" });
  }
});
/**
 * @desc    Dummy middleware for logging ID
 * @param   {Object} req - Request object
 * @param   {Object} res - Response object
 * @param   {Function} next - Next middleware
 * @param   {string} id - User ID
 */
const _getUserById = async (req, res, next, id) => {
  console.log("Running getUserById for ID:", id);
};

/**
 * @desc    Read and refresh current user profile session
 * @route   GET /api/users/me
 * @access  Private
 */
const read = expressAsyncHandler(async (req, res) => {
  try {
    // Verify user is valid and dynamically pad carrot history to today
    const user = await User.adjustCarrots(req.user._id, 0);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const userObj = user.toObject();

    // Check if the current token payload matches the latest user data
    const tokenPayload = req.user;

    const hasChanged =
      tokenPayload.fullname !== userObj.fullname ||
      tokenPayload.email !== userObj.email ||
      tokenPayload.grade !== userObj.grade ||
      tokenPayload.profilePicture !== userObj.profilePicture ||
      JSON.stringify(tokenPayload.carrots?.history) !==
        JSON.stringify(userObj.carrots?.history) ||
      tokenPayload.carrots?.count !== userObj.carrots?.count;

    if (!hasChanged) {
      res.json({ success: true, user: userObj });
      return;
    }

    const token = generateToken(userObj);
    await newSession(user._id, token);
    res.cookie("authToken", token, cookieOptions).json({
      success: true,
      user: userObj,
    });
  } catch (err) {
    res.status(401);
    throw new Error(err.message, { cause: err });
  }
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const deleteUser = expressAsyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    await User.findByIdAndDelete(req.params.id);
    await Session.deleteMany({ id: req.params.id });
    await Responses.deleteMany({ userId: req.params.id });
    await VocabProgress.deleteMany({ user: req.params.id });
    await ErrorModel.deleteMany({ user: req.params.id });
    await Notification.updateMany({}, { $pull: { seenBy: req.params.id } });
    res.json({ message: "User removed" });
  } catch (err) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(err.message, { cause: err });
  }
});

/**
 * @desc    Update specific user by ID
 * @route   PUT /api/users/:id
 * @access  Admin
 */
const updateUserById = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.fullname = req.body.fullname || user.fullname;
    user.email = req.body.email || user.email;
    user.grade = req.body.grade || user.grade;

    // Add other fields as needed

    // Save user first before delegating to static method for carrots
    await user.save();

    if (req.body.carrots !== undefined) {
      let newCount =
        typeof req.body.carrots === "number"
          ? req.body.carrots
          : req.body.carrots.count !== undefined
            ? req.body.carrots.count
            : user.carrots.count;

      const diff = newCount - user.carrots.count;
      if (diff !== 0) {
        await User.adjustCarrots(user._id, diff);
        // Re-fetch to get padded values
        const refreshedUser = await User.findById(user._id).lean();
        user.set("carrots", refreshedUser.carrots);
      }
    }

    res.json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      grade: user.grade,
      carrots: user.carrots,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

/**
 * @desc    Get a specific user by ID
 * @route   GET /api/users/:id
 * @access  Admin
 */
const getUser = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-__v");
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

/**
 * @desc    Get current user's carrot status
 * @route   GET /api/users/carrots
 * @access  Private
 */
const getCarrots = expressAsyncHandler(async (req, res) => {
  // Pass 0 to addCarrots to naturally sync `lastdate` and zero-pad the
  // `history` array without inflating the user's actual count or today's earnings.
  const user = await User.adjustCarrots(req.user._id, 0);
  if (user) {
    res.json({
      success: true,
      carrots: user.carrots || {
        count: 0,
        lastdate: new Date(),
        history: [0, 0, 0, 0, 0, 0, 0],
      },
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

/**
 * @desc    Test login for E2E testing
 * @route   POST /api/users/dev-login
 * @access  Public (Test env only)
 */
const devLogin = expressAsyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403);
    throw new Error("Forbidden");
  }

  let user = await User.findOne({ email: "e2e-test-user@metaskills.dev" });
  if (!user) {
    user = await User.create({
      fullname: "E2E Test User",
      email: "e2e-test-user@metaskills.dev",
      grade: 5,
    });
  }

  const userObj = user.toObject();
  const token = generateToken(userObj);

  if (await newSession(user._id, token)) {
    res.cookie("authToken", token, cookieOptions).json({
      message: "Dev login successful",
      user: userObj,
    });
  } else {
    throw new Error("Session creation failed");
  }
});

export default {
  googleAuth,
  devLogin,
  completeProfile,
  updateUser,
  getUserById,
  _getUserById,
  read,
  deleteSession,
  getAllUsers: list,
  deleteUser,
  updateUserById,
  getUser,
  getCarrots,
};

/*
      Somewhere there carrots property of users is not stores/sent/recieved. check using postman.
*/
