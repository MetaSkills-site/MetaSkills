import { jest } from '@jest/globals';
import { createQuestion } from '../../services/quiz.service.js';
import mongoose from 'mongoose';
import Module from '../../models/Module.model.js';
import Question from '../../models/Questions.model.js';

describe('quiz.service - createQuestion', () => {
  describe('Unit Tests', () => {
    let mockQuestionRepo;
    let mockModuleRepo;
    let mockWithTransaction;

    beforeEach(() => {
      mockQuestionRepo = {
        create: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId() }]),
      };
      mockModuleRepo = {
        updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
      mockWithTransaction = jest.fn(async (cb) => {
        // Simulate running the transaction callback
        return cb({ session: 'mock-session' });
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should validate required fields', async () => {
      const input = {
        question: null,
        options: null,
        explanation: null,
        modules: null
      };

      await expect(
        createQuestion(input, {
          questionRepo: mockQuestionRepo,
          moduleRepo: mockModuleRepo,
          withTransaction: mockWithTransaction
        })
      ).rejects.toThrow('Please provide all required fields');
    });

    it('should successfully create a question and emit finalization and backup events', async () => {
      const input = {
        question: { slate: [] },
        options: { type: 'MCQ', mcq: { A: { text: 'A' }, B: { text: 'B' } } },
        explanation: { slate: [] },
        modules: ['module-id-1'],
        optionIndex: 0, // A corresponds to index 0

        tags: ['tag1'],
        skills: ['skill1'],
        contextAttachmentId: null,
      };

      const result = await createQuestion(input, {
        questionRepo: mockQuestionRepo,
        moduleRepo: mockModuleRepo,
        withTransaction: mockWithTransaction
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.answerType).toBe('MCQ');
      
      // Check that we returned the side effect intents
      expect(result.events).toContainEqual({
        type: 'FINALIZE_FILES',
        payload: expect.any(Object)
      });
      expect(result.events).toContainEqual({
        type: 'TRIGGER_BACKUP'
      });

      // Check dependency usage
      expect(mockWithTransaction).toHaveBeenCalled();
      expect(mockQuestionRepo.create).toHaveBeenCalled();
      expect(mockModuleRepo.updateMany).toHaveBeenCalled();
    });

    it('should handle database errors during question creation', async () => {
      const input = {
        question: { slate: [] },
        options: { type: 'MCQ', mcq: { A: { text: 'A' }, B: { text: 'B' } } },
        explanation: { slate: [] },
        modules: ['module-id-1'],
        optionIndex: 0,

        tags: ['tag1'],
        skills: ['skill1'],
        contextAttachmentId: null,
      };

      mockQuestionRepo.create = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(
        createQuestion(input, {
          questionRepo: mockQuestionRepo,
          moduleRepo: mockModuleRepo,
          withTransaction: mockWithTransaction
        })
      ).rejects.toThrow('DB Error');
    });

    it('should handle database errors during module update', async () => {
      const input = {
        question: { slate: [] },
        options: { type: 'MCQ', mcq: { A: { text: 'A' }, B: { text: 'B' } } },
        explanation: { slate: [] },
        modules: ['module-id-1'],
        optionIndex: 0,
        tags: ['tag1'],
        skills: ['skill1'],
        contextAttachmentId: null,
      };

      mockModuleRepo.updateMany = jest.fn().mockRejectedValue(new Error('Module DB Error'));

      await expect(
        createQuestion(input, {
          questionRepo: mockQuestionRepo,
          moduleRepo: mockModuleRepo,
          withTransaction: mockWithTransaction
        })
      ).rejects.toThrow('Module DB Error');
    });
  });

  describe('Integration Tests', () => {
    let testModule;

    beforeAll(async () => {
      // Set up real module in database
      testModule = await Module.create({
        name: 'Integration Test Module',
        subject: 'maths',
        grades: [5]
      });
    });

    afterAll(async () => {
      // Clean up the created documents
      if (testModule) {
        await Module.deleteOne({ _id: testModule._id });
      }
      await Question.deleteMany({ tags: 'integration-test' });
    });

    it('should create a question in the real database and link it to the module', async () => {
      const input = {
        question: { slate: [{ type: 'paragraph', children: [{ text: 'What is 2+2?' }] }] },
        options: { type: 'MCQ', mcq: { A: { text: '4' }, B: { text: '5' }, C: { text: '6' }, D: { text: '7' } } },
        explanation: { slate: [{ type: 'paragraph', children: [{ text: '2+2 is 4' }] }] },
        modules: [testModule._id.toString()],
        optionIndex: 0,

        tags: ['addition', 'integration-test'],
        skills: ['math-basics']
      };

      const realWithTransaction = async (cb) => {
        const session = await mongoose.startSession();
        let res;
        await session.withTransaction(async () => {
          res = await cb({ session });
        });
        session.endSession();
        return res;
      };

      const result = await createQuestion(input, {
        questionRepo: Question,
        moduleRepo: Module,
        withTransaction: realWithTransaction
      });

      expect(result.success).toBe(true);

      // Verify question exists in DB
      const createdQuestion = await Question.findById(result.data._id);
      expect(createdQuestion).toBeDefined();
      expect(createdQuestion.answerType).toBe('MCQ');
      expect(createdQuestion.tags).toContain('integration-test');

      // Verify module was updated
      const updatedModule = await Module.findById(testModule._id);
      expect(updatedModule.questionIds).toContainEqual(createdQuestion._id);
    });

    it('should fail to create a question if Mongoose schema constraints are violated (missing answer type)', async () => {
      const input = {
        question: { slate: [{ type: 'paragraph', children: [{ text: 'Invalid question' }] }] },
        options: { type: 'INVALID_TYPE', mcq: { A: { text: '4' }, B: { text: '5' } } },
        explanation: { slate: [] },
        modules: [testModule._id.toString()],
        optionIndex: 0,
      };

      const realWithTransaction = async (cb) => {
        const session = await mongoose.startSession();
        let res;
        await session.withTransaction(async () => {
          res = await cb({ session });
        });
        session.endSession();
        return res;
      };

      await expect(
        createQuestion(input, {
          questionRepo: Question,
          moduleRepo: Module,
          withTransaction: realWithTransaction
        })
      ).rejects.toThrow(/Answer type is required|`answerType` is required|not a valid enum value/);
    });
  });
});
