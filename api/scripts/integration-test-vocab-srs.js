/**
 * @file integration-test-vocab-srs.js
 * @description Runs end-to-end integration tests for vocabulary Spaced Repetition System quizzes, Leitner box progressions, and daily limits.
 * @architecture Part of the automated test and validation harness exercising HTTP endpoints against live MongoDB collections.
 * @agent_note Requires the API server running on port 7860 and automatically tears down its ephemeral test user and progress records upon completion.
 */

import axios from "axios";
import mongoose from "mongoose";
import "../config/env.js";
import Vocabulary from "../models/Vocabulary.model.js";
import VocabProgress from "../models/VocabProgress.model.js";
import User from "../models/user.model.js";

const API_BASE = "http://localhost:7860/api";
const TEST_EMAIL = `srs_tester_${Date.now()}@example.com`;

// Set default headers to bypass anti-direct-access middleware
axios.defaults.headers.common["Origin"] = "http://localhost:5173";
axios.defaults.headers.common["Referer"] = "http://localhost:5173/";

/**
 * @desc Executes an automated E2E test suite covering user creation, 20-word quiz grading, daily limit enforcement, Leitner intervals, and review priority overrides.
 * @returns {Promise<void>} Resolves when all test assertions and cleanups conclude.
 */
async function runTests() {
  console.log("🚀 Starting Extensive SRS Integration Tests...\n");
  let token = null;
  let testUserId = null;
  let exitCode = 0;

  try {
    // 1. DATABASE PREP (Ensure words exist)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to Database for verification.");
    const vocabCount = await Vocabulary.countDocuments();
    if (vocabCount < 25) {
      console.log(
        "⚠️ Not enough vocabulary words for a robust test. Need at least 25. Found:",
        vocabCount,
      );
      console.log("Please add words or run a seeder.");
      process.exit(1);
    }

    // 2. CREATE TEST USER
    console.log(`\n👤 Creating test user: ${TEST_EMAIL}`);
    try {
      const user = await User.create({
        fullname: "SRS Test User",
        email: TEST_EMAIL,
        grade: 10,
      });
      testUserId = user._id;

      const jwt = (await import("jsonwebtoken")).default;
      const Session = (await import("../models/session.model.js")).default;

      const userObj = user.toObject();
      token = jwt.sign(userObj, process.env.JWT_SECRET, { expiresIn: "30d" });

      await Session.create({ id: testUserId, token });

      console.log("✅ User created successfully. Token acquired.");
    } catch (err) {
      console.error("❌ Failed to create user:", err.message);
      throw err;
    }

    // 3. TESTING THE 20-WORD FETCH LOOP & GRADING
    console.log("\n🔄 Initiating Loop: Fetching and Grading 20 words...");
    let successfulFetches = 0;

    // We will purposely answer ALL 20 correctly so they get 1 day spacing and clear out the "due today" queue.
    for (let i = 1; i <= 20; i++) {
      let fetchRes;
      try {
        fetchRes = await axios.get(`${API_BASE}/vocabulary/quiz`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error(
          `❌ Failed to fetch word #${i}:`,
          err.response?.data || err.message,
        );
        throw err;
      }

      const questionData = fetchRes.data.data;
      if (!questionData || !questionData.vocabId)
        throw new Error("Invalid question format received");

      const correctWordDoc = await Vocabulary.findById(questionData.vocabId);
      const correctAnswer = correctWordDoc.definition;
      const wrongAnswer =
        "This is a deliberately wrong answer to test SRS boxes.";

      const isCorrectSubmit = i <= 10;
      const submittedAnswer = isCorrectSubmit ? correctAnswer : wrongAnswer;

      const submitPayload = {
        userId: testUserId,
        vocabId: questionData.vocabId,
        response: [submittedAnswer],
        timeTaken: 12,
        isMarathon: true,
        type: "vocabulary",
      };

      const verifyRes = await axios.post(
        `${API_BASE}/vocabulary/verify`,
        submitPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const result = verifyRes.data;
      if (result.data.accuracy === 100 && !isCorrectSubmit)
        throw new Error("Expected incorrect grading, got 100%");
      if (result.data.accuracy === 0 && isCorrectSubmit)
        throw new Error("Expected correct grading, got 0%");

      successfulFetches++;
    }

    console.log(
      `✅ Passed: Successfully fetched and graded ${successfulFetches} new words.`,
    );

    // 4. TESTING THE DAILY LIMIT CAP (Attempt 21)
    console.log("\n🛑 Testing Daily Limit Cap (Attempt 21)...");
    let hitLimit = false;
    try {
      await axios.get(`${API_BASE}/vocabulary/quiz`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      if (
        err.response?.status === 403 &&
        err.response?.data?.message === "Daily limit reached"
      ) {
        hitLimit = true;
        console.log(
          "✅ Passed: Daily limit 403 caught successfully on 21st attempt.",
        );
      } else {
        console.error(
          "❌ Unexpected error on 21st attempt:",
          err.response?.data || err.message,
        );
        throw err;
      }
    }
    if (!hitLimit)
      throw new Error(
        "Failed to enforce daily limit. Server returned a word instead of 403.",
      );

    // 5. DIRECT DB VERIFICATION OF SRS LOGIC
    console.log("\n🔍 Verifying Database Box Progressions...");
    const allProgress = await VocabProgress.find({ user: testUserId });
    if (allProgress.length !== 20)
      throw new Error(
        `Expected exactly 20 track records, found ${allProgress.length}`,
      );

    let correctBoxCount = 0;
    let wrongBoxCount = 0;

    for (const p of allProgress) {
      if (p.box === 1) correctBoxCount++;
      if (p.box === 0) wrongBoxCount++;

      if (p.box === 1) {
        const diffDays = Math.round(
          (p.nextReviewDate - p.createdAt) / (1000 * 60 * 60 * 24),
        );
        if (diffDays < 0 || diffDays > 2)
          throw new Error(
            `Box 1 word has incorrect interval. Expected 1±1 day, got ${diffDays}`,
          );
      } else if (p.box === 0) {
        const diffMins = Math.round(
          (p.nextReviewDate - p.createdAt) / (1000 * 60),
        );
        if (diffMins < 8 || diffMins > 12)
          throw new Error(
            `Box 0 word has incorrect interval. Expected 8-12 minutes, got ${diffMins}`,
          );
      }
    }

    console.log(
      `✅ Passed: DB shows ${correctBoxCount} words advanced to Box 1, and ${wrongBoxCount} words stayed in Box 0.`,
    );
    if (correctBoxCount !== 10 || wrongBoxCount !== 10)
      throw new Error("Box distributions did not match.");

    // 6. DUE WORD OVERRIDE TEST (Simulate time travel)
    console.log(
      "\n⏳ Simulating time travel for 1 word to test review priority override...",
    );
    const overdueWord = allProgress[0];
    overdueWord.nextReviewDate = new Date(Date.now() - 86400000); // Set to yesterday
    await overdueWord.save();

    console.log(
      "Attempting fetch with daily limit active but having 1 overdue review...",
    );
    const overrideRes = await axios.get(`${API_BASE}/vocabulary/quiz`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (
      overrideRes.data.data.vocabId.toString() !== overdueWord.word.toString()
    ) {
      throw new Error(
        "Failed to prioritize due review word. It either blocked it or fetched the wrong one.",
      );
    }
    console.log(
      "✅ Passed: System bypassed the daily new-word limit and correctly served the due review word!",
    );

    console.log("\n🎉 ALL EXTENSIVE INTEGRATION TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    exitCode = 1;
    console.error("\n💥 INTEGRATION TEST FAILED!");
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error("Payload:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  } finally {
    // CLEANUP
    console.log("\n🧹 Cleaning up test data...");
    if (testUserId) {
      await User.findByIdAndDelete(testUserId);
      await VocabProgress.deleteMany({ user: testUserId });
      console.log("✅ Test user and progress data purged.");
    }
    await mongoose.disconnect();
    process.exit(exitCode);
  }
}

runTests();
