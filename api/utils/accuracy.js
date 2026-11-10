/**
 * @file accuracy.js
 * @description Calculates accuracy of user responses for different question types.
 * @architecture Used across scoring services and controllers to determine response correctness.
 */

/**
 * @desc    Calculates the accuracy of a user's response against the question's correct options.
 * @param   {Object} question - The question object containing answerType and options.
 * @param   {any} userResponse - The user's response.
 * @returns {number} - The accuracy percentage (0-100).
 */
export const calculateAccuracy = (question, userResponse) => {
  if (!question || !question.options) return 0;

  let accuracy;

  if (question.answerType === "MCQ") {
    // Safety check for correctOption
    if (!question.correctOption) return 0;

    const correctIndex = question.options.mcq.findIndex(
      (opt) =>
        opt._id && opt._id.toString() === question.correctOption.toString(),
    );

    if (correctIndex === -1) return 0;

    const correctKey = ["A", "B", "C", "D", "E", "F"][correctIndex];
    // Compare safely - checking against the letter 'A', 'B' etc, OR against the string representation of the numeric index
    // e.g. "3" matches "3", "D" matches "D". This supports both legacy format (where index was sent) and current format.
    const isCorrect =
      String(userResponse) === correctKey ||
      String(userResponse) === String(correctIndex);
    accuracy = isCorrect ? 100 : 0;
  } else if (question.answerType === "fillInTheBlanks") {
    const correctAnswers = question.options.fillInTheBlanks;

    if (Array.isArray(userResponse) && Array.isArray(correctAnswers)) {
      let correctCount = 0;
      // Use the length of correct answers as the baseline
      correctAnswers.forEach((ans, index) => {
        const userAns = userResponse[index];
        if (
          userAns &&
          ans &&
          String(userAns).trim().toLowerCase() ===
            String(ans).trim().toLowerCase()
        ) {
          correctCount++;
        }
      });

      accuracy =
        correctAnswers.length > 0
          ? (correctCount / correctAnswers.length) * 100
          : 0;
    } else {
      accuracy = 0;
    }
  } else {
    // SA (Short Answer)
    if (!userResponse || !question.options.sa) return 0;

    const isCorrect =
      String(userResponse).trim().toLowerCase() ===
      String(question.options.sa).trim().toLowerCase();
    accuracy = isCorrect ? 100 : 0;
  }

  return accuracy;
};
