/**
 * @file sequence.controller.js
 * @description Controller for managing grade and subject sequences.
 * @architecture Handles sequence retrieval and updates, falling back to default modules if no sequence is found.
 */
import expressAsyncHandler from "express-async-handler";
import Sequence from "../models/Sequence.model.js";
import Module from "../models/Module.model.js";

/**
 * @desc    Get sequence by grade and subject, or generate a default one
 * @route   GET /api/sequence/:grade/:subject
 * @access  Private
 */
const getSequenceByGradeAndSubject = expressAsyncHandler(async (req, res) => {
  const { grade, subject } = req.params;

  if (!grade || !subject) {
    res.status(400);
    throw new Error("Grade and subject are required");
  }

  try {
    let sequence = await Sequence.findOne({
      grade: Number(grade),
      subject,
    }).populate({
      path: "modules",
      select: "name subject grades isComplete", // Basic details for reordering
    });

    // If no sequence exists, return a default one with standard ordered modules, without creating it in the DB
    if (!sequence) {
      const defaultModules = await Module.find({
        grades: Number(grade),
        subject,
      }).sort({ createdAt: 1 });

      sequence = {
        grade: Number(grade),
        subject,
        modules: defaultModules.map((m) => ({
          _id: m._id,
          name: m.name,
          subject: m.subject,
          grades: m.grades,
          isComplete: m.isComplete,
        })),
      };
    }

    res.json({
      success: true,
      data: sequence,
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message, { cause: error });
  }
});

/**
 * @desc    Update a sequence's modules array
 * @route   PUT /api/sequence/:grade/:subject
 * @access  Private
 */
const updateSequence = expressAsyncHandler(async (req, res) => {
  const { grade, subject } = req.params;
  const { modules } = req.body; // Array of module IDs

  if (!grade || !subject) {
    res.status(400);
    throw new Error("Grade and subject are required");
  }

  if (!Array.isArray(modules)) {
    res.status(400);
    throw new Error("Modules must be an array of IDs");
  }

  try {
    const sequence = await Sequence.findOneAndUpdate(
      { grade: Number(grade), subject },
      { modules },
      { new: true, upsert: true },
    ).populate({
      path: "modules",
      select: "name subject grades isComplete",
    });

    res.json({
      success: true,
      message: "Sequence updated successfully",
      data: sequence,
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(error.message, { cause: error });
  }
});

export { getSequenceByGradeAndSubject, updateSequence };
