/**
 * @file contextAttachments.routes.js
 * @description Defines routes for creating, retrieving, updating, and deleting context attachments.
 * @architecture Routes context attachment requests to the appropriate controller methods with role-based access control middleware.
 */
import express from "express";
import protect, { protectAdmin } from "../middlewares/authMiddleware.js";
import contextAttachmentsController from "../controllers/contextAttachments.controller.js";

const router = express.Router();

router
  .route("/")
  .post(protectAdmin, contextAttachmentsController.createContext)
  .get(protectAdmin, contextAttachmentsController.getAllContexts);

router
  .route("/:id")
  .get(protect, contextAttachmentsController.getContextById)
  .put(protectAdmin, contextAttachmentsController.updateContext)
  .delete(protectAdmin, contextAttachmentsController.deleteContext);

/**
 * @module contextAttachmentsRouter
 * @description Serves endpoints for managing context attachments, with read access for users and write access for admins.
 */
export default router;
