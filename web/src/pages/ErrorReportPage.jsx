/**
 * @file ErrorReportPage.jsx
 * @description User-facing page for reporting platform issues (bugs, content errors, etc.).
 * Includes screenshot upload functionality via direct-to-cloud signed URLs and automated
 * system metadata gathering.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Nav from "../components/Nav/Nav";
import toast from "react-hot-toast";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import { Font } from "../styles/Font.style";
import {
  Wrapper,
  PageContainer,
  FormField,
  FormLabel,
  ActionButton,
} from "../components/admin/AdminStyles";
import SelectInput from "../components/common/SelectInput";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";
const FormCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  border-left: 5px solid #ff5722;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px solid rgba(255, 87, 34, 0.2);
  background: #fff;
  font-family: inherit;
  font-size: 14px;
  color: #222;
  outline: none;
  min-height: 150px;
  resize: vertical;
  transition: border-color 200ms;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:focus {
    border-color: #ff5722;
    box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
  }
`;

const UploadZone = styled.div`
  border: 2px dashed
    ${(props) =>
      props.$isDragging
        ? "#e91e63"
        : props.$hasFile
          ? "#4caf50"
          : "rgba(255, 87, 34, 0.3)"};
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) =>
    props.$isDragging
      ? "rgba(233, 30, 99, 0.05)"
      : props.$hasFile
        ? "#e8f5e9"
        : "#fff"};

  &:hover {
    border-color: #ff5722;
    background: rgba(255, 87, 34, 0.05);
  }

  svg {
    font-size: 2.5rem;
    color: ${(props) =>
      props.$isDragging ? "#e91e63" : props.$hasFile ? "#4caf50" : "#ff5722"};
    margin-bottom: 10px;
  }

  p {
    margin: 0;
    color: #444;
    font-size: 0.9rem;
  }
`;

const PreviewContainer = styled.div`
  position: relative;
  margin-top: 15px;
  width: 100%;
  max-height: 300px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #eee;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .remove-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: white;
    color: #d32f2f;
    border: 1px solid #ffcdd2;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    padding: 0;
    margin: 0;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 10;
    line-height: normal;

    &:hover {
      background: #ffebee;
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(211, 47, 47, 0.2);
    }

    svg {
      display: block;
      width: 14px;
      height: 14px;
    }
  }
`;

const SubmitButton = styled(ActionButton)`
  justify-self: center;
  margin-top: 20px;

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// --- Logic Helpers ---

const gatherSystemMetadata = () => {
  return {
    source: "web_client",
    version: import.meta.env.VITE_APP_VERSION || "1.0",
    userAgent: navigator.userAgent.substring(0, 500),
    language: navigator.language.substring(0, 50),
    windowSize: `${window.innerWidth}x${window.innerHeight}`.substring(0, 50),
    screenSize: `${window.screen.width}x${window.screen.height}`.substring(
      0,
      50,
    ),
    timeZone: Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone.substring(0, 100),
    pixelRatio: window.devicePixelRatio || 1,
  };
};

export default function ErrorReportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const categoryOptions = [
    { value: "ui_bug", label: "UI Bug (Layout, visual issues)" },
    { value: "content_error", label: "Content Error (Typo, wrong info)" },
    {
      value: "technical_issue",
      label: "Technical Issue (Error messages, slow load)",
    },
    { value: "feature_request", label: "Feature Request" },
    { value: "other", label: "Other" },
  ];

  const [category, setCategory] = useState("ui_bug");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Cleanup object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const processFile = (file) => {
    if (!file) return;

    // Validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please use PNG, JPG, or WebP.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeScreenshot = (e) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setScreenshot(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Description Validation
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      toast.error("Please provide a description of the issue.");
      return;
    }
    if (trimmedDesc.length < 10) {
      toast.error(
        "Description is too short. Please provide at least 10 characters.",
      );
      return;
    }

    // 2. Final Screenshot Validation (if present)
    if (screenshot) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(screenshot.type)) {
        toast.error("Invalid file format. Please use PNG, JPG, or WebP.");
        return;
      }
      if (screenshot.size > 5 * 1024 * 1024) {
        toast.error("Screenshot exceeds 5MB limit.");
        return;
      }
    }

    setIsSubmitting(true);
    let uniqueFilename = null;

    try {
      // Step 1: Handle Screenshot Upload if applicable
      if (screenshot) {
        toast.loading("Getting secure upload tunnel...", { id: "report" });

        // Backend call: get signed upload URL (auth injected by apiClient interceptor)
        const { data: urlData } = await apiClient.post(
          API_ENDPOINTS.getScreenshotUrl.url,
          {
            filename: screenshot.name,
            contentType: screenshot.type,
          },
        );

        if (!urlData.uploadUrl || !urlData.filename) {
          throw new Error(
            urlData.message || "Failed to get upload URL or filename",
          );
        }

        uniqueFilename = urlData.filename;

        // SECURITY: GCS upload uses raw fetch with NO Authorization header.
        // The signed URL is self-authenticating — our app JWT must NOT be sent
        // to Google Cloud Storage to prevent token leakage to external services.
        toast.loading("Uploading screenshot...", { id: "report" });
        const uploadRes = await fetch(urlData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": screenshot.type },
          body: screenshot,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload image to storage");
      }

      // Step 2: Save the record to backend (auth injected by apiClient interceptor)
      toast.loading("Finalizing report...", { id: "report" });
      await apiClient.post(API_ENDPOINTS.submitErrorReport.url, {
        environment: import.meta.env.MODE || "production",
        userDescription: trimmedDesc,
        category,
        reportType: "manual",
        systemMetadata: gatherSystemMetadata(),
        screenshotFilename: uniqueFilename,
      });

      toast.success("Issue reported! Our developers will look into it.", {
        id: "report",
      });

      // Reset form or navigate back
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error("Report Error:", error.message);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong. Please try again.",
        {
          id: "report",
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Nav />
      <Wrapper>
        <PageContainer style={{ width: "60%", marginTop: "40px" }}>
          <div style={{ marginBottom: "30px" }}>
            <Font
              $name="Made, segoe ui, sans serif"
              $size="2rem"
              $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
              style={{ margin: "0 0 5px 0" }}
            >
              Report an Issue
            </Font>
            <p style={{ color: "#666", margin: 0 }}>
              Help us improve by sharing what went wrong.
            </p>
          </div>

          <FormCard>
            <form onSubmit={handleSubmit}>
              <FormField>
                <FormLabel>What category best describes the issue?</FormLabel>
                <SelectInput
                  value={category}
                  onValueChange={setCategory}
                  options={categoryOptions}
                />
              </FormField>

              <FormField>
                <FormLabel>Detailed Description</FormLabel>
                <TextArea
                  placeholder="Please describe exactly what happened. What were you doing? What did you expect vs what actually happened?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormField>

              <FormField>
                <FormLabel>Screenshot (Optional)</FormLabel>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
                <UploadZone
                  role="button"
                  tabIndex={0}
                  aria-label="Click or drag to upload a screenshot"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  $hasFile={!!screenshot}
                  $isDragging={isDragging}
                >
                  {!previewUrl ? (
                    <>
                      <FaCloudUploadAlt />
                      <p>Click to upload a screenshot</p>
                      <p style={{ fontSize: "0.8rem", marginTop: "5px" }}>
                        Max size 5MB (PNG, JPG, WebP)
                      </p>
                    </>
                  ) : (
                    <PreviewContainer>
                      <img src={previewUrl} alt="Preview" />
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={removeScreenshot}
                      >
                        <FaTimes />
                      </button>
                    </PreviewContainer>
                  )}
                </UploadZone>
              </FormField>

              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "5px",
                  textAlign: "center",
                  opacity: 0.6,
                  fontSize: "12px",
                }}
              >
                <p style={{ margin: 0 }}>
                  System metadata (browser, version, screen size) is
                  automatically <br />
                  attached to help us debug faster.
                </p>
              </div>

              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="spinner" /> Sending...
                  </>
                ) : (
                  <>Submit Report</>
                )}
              </SubmitButton>
            </form>
          </FormCard>
        </PageContainer>
      </Wrapper>
    </>
  );
}
