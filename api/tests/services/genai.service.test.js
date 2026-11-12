import { jest } from "@jest/globals";
import mongoose from "mongoose";
import Vocabulary from "../../models/Vocabulary.model.js";
import VocabProgress from "../../models/VocabProgress.model.js";
import {
  streamContent,
  evaluateSentence,
} from "../../services/genai.service.js";

describe("genai.service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Unit Tests (Mocked DB) ───────────────────────────────────────────────────
  // Edge cases, error handling, and input validation tested with injected mocks.
  // No real DB connection is used here.
  describe("Unit Tests", () => {
    // ── streamContent ──────────────────────────────────────────────────────────
    describe("streamContent", () => {
      it("should query recent vocab and invoke aiService.streamWithFallback", async () => {
        const mockVocabRepo = {
          find: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          select: jest
            .fn()
            .mockResolvedValue([{ word: "apple" }, { word: "banana" }]),
        };

        const mockAiService = {
          streamWithFallback: jest
            .fn()
            .mockResolvedValue({ text: "mock ai response" }),
        };

        const onStatus = jest.fn();
        const onChunk = jest.fn();

        const result = await streamContent(
          "vocab",
          { level: 1 },
          {
            vocabRepo: mockVocabRepo,
            aiService: mockAiService,
            onStatus,
            onChunk,
            abortSignal: {},
          },
        );

        expect(mockVocabRepo.find).toHaveBeenCalled();
        expect(mockAiService.streamWithFallback).toHaveBeenCalled();

        const callArgs = mockAiService.streamWithFallback.mock.calls[0];
        expect(callArgs[0]).toBeDefined();
        expect(callArgs[1]).toContain("apple, banana");
        expect(result.text).toBe("mock ai response");
      });

      it("should handle DB error gracefully and still call AI", async () => {
        // Validates that a failing vocabRepo does not abort the full generation request.
        const mockVocabRepo = {
          find: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          select: jest.fn().mockRejectedValue(new Error("DB Error")),
        };

        const mockAiService = {
          streamWithFallback: jest
            .fn()
            .mockResolvedValue({ text: "mock ai response" }),
        };

        const result = await streamContent(
          "vocab",
          { level: 1 },
          {
            vocabRepo: mockVocabRepo,
            aiService: mockAiService,
            onStatus: jest.fn(),
          },
        );

        expect(mockAiService.streamWithFallback).toHaveBeenCalled();
        expect(result.text).toBe("mock ai response");
      });

      it("should propagate error when aiService.streamWithFallback throws", async () => {
        // Validates that AI-level failures bubble up to the caller.
        const mockVocabRepo = {
          find: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue([]),
        };

        const mockAiService = {
          streamWithFallback: jest
            .fn()
            .mockRejectedValue(new Error("AI service unavailable")),
        };

        await expect(
          streamContent(
            "vocab",
            {},
            {
              vocabRepo: mockVocabRepo,
              aiService: mockAiService,
              onStatus: jest.fn(),
            },
          ),
        ).rejects.toThrow("AI service unavailable");
      });

      it("should trigger onStatus when parsing matching chunks (vocab mode)", async () => {
        const mockAiService = {
          streamWithFallback: jest.fn(
            async (models, prompt, sysInstr, { onChunk }) => {
              onChunk("- definition 1");
              return { text: "done" };
            },
          ),
        };

        const onStatus = jest.fn();
        await streamContent(
          "vocab",
          {},
          {
            aiService: mockAiService,
            onStatus,
            vocabRepo: {
              find: jest.fn().mockReturnThis(),
              sort: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              select: jest.fn().mockResolvedValue([]),
            },
          },
        );

        expect(onStatus).toHaveBeenCalledWith(
          expect.stringContaining("Drafting definitions for Word 1"),
        );
      });

      it("should trigger onStatus correctly in sentences mode", async () => {
        // Verifies the sentences-mode tracking branch.
        const mockAiService = {
          streamWithFallback: jest.fn(
            async (models, prompt, sysInstr, { onChunk }) => {
              onChunk("Sentence 1: The dog ran fast.");
              return { text: "done" };
            },
          ),
        };

        const onStatus = jest.fn();
        await streamContent(
          "sentences",
          { count: 1, difficulty: "Easy" },
          {
            aiService: mockAiService,
            onStatus,
          },
        );

        expect(onStatus).toHaveBeenCalledWith(
          expect.stringContaining("Crafting Sentence 1"),
        );
      });

      it("should trigger passage phase onStatus messages", async () => {
        // Verifies passage-mode phase transitions in the chunk tracker.
        // The service uses if/else-if branches per chunk call, so phases must be
        // crossed across separate incremental chunks to fire each branch independently.
        const mockAiService = {
          streamWithFallback: jest.fn(
            async (models, prompt, sysInstr, { onChunk }) => {
              // Chunk 1: triggers phase 0 → 1 ("Drafting passage title...")
              onChunk("TITLE: Some Title");
              // Chunk 2: triggers phase 1 → 2 ("Writing passage content...")
              onChunk("TITLE: Some Title\nBODY:\n" + "x".repeat(110));
              // Chunk 3: triggers phase 2 → 3 ("Developing main ideas...")
              onChunk("TITLE: Some Title\nBODY:\n" + "x".repeat(600));
              return { text: "done" };
            },
          ),
        };

        const onStatus = jest.fn();
        await streamContent(
          "passage",
          { topic: "History", difficulty: "Medium" },
          {
            aiService: mockAiService,
            onStatus,
          },
        );

        expect(onStatus).toHaveBeenCalledWith("Drafting passage title...");
        expect(onStatus).toHaveBeenCalledWith("Writing passage content...");
        expect(onStatus).toHaveBeenCalledWith("Developing main ideas...");
      });
    });

    // ── evaluateSentence ───────────────────────────────────────────────────────
    describe("evaluateSentence", () => {
      it("should validate cooldown, evaluate via aiService, and return UPDATE_CARROTS event", async () => {
        const mockVocabRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({
              _id: "v123",
              word: "apple",
              definition: "a fruit",
            }),
        };

        const mockVocabProgressRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({ box: 2, lastSentenceTestedAt: new Date(0) }),
          findOneAndUpdate: jest.fn(),
        };

        const mockAiService = {
          generateWithFallback: jest.fn().mockResolvedValue({
            text: '```json\n{"accuracy": 85, "errors": []}\n```',
          }),
        };

        const result = await evaluateSentence(
          "user123",
          "apple",
          "I ate an apple.",
          {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: mockAiService,
            onStatus: jest.fn(),
          },
        );

        expect(result.success).toBe(true);
        expect(result.data.accuracy).toBe(85);
        expect(result.events).toContainEqual(
          expect.objectContaining({ type: "UPDATE_CARROTS" }),
        );
      });

      it("should throw error if vocab item is not found", async () => {
        const mockVocabRepo = { findOne: jest.fn().mockResolvedValue(null) };
        await expect(
          evaluateSentence("user123", "apple", "I ate an apple.", {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: {},
            aiService: {},
          }),
        ).rejects.toThrow(/Vocabulary reference not found/);
      });

      it("should propagate DB error on vocabRepo.findOne", async () => {
        const mockVocabRepo = {
          findOne: jest.fn().mockRejectedValue(new Error("Vocab DB failure")),
        };
        await expect(
          evaluateSentence("user123", "apple", "I ate an apple.", {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: {},
            aiService: {},
          }),
        ).rejects.toThrow(/Vocab DB failure/);
      });

      it("should throw error if progress box < 2", async () => {
        const mockVocabRepo = {
          findOne: jest.fn().mockResolvedValue({ _id: "v123", word: "apple" }),
        };
        const mockVocabProgressRepo = {
          findOne: jest.fn().mockResolvedValue({ box: 1 }),
        };

        await expect(
          evaluateSentence("user123", "apple", "I ate an apple.", {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: {},
          }),
        ).rejects.toThrow(/not eligible for sentence practice yet/);
      });

      it("should throw error if word is on cooldown (box 2)", async () => {
        const mockVocabRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({
              _id: "v123",
              word: "apple",
              definition: "a fruit",
            }),
        };

        const mockVocabProgressRepo = {
          // Tested just now — within 3-day cooldown for box 2
          findOne: jest
            .fn()
            .mockResolvedValue({ box: 2, lastSentenceTestedAt: new Date() }),
        };

        await expect(
          evaluateSentence("user123", "apple", "I ate an apple.", {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: {},
            onStatus: jest.fn(),
          }),
        ).rejects.toThrow(/cooling down/);
      });

      it("should throw error if word is on cooldown (box 3+, 5-day window)", async () => {
        // Box 3+ words have a 5-day cooldown; tested 2 days ago is still cooling.
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const mockVocabRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({
              _id: "v123",
              word: "apple",
              definition: "a fruit",
            }),
        };
        const mockVocabProgressRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({ box: 3, lastSentenceTestedAt: twoDaysAgo }),
        };

        await expect(
          evaluateSentence("user123", "apple", "I ate an apple.", {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: {},
            onStatus: jest.fn(),
          }),
        ).rejects.toThrow(/cooling down/);
      });

      it("should throw error if AI response is missing required fields", async () => {
        const mockVocabRepo = {
          findOne: jest.fn().mockResolvedValue({ _id: "v123", word: "apple" }),
        };
        const mockVocabProgressRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({ box: 2, lastSentenceTestedAt: new Date(0) }),
        };
        const mockAiService = {
          generateWithFallback: jest
            .fn()
            .mockResolvedValue({ text: '{"not_accuracy": 100}' }),
        };

        await expect(
          evaluateSentence("user123", "apple", "I ate an apple.", {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: mockAiService,
          }),
        ).rejects.toThrow(/JSON missing required fields/);
      });

      it("should propagate error when vocabProgressRepo.findOne throws", async () => {
        // Validates that an unexpected DB failure during progress lookup is not swallowed.
        const mockVocabRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({
              _id: "v123",
              word: "apple",
              definition: "a fruit",
            }),
        };
        const mockVocabProgressRepo = {
          findOne: jest
            .fn()
            .mockRejectedValue(new Error("Progress DB failure")),
        };

        await expect(
          evaluateSentence("user123", "apple", "I ate an apple.", {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: {},
            onStatus: jest.fn(),
          }),
        ).rejects.toThrow("Progress DB failure");
      });

      it("should propagate error when aiService.generateWithFallback throws", async () => {
        // Validates AI-level failures bubble up to the caller.
        const mockVocabRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({
              _id: "v123",
              word: "apple",
              definition: "a fruit",
            }),
        };
        const mockVocabProgressRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({ box: 2, lastSentenceTestedAt: new Date(0) }),
        };
        const mockAiService = {
          generateWithFallback: jest
            .fn()
            .mockRejectedValue(new Error("AI evaluation failed")),
        };

        await expect(
          evaluateSentence("user123", "apple", "I ate an apple.", {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: mockAiService,
            onStatus: jest.fn(),
          }),
        ).rejects.toThrow("AI evaluation failed");
      });

      it("should return zero carrots and no UPDATE_CARROTS event when accuracy ≤ 60", async () => {
        // The carrot-award threshold is accuracy > 60; scores at or below yield nothing.
        const mockVocabRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({
              _id: "v123",
              word: "apple",
              definition: "a fruit",
            }),
        };
        const mockVocabProgressRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({ box: 2, lastSentenceTestedAt: new Date(0) }),
        };
        const mockAiService = {
          generateWithFallback: jest.fn().mockResolvedValue({
            text: '{"accuracy": 55, "errors": []}',
          }),
        };

        const result = await evaluateSentence("user123", "apple", "Apple.", {
          vocabRepo: mockVocabRepo,
          vocabProgressRepo: mockVocabProgressRepo,
          aiService: mockAiService,
          onStatus: jest.fn(),
        });

        expect(result.success).toBe(true);
        expect(result.data.carrotsAwarded).toBe(0);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].type).toBe("RECORD_SENTENCE_ATTEMPT");
      });

      it("should return no UPDATE_CARROTS event when userId is falsy even with high accuracy", async () => {
        // Carrots require a userId; without one the event must not be emitted.
        const mockVocabRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({
              _id: "v123",
              word: "apple",
              definition: "a fruit",
            }),
        };
        const mockVocabProgressRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({ box: 2, lastSentenceTestedAt: new Date(0) }),
        };
        const mockAiService = {
          generateWithFallback: jest.fn().mockResolvedValue({
            text: '{"accuracy": 90, "errors": []}',
          }),
        };

        const result = await evaluateSentence(
          null, // no userId
          "apple",
          "I ate a delicious, crisp apple from the orchard.",
          {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: mockAiService,
            onStatus: jest.fn(),
          },
        );

        expect(result.success).toBe(true);
        expect(result.events).toHaveLength(1);
        expect(result.events[0].type).toBe("RECORD_SENTENCE_ATTEMPT");
      });

      it("should correctly convert string accuracy from AI response to a number", async () => {
        // Some AI models return accuracy as a string (e.g., "85%"); the service must coerce it.
        const mockVocabRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({
              _id: "v123",
              word: "apple",
              definition: "a fruit",
            }),
        };
        const mockVocabProgressRepo = {
          findOne: jest
            .fn()
            .mockResolvedValue({ box: 2, lastSentenceTestedAt: new Date(0) }),
        };
        const mockAiService = {
          generateWithFallback: jest.fn().mockResolvedValue({
            text: '{"accuracy": "78%", "errors": []}',
          }),
        };

        const result = await evaluateSentence(
          "user123",
          "apple",
          "I ate an apple.",
          {
            vocabRepo: mockVocabRepo,
            vocabProgressRepo: mockVocabProgressRepo,
            aiService: mockAiService,
            onStatus: jest.fn(),
          },
        );

        expect(result.success).toBe(true);
        expect(typeof result.data.accuracy).toBe("number");
        expect(result.data.accuracy).toBe(78);
      });
    });
  });

  // ─── Integration Tests (Real DB) ─────────────────────────────────────────────
  // Verify Mongoose schema constraints and end-to-end flows using the real
  // test database connected in tests/setup.js.
  describe("Integration Tests", () => {
    afterEach(async () => {
      await Vocabulary.deleteMany({});
      await VocabProgress.deleteMany({});
    });

    // ── streamContent ──────────────────────────────────────────────────────────
    describe("streamContent", () => {
      it("should successfully fetch recent vocabulary from the real DB and pass to AI", async () => {
        await Vocabulary.create([
          { word: "orange", definition: "a citrus fruit" },
          { word: "grape", definition: "a small round fruit" },
        ]);

        const mockAiService = {
          streamWithFallback: jest
            .fn()
            .mockResolvedValue({ text: "integration done" }),
        };

        const result = await streamContent(
          "vocab",
          { level: 1 },
          {
            vocabRepo: Vocabulary,
            aiService: mockAiService,
            onStatus: jest.fn(),
          },
        );

        expect(mockAiService.streamWithFallback).toHaveBeenCalled();
        const callArgs = mockAiService.streamWithFallback.mock.calls[0];
        expect(callArgs[1]).toContain("orange");
        expect(callArgs[1]).toContain("grape");
        expect(result.text).toBe("integration done");
      });

      it("should pass an empty exclusion list when no vocabulary exists in DB", async () => {
        // Ensures the exclusion string degrades gracefully to "" when the collection is empty.
        const mockAiService = {
          streamWithFallback: jest
            .fn()
            .mockResolvedValue({ text: "empty db result" }),
        };

        const result = await streamContent(
          "vocab",
          { level: 1 },
          {
            vocabRepo: Vocabulary,
            aiService: mockAiService,
            onStatus: jest.fn(),
          },
        );

        const callArgs = mockAiService.streamWithFallback.mock.calls[0];
        // Prompt should not contain any word exclusion list
        expect(callArgs[1]).not.toMatch(/Blocklisted words:.+\w/);
        expect(result.text).toBe("empty db result");
      });
    });

    // ── evaluateSentence ───────────────────────────────────────────────────────
    describe("evaluateSentence", () => {
      it("should retrieve real Vocabulary and VocabProgress, then call AI", async () => {
        const userId = new mongoose.Types.ObjectId();
        const vocab = await Vocabulary.create({
          word: "cherry",
          definition: "a red fruit",
        });
        await VocabProgress.create({
          user: userId,
          word: vocab._id,
          box: 3,
          lastSentenceTestedAt: new Date(0),
        });

        const mockAiService = {
          generateWithFallback: jest.fn().mockResolvedValue({
            text: '```json\n{"accuracy": 90, "errors": []}\n```',
          }),
        };

        const result = await evaluateSentence(
          userId,
          "cherry",
          "This cherry is sweet.",
          {
            vocabRepo: Vocabulary,
            vocabProgressRepo: VocabProgress,
            aiService: mockAiService,
            onStatus: jest.fn(),
          },
        );

        expect(result.success).toBe(true);
        expect(result.data.accuracy).toBe(90);
        expect(result.events).toContainEqual(
          expect.objectContaining({ type: "UPDATE_CARROTS" }),
        );
      });

      it('should throw "Vocabulary reference not found" for a word absent from the DB', async () => {
        // Validates that the real DB lookup path correctly rejects non-existent words.
        const userId = new mongoose.Types.ObjectId();

        await expect(
          evaluateSentence(
            userId,
            "nonexistentword",
            "I used a nonexistentword.",
            {
              vocabRepo: Vocabulary,
              vocabProgressRepo: VocabProgress,
              aiService: {},
              onStatus: jest.fn(),
            },
          ),
        ).rejects.toThrow(/Vocabulary reference not found/);
      });

      it("should enforce the unique compound index (user + word) on VocabProgress", async () => {
        // Validates that the DB schema rejects duplicate progress records for the same user/word pair.
        const userId = new mongoose.Types.ObjectId();
        const vocab = await Vocabulary.create({
          word: "mango",
          definition: "a tropical fruit",
        });

        await VocabProgress.create({ user: userId, word: vocab._id, box: 2 });

        await expect(
          VocabProgress.create({ user: userId, word: vocab._id, box: 3 }),
        ).rejects.toThrow();
      });
    });
  });
});
