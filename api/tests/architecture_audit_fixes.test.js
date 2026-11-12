import { jest } from "@jest/globals";
import Question from "../models/Questions.model.js";
import Module from "../models/Module.model.js";
import ContextAttachment from "../models/ContextAttachments.model.js";
import User from "../models/user.model.js";
import VocabProgress from "../models/VocabProgress.model.js";
import Vocabulary from "../models/Vocabulary.model.js";
import Responses from "../models/Responses.model.js";

// Import controllers
// We'll need to mock the req/res objects for expressAsyncHandler
const mockReqRes = (body = {}, params = {}, query = {}, user = null) => {
  const req = { body, params, query, user };

  let resolvePromise, rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn((data) => {
      resolvePromise(data);
      return res;
    }),
    send: jest.fn((data) => {
      resolvePromise(data);
      return res;
    }),
  };

  const next = jest.fn((err) => {
    if (err) rejectPromise(err);
    else resolvePromise();
  });

  return { req, res, next, promise };
};

// Because they are default exports or named exports, we'll import them
import quizController from "../controllers/quiz.controller.js";
import contextAttachmentsController from "../controllers/contextAttachments.controller.js";
import vocabularyController from "../controllers/vocabulary.controller.js";
const { verifyVocabularyResponse } = vocabularyController;

describe("Architecture Audit Fixes", () => {
  let user, vocab;

  beforeEach(async () => {
    // Clear collections
    await Question.deleteMany({});
    await Module.deleteMany({});
    await ContextAttachment.deleteMany({});
    await User.deleteMany({});
    await VocabProgress.deleteMany({});
    await Vocabulary.deleteMany({});
    await Responses.deleteMany({});

    user = await User.create({
      fullname: "Test User",
      email: "test@example.com",
      password: "password123",
      carrots: { count: 10 },
    });

    vocab = await Vocabulary.create({
      word: "testword",
      definition: "A word used for testing.",
    });
  });

  describe("1. deleteModule cascade to Question.modules", () => {
    it("should remove the module ID from Question.modules when a module is deleted", async () => {
      const q = await Question.create({
        question: { slate: [{ text: "Test Question" }] },
        answerType: "SA",
        options: { sa: "Test Answer" },
      });
      const mod = await Module.create({
        name: "Test Module",
        subject: "english",
        questionIds: [q._id],
      });
      // Add module to question
      q.modules = [mod._id];
      await q.save();

      const { req, res, next, promise } = mockReqRes({
        id: mod._id.toString(),
      });

      // Call deleteModule
      quizController.deleteModule(req, res, next);
      await promise;

      // Fetch the question
      const updatedQ = await Question.findById(q._id);
      expect(updatedQ.modules.length).toBe(0); // Should be empty
    });
  });

  describe("2. deleteQuestionPermanently cascade to Module.questionIds", () => {
    it("should remove the question ID from Module.questionIds when a question is permanently deleted", async () => {
      const q = await Question.create({
        question: { slate: [{ text: "Test Question" }] },
        answerType: "SA",
        options: { sa: "Test Answer" },
      });
      const mod = await Module.create({
        name: "Test Module",
        subject: "english",
        questionIds: [q._id],
      });
      q.modules = [mod._id];
      await q.save();

      const { req, res, next, promise } = mockReqRes({ id: q._id.toString() });

      // Call deleteQuestionPermanently
      quizController.deleteQuestionPermanently(req, res, next);
      await promise;

      // Fetch the module
      const updatedMod = await Module.findById(mod._id);
      expect(updatedMod.questionIds.length).toBe(0); // Should be empty
    });
  });

  describe("3. deleteContext cascade to Question.contextAttachmentId", () => {
    it("should unset contextAttachmentId from Question when context is deleted", async () => {
      const ctx = await ContextAttachment.create({
        title: "Test Context",
        text: { slate: [{ text: "Context content" }] },
      });

      const q = await Question.create({
        question: { slate: [{ text: "Test Question" }] },
        answerType: "SA",
        options: { sa: "Test Answer" },
        contextAttachmentId: ctx._id,
      });

      const { req, res, next, promise } = mockReqRes(
        {},
        { id: ctx._id.toString() },
      );

      // Call deleteContext
      contextAttachmentsController.deleteContext(req, res, next);
      await promise;

      const updatedQ = await Question.findById(q._id);
      expect(updatedQ.contextAttachmentId).toBeNull();
    });
  });

  describe("4. Transaction rollback on verifyVocabularyResponse failure", () => {
    it("should rollback user carrots and vocab progress if Responses.create fails", async () => {
      const vp = await VocabProgress.create({
        user: user._id,
        word: vocab._id,
        box: 0,
      });

      const { req, res, next, promise } = mockReqRes(
        {
          wordId: vocab._id.toString(),
          isCorrect: true,
          accuracy: 100,
          timeTaken: 5000,
        },
        {},
        {},
        user,
      );

      // Mock Responses.create to throw an error
      const originalCreate = Responses.create.bind(Responses);
      Responses.create = jest
        .fn()
        .mockRejectedValue(new Error("Database failure simulation"));

      try {
        verifyVocabularyResponse(req, res, next);
        await promise;
      } catch {
        // Expected to throw
      }

      // Verify rollback
      const updatedUser = await User.findById(user._id);
      const updatedVp = await VocabProgress.findById(vp._id);

      // Carrots should remain at 10 (not increased by GAMIFICATION.VOCABULARY_MARATHON_AWARD)
      expect(updatedUser.carrots.count).toBe(10);

      // Box should remain 0
      expect(updatedVp.box).toBe(0);

      // Restore
      Responses.create = originalCreate;
    });
  });
});
