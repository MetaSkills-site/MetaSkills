import arithmeticQuestions from '../../../services/math-questions/arithmetic.js';

describe('arithmetic questions', () => {
  it('should generate valid addition questions', () => {
    const additionQuestion = arithmeticQuestions.find(q => q.id === 'arithmetic-addition-easy');
    expect(additionQuestion).toBeDefined();

    // Test generator logic
    const { values, display } = additionQuestion.generator.question();
    expect(values.length).toBe(2);
    expect(display).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'math' })
      ])
    );

    // Test answer evaluation
    const [a, b] = values;
    const answer = additionQuestion.generator.answer(a, b);
    expect(answer).toBe(a + b);
  });
});
