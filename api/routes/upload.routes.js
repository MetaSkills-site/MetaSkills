/**
 * @file upload.routes.js
 * @description Contains the route for generating signed URLs for secure direct-to-cloud file uploads.
 * @architecture Provides an isolated upload route to securely offload file storage handling to a cloud provider via signed URLs.
 */
import express from "express";
import { generateV4UploadSignedUrl } from "../utils/storage.js";
import { protectUserOrAdmin } from "../middlewares/authMiddleware.js";
import { rateLimiter } from "../middlewares/rateLimit.js";
import expressAsyncHandler from "express-async-handler";

const router = express.Router();

// POST /api/upload/signed-url
router.post(
  "/signed-url",
  protectUserOrAdmin,
  rateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes
  expressAsyncHandler(async (req, res) => {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      res.status(400);
      throw new Error("Filename and contentType are required");
    }

    try {
      const { uploadUrl, filename: uniqueFilename } =
        await generateV4UploadSignedUrl(filename, contentType);

      const bucketName = process.env.GCS_BUCKET_NAME || "metaskills";
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;

      const response = {
        success: true,
        signedUrl: uploadUrl,
        publicUrl,
        filename: uniqueFilename,
      };
      res.status(200).json(response);
    } catch (error) {
      console.error("Error generating signed URL:", error);
      res.status(500);
      throw new Error("Failed to generate signed URL", { cause: error });
    }
  }),
);

/**
 * @module uploadRoutes
 * @description Express router serving signed URLs for file uploads.
 */
export default router;
