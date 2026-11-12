/**
 * @file ReportErrorModal.jsx
 * @description Modal dialog allowing users to report question or content issues with automated screenshot capture.
 * @architecture Common feedback dialog feature integrating html2canvas and Google Cloud Storage image upload.
 * @agent_note Exclude dialog overlay from screenshot capture by ensuring ignore-on-screenshot class is applied.
 */

/**
 * FILE PURPOSE: A modal component that allows users to report errors or issues with specific questions.
 * It captures user feedback, question data, and system/environment metadata.
 *
 * DEPENDENCIES:
 * - CommonDialog: Base modal component.
 * - api.js: Centralized axios instance with baseURL and auto token injection.
 * - react-hot-toast: For user feedback during the submission process.
 * - SessionContext: To access the logged-in user's token and identity.
 *
 * EXPORTS:
 * - ReportErrorModal: Default export.
 *
 * INTERCONNECT:
 * - Consumed by QuizPanel.jsx and other question rendering components.
 * - Communicates with the `/api/errors/report` endpoint on the backend.
 */

import { useState, useContext, useEffect, useCallback } from "react";
import styled from "styled-components";
import CommonDialog from "./CommonDialog";
import apiClient from "../../services/api";
import toast from "react-hot-toast";
import { SessionContext } from "../../context/SessionProvider";
import { FiImage } from "react-icons/fi";
import html2canvas from "html2canvas";
import { API_ENDPOINTS } from "../../api/requestMap";
import { uploadFileToGCS } from "../../services/uploadService";

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #ff5722;
    box-shadow: 0 0 0 2px rgba(255, 87, 34, 0.1);
  }
`;

const AttachmentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  margin-top: 12px;
  background: #f5f5f5;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #eaeaea;

  svg {
    flex-shrink: 0;
    font-size: 16px;
    color: #888;
  }
`;

/**
 * ReportErrorModal component for submitting error reports and screenshots.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} props.open - Modal visibility state.
 * @param {Function} props.onOpenChange - Visibility change callback.
 * @param {Object} props.environment - Contextual system and question metadata.
 * @returns {JSX.Element} Error reporting dialog modal.
 */
export default function ReportErrorModal({ open, onOpenChange, environment }) {
  const { user } = useContext(SessionContext);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotError, setScreenshotError] = useState(null);

  /**
   * Captures a screenshot of the entire application body.
   */
  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    setScreenshotError(null);
    try {
      // Capture the document body but ignore the modal and its overlay
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: 1,
        ignoreElements: (element) => {
          // Ignore any element with the 'ignore-on-screenshot' class
          return element.classList.contains("ignore-on-screenshot");
        },
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setScreenshot(dataUrl);
    } catch (err) {
      console.error("Failed to capture screenshot:", err);
      setScreenshotError(
        "Failed to capture screen context. Please try again or describe the issue in detail.",
      );
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Automatically trigger screenshot capture when the modal opens.
   */
  useEffect(() => {
    if (open) {
      // Wait for modal animation to settle slightly
      const timer = setTimeout(() => {
        captureScreenshot();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setScreenshot(null);
      setScreenshotError(null);
    }
  }, [open, captureScreenshot]);

  /**
   * Handles the submission of the error report.
   * Validates session and description before sending.
   */
  const handleSubmit = async () => {
    // Validation Checks
    if (!user?.token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description of the error.");
      return;
    }

    // Block if screenshot is required but missing/failed
    if (!screenshot && !isCapturing) {
      toast.error("Context screenshot is required for error reports.");
      return;
    }

    if (screenshotError) {
      toast.error(
        "Screenshot capture failed. Cannot submit report without context.",
      );
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Submitting report...");

    try {
      let screenshotFilename = null;

      // 1. Upload screenshot if available
      if (screenshot) {
        try {
          // A. Get signed URL (auth injected by apiClient interceptor)
          const { data: urlData } = await apiClient.post(
            API_ENDPOINTS.getScreenshotUrl.url,
            {
              filename: `screenshot-${Date.now()}.jpg`,
              contentType: "image/jpeg",
            },
          );

          if (urlData.success) {
            // B. SECURITY: Upload to GCS using raw fetch with NO Authorization header.
            // The signed URL is self-authenticating — our app JWT must NOT be sent
            // to Google Cloud Storage to prevent token leakage to external services.
            const blob = await fetch(screenshot).then((res) => res.blob());
            await uploadFileToGCS(urlData.uploadUrl, blob, {
              contentType: "image/jpeg",
            });
            screenshotFilename = urlData.filename;
          } else {
            console.error(
              "Failed to get screenshot URL:",
              urlData.error || urlData,
            );
            throw new Error(
              "Failed to get screenshot upload URL. Please try again.",
            );
          }
        } catch (uploadErr) {
          console.error("Screenshot upload failed:", uploadErr.message);
          throw new Error(
            uploadErr.message ||
              "Failed to upload screenshot. Please try again.",
          );
        }
      }

      // Capture environment details to help debugging
      const systemMetadata = {
        userAgent: window.navigator.userAgent,
        language: window.navigator.language,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pixelRatio: window.devicePixelRatio || 1,
      };

      // Post request to backend (auth injected by apiClient interceptor)
      await apiClient.post(API_ENDPOINTS.submitErrorReport.url, {
        screenshotFilename: screenshotFilename,
        environment: environment,
        userDescription: description,
        systemMetadata: systemMetadata,
      });

      toast.success("Error reported successfully. Thank you!", { id: toastId });
      setDescription(""); // Reset field on success
      onOpenChange(false); // Close modal
    } catch (error) {
      console.error("Error reporting:", error.message);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit report. Please try again.",
        {
          id: toastId,
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Safely closes the modal, preventing closure during active submission.
   */
  const handleClose = () => {
    if (!submitting) {
      setDescription("");
      onOpenChange(false);
    }
  };

  const isSubmitDisabled =
    submitting || isCapturing || !!screenshotError || !screenshot;

  return (
    <CommonDialog
      open={open}
      onOpenChange={handleClose}
      title="Report an Error"
      maxWidth="500px"
      contentClassName="ignore-on-screenshot"
      overlayClassName="ignore-on-screenshot"
      confirmLabel={submitting ? "Submitting..." : "Submit Report"}
      cancelLabel="Cancel"
      onConfirm={handleSubmit}
      onCancel={handleClose}
      confirmDisabled={isSubmitDisabled}
      cancelDisabled={submitting}
    >
      <InputGroup>
        <Label>Describe the issue:</Label>
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. The correct answer was marked wrong, there is a typo in the question, the image is missing, etc."
          disabled={submitting}
        />
        <AttachmentInfo
          style={{
            marginTop: "10px",
            borderColor: screenshot
              ? "#4caf50"
              : screenshotError
                ? "#f44336"
                : "#eaeaea",
            background: screenshot
              ? "#e8f5e9"
              : screenshotError
                ? "#ffebee"
                : "#f5f5f5",
          }}
        >
          <FiImage
            style={{
              color: screenshot
                ? "#4caf50"
                : screenshotError
                  ? "#f44336"
                  : "#888",
            }}
          />
          <span style={{ color: screenshotError ? "#d32f2f" : "inherit" }}>
            {isCapturing
              ? "Capturing screenshot..."
              : screenshotError
                ? screenshotError
                : screenshot
                  ? "Context screenshot captured."
                  : "Capturing context screenshot..."}
          </span>
        </AttachmentInfo>
      </InputGroup>
    </CommonDialog>
  );
}
