/**
 * @file contextAttachments.controller.js
 * @description Handles CRUD operations for context attachments.
 * @architecture Serves as the API interface for managing passage and rich-text contexts linked to questions.
 */
import ContextAttachment from "../models/ContextAttachments.model.js";
import Question from "../models/Questions.model.js";
import expressAsyncHandler from "express-async-handler";

/**
 * @desc    Create a new context attachment
 * @route   POST /api/contexts
 * @access  Private (Admin)
 */
const createContext = expressAsyncHandler(async (req, res) => {
  const { title, text } = req.body;

  if (!title || !text || !text.slate) {
    res.status(400);
    throw new Error("Please provide title and content (slate)");
  }

  const context = await ContextAttachment.create({
    title,
    text,
  });

  res.status(201).json({
    success: true,
    data: context,
  });
});

/**
 * @desc    Retrieve all context attachments with pagination and search
 * @route   GET /api/contexts
 * @access  Public/Private
 */
const getAllContexts = expressAsyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const pipeline = [];

  // 1. Search Stage
  if (search) {
    pipeline.push({
      $search: {
        index: "default",
        text: {
          query: search,
          path: { wildcard: "*" },
        },
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  // 2. Pagination (count and data)
  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: Number(limit) }],
    },
  });

  const result = await ContextAttachment.aggregate(pipeline);
  const metadata = result[0].metadata[0] || { total: 0 };
  const contexts = result[0].data;

  const total = metadata.total;

  res.status(200).json({
    success: true,
    data: contexts,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Fetch a specific context attachment by ID
 * @route   GET /api/contexts/:id
 * @access  Public/Private
 */
const getContextById = expressAsyncHandler(async (req, res) => {
  const context = await ContextAttachment.findById(req.params.id);

  if (!context) {
    res.status(404);
    throw new Error("Context attachment not found");
  }

  res.status(200).json({
    success: true,
    data: context,
  });
});

/**
 * @desc    Update an existing context attachment
 * @route   PUT /api/contexts/:id
 * @access  Private (Admin)
 */
const updateContext = expressAsyncHandler(async (req, res) => {
  const context = await ContextAttachment.findById(req.params.id);

  if (!context) {
    res.status(404);
    throw new Error("Context attachment not found");
  }

  const updatedContext = await ContextAttachment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true },
  );

  res.status(200).json({
    success: true,
    data: updatedContext,
  });
});

/**
 * @desc    Delete a context attachment
 * @route   DELETE /api/contexts/:id
 * @access  Private (Admin)
 */
const deleteContext = expressAsyncHandler(async (req, res) => {
  const context = await ContextAttachment.findById(req.params.id);

  if (!context) {
    res.status(404);
    throw new Error("Context attachment not found");
  }

  await Question.updateMany(
    { contextAttachmentId: req.params.id },
    { $unset: { contextAttachmentId: 1 } },
  );
  await context.deleteOne();

  res.status(200).json({
    success: true,
    message: "Context attachment removed",
  });
});

export default {
  createContext,
  getAllContexts,
  getContextById,
  updateContext,
  deleteContext,
};
