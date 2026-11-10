/**
 * @file Questions.model.js
 * @description Mongoose schema for educational questions.
 * @architecture Stores questions, answer types (SA, MCQ, fillInTheBlanks), options, and correctness, with a pre-validate hook for constraints and deduplication. Relates to Module and ContextAttachment models.
 */
import mongoose from "mongoose";

const QuestionsSchema = mongoose.Schema(
  {
    // Question content - stored as rich text (Slate.js format) and HTML
    question: {
      slate: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, "Question slate content is required"],
      },
    },
    // Answer type: "SA" (Short Answer) or "MCQ" (Multiple Choice Question)
    answerType: {
      type: String,
      enum: ["SA", "MCQ", "fillInTheBlanks"],
      required: [true, "Answer type is required"],
    },
    // Answer options - structure depends on answerType
    options: {
      // For SA (Short Answer): stores the correct answer as a string (latex/math expression)
      sa: {
        type: String,
        default: "",
      },
      // For Fill in the Blanks: stores the correct answers as an array of strings
      fillInTheBlanks: {
        type: [String],
        default: [],
      },
      // For MCQ: stores 4 options (A, B, C, D) as rich text
      mcq: {
        type: [
          {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            slate: {
              type: mongoose.Schema.Types.Mixed,
              default: null,
            },
          },
        ],
        required: function () {
          return this.answerType === "MCQ";
        },
        default: undefined,
      },
    },
    correctOption: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.answerType === "MCQ";
      },
      default: null,
    },
    // Explanation - stored as rich text (Slate.js format) and HTML
    explanation: {
      slate: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
    contextAttachmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContextAttachment",
      default: null,
    },

    rating: {
      type: Number, // Mongoose `Number` natively supports floats/doubles in JavaScript
      default: 1200,
    },
    version: {
      type: Number,
      default: 1,
    },
    active: {
      type: Boolean,
      default: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

QuestionsSchema.pre("validate", function (next) {
  try {
    // Deduplicate modules array
    if (this.modules && this.modules.length > 0) {
      this.modules = [...new Set(this.modules.map((id) => id.toString()))];
    }

    if (this.answerType === "MCQ") {
      // ensure mcq exists and has >= 2 options (or exactly 4 if you want)
      if (!Array.isArray(this.options?.mcq) || this.options.mcq.length < 2) {
        throw new Error(
          "MCQ questions require at least 2 options in options.mcq.",
        );
      }

      // ensure correctOption is provided
      if (!this.correctOption) {
        throw new Error(
          "MCQ questions require correctOption (ObjectId of the correct subdoc).",
        );
      }

      // ensure correctOption references one of the subdocs
      const match = this.options.mcq.id
        ? this.options.mcq.id(this.correctOption)
        : null;
      if (!match) {
        throw new Error(
          "correctOption must reference one of options.mcq subdocuments.",
        );
      }
    } else if (this.answerType === "SA") {
      // ensure short-answer canonical exists
      if (!this.options?.sa || !String(this.options.sa).trim()) {
        throw new Error(
          "SA questions require options.sa to contain the canonical answer.",
        );
      }

      // for cleanliness, clear MCQ fields (optional)
      this.options.mcq = undefined;
      this.correctOption = null;
    } else if (this.answerType === "fillInTheBlanks") {
      if (
        !this.options?.fillInTheBlanks ||
        !Array.isArray(this.options.fillInTheBlanks) ||
        this.options.fillInTheBlanks.length === 0
      ) {
        throw new Error(
          "Fill in the blanks questions require options.fillInTheBlanks to be a non-empty array.",
        );
      }
      this.options.mcq = undefined;
      this.correctOption = null;
      this.options.sa = undefined;
    }
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * @module Question
 */
export default mongoose.model("Question", QuestionsSchema);
