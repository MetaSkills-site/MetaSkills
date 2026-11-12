import {
  getQuestionById,
  getAllQuestions,
} from "../../../services/math-questions/registry.js";

describe("MathQuestionRegistry", () => {
  it("should return all registered questions", () => {
    const questions = getAllQuestions();
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it("should ensure all question IDs are unique", () => {
    const questions = getAllQuestions();
    const ids = questions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should be able to fetch a question by id", () => {
    const questions = getAllQuestions();
    const firstQuestionId = questions[0].id;

    const fetched = getQuestionById(firstQuestionId);
    expect(fetched).toBeDefined();
    expect(fetched.id).toBe(firstQuestionId);
  });

  it("should return undefined for non-existent id", () => {
    const fetched = getQuestionById("non-existent-1234");
    expect(fetched).toBeUndefined();
  });
});
