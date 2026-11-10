/**
 * @file Vocabulary.model.js
 * @description Mongoose schema for storing vocabulary words and their definitions.
 * @architecture Contains unique word and definition fields with an associated difficulty rating.
 */
import mongoose from "mongoose";

const vocabularySchema = mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    definition: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 1200,
    },
  },
  {
    timestamps: true,
  },
);

const Vocabulary = mongoose.model("Vocabulary", vocabularySchema);

/**
 * @module Vocabulary
 */
export default Vocabulary;
