import { useState, useRef } from "react";
import styled from "styled-components";
import { FaUpload, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

/**
 * @file PdfUploader.jsx
 * @description File picker component for PDF bulk import.
 * Validates file type and size, then passes the File object
 * up to the parent via onFileSelected(file).
 *
 * NOTE: PDF text extraction is handled externally by BulkImportPage
 * using the async generator parsePdf(). This component does NOT
 * perform extraction — it is strictly a validated file selector.
 *
 * @props
 * - onFileSelected(file: File): Called when a valid PDF is selected.
 */

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const UploaderContainer = styled.div`
  border: 2px dashed
    ${(props) => (props.$isDragActive ? "#df4523ff" : "transparent")};
  background-color: ${(props) =>
    props.$isDragActive ? "#e4704d10" : "transparent"};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadText = styled.h3`
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
`;

const UploadSubtext = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
`;

const Upload = styled.div`
  box-sizing: content-box;
  padding: 20px;
  background: #e4704d28;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  margin: 20px auto;
  cursor: pointer;
  transition: 500ms;
  &:hover {
    background: #e4704d50;
  }
  > * {
    fill: #df4523ff;
    width: 100%;
    height: 100%;
  }
  ${(props) =>
    props.$isDragActive &&
    `
    background: #e4704d50;
    transform: scale(1.1);
  `}
`;

const IconWrapper = styled.div`
  font-size: 48px;
  color: ${(props) =>
    props.$error ? "#dc3545" : props.$success ? "#4caf50" : "#df4523ff"};
  margin-bottom: 16px;
  margin-top: 20px;
`;

const SummaryBox = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  text-align: left;
`;

export default function PdfUploader({ onFileSelected }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, selected, error
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateAndSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setStatus("error");
      setErrorMsg("Please upload a valid PDF file.");
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setStatus("error");
      setErrorMsg(
        `File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please use a smaller PDF.`,
      );
      return;
    }

    setFile(selectedFile);
    setStatus("selected");
    setErrorMsg("");

    if (onFileSelected) {
      onFileSelected(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div>
      <UploaderContainer
        $isDragActive={isDragActive}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <HiddenInput
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
        />

        {status === "idle" && (
          <>
            <UploadText>Upload PDF Document</UploadText>
            <UploadSubtext>
              Please upload the PDF you want to import
            </UploadSubtext>
            <Upload onClick={handleClick} $isDragActive={isDragActive}>
              <FaUpload />
            </Upload>
            <UploadSubtext style={{ fontSize: "12px", marginTop: "10px" }}>
              Drag & Drop or click to browse (Max {MAX_FILE_SIZE_MB}MB, 30
              pages)
            </UploadSubtext>
          </>
        )}

        {status === "error" && (
          <>
            <IconWrapper $error>
              <FaExclamationCircle />
            </IconWrapper>
            <UploadText>Upload Failed</UploadText>
            <UploadSubtext style={{ color: "#dc3545" }}>
              {errorMsg}
            </UploadSubtext>
            <UploadSubtext
              style={{
                marginTop: "12px",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={handleClick}
            >
              Click to try again
            </UploadSubtext>
          </>
        )}

        {status === "selected" && (
          <>
            <IconWrapper $success>
              <FaCheckCircle />
            </IconWrapper>
            <UploadText>Selected: {file?.name}</UploadText>
            <UploadSubtext>
              Ready for AI analysis. Click &quot;Parse with AI&quot; to begin.
            </UploadSubtext>
            <UploadSubtext
              style={{
                marginTop: "12px",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={handleClick}
            >
              Choose a different file
            </UploadSubtext>
          </>
        )}
      </UploaderContainer>

      {status === "selected" && file && (
        <SummaryBox>
          <h4 style={{ margin: "0 0 12px 0", color: "#333" }}>File Details</h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "#555",
              fontSize: "14px",
            }}
          >
            <li>
              <strong>Name:</strong> {file.name}
            </li>
            <li>
              <strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB
            </li>
          </ul>
        </SummaryBox>
      )}
    </div>
  );
}
