import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ObjectId from "bson-objectid";
import styled from "styled-components";
import { FaRegEye, FaExclamationCircle } from "react-icons/fa";

import {
  Wrapper,
  PageContainer,
  Button,
  QuestionListContainer,
  DialogButtonGroup,
  DialogButton,
} from "../../components/admin/AdminStyles";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminItemCard from "../../components/admin/AdminItemCard";
import CommonDialog from "../../components/common/CommonDialog";
import PdfUploader from "../../components/BulkImport/PdfUploader";
import QuestionDisplayTabs from "../../components/admin/QuestionDisplayTabs";
import QuestionWriter from "../../components/QuestionWriter";
import AnswerWriter from "../../components/AnswerWriter";
import ExplanationWriter from "../../components/ExplanationWriter";
import AdminTabs from "../../components/admin/AdminTabs";
import { EditorProvider } from "../../context/EditorContext";
import { ExpandableQuestion, QuestionNumber } from "../../utils/adminUtils";
import {
  markdownToSlate,
  markdownToSlateWithBlanks,
} from "../../utils/slateUtils";
import parsePdf from "../../utils/pdfParser";
import adminApiClient from "../../services/adminApi";
import {
  validateQuestionStep,
  validateAnswerStep,
  validateExplanationStep,
} from "../../utils/questionValidation";

import { Flex } from "../../styles/Flex.style";
import Badge from "../../components/common/Badge";
import SurfaceCard from "../../components/common/SurfaceCard";
import Tag from "../../components/common/Tag";
import { IconButton } from "../../components/admin/AdminStyles";
import EmptyState from "../../components/EmptyState";
import { LuFileQuestion, LuPencil, LuTrash2 } from "react-icons/lu";
import ModuleEditor from "../../components/ModuleEditor";

// Styled Components matched to AdminTheme
const StepCard = styled(SurfaceCard).attrs({
  padding: "24px",
  radius: "12px",
  shadow: "0 2px 8px rgba(0,0,0,0.05)",
})`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  border-bottom: 2px solid #eee;
  padding-bottom: 8px;
`;

const StatusMessage = styled.div`
  background: ${(props) => (props.$error ? "#ffebee" : "#e3f2fd")};
  color: ${(props) => (props.$error ? "#c62828" : "#1565c0")};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  border: 1px solid ${(props) => (props.$error ? "#ffcdd2" : "#bbdefb")};
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border-left-color: var(--color-primary, #ff5722);
  animation: spin 1s ease infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const CenterContainer = styled(SurfaceCard).attrs({
  padding: "60px 20px",
  radius: "12px",
  shadow: "0 2px 8px rgba(0,0,0,0.05)",
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const FooterActions = styled(SurfaceCard).attrs({
  padding: "20px",
  radius: "12px",
  shadow: "0 2px 8px rgba(0,0,0,0.05)",
})`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const ErrorContainer = styled.div`
  padding: 12px 16px;
  background: #fff;
  border-top: 1px dashed #eee;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PHASES = {
  UPLOAD: "UPLOAD",
  PARSING: "PARSING",
  PREVIEW: "PREVIEW",
  IMPORTING: "IMPORTING",
  SUCCESS: "SUCCESS",
};

export default function BulkImportPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(PHASES.UPLOAD);
  const [selectedFile, setSelectedFile] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState(null);
  const [parsingProgress, setParsingProgress] = useState({
    current: 0,
    total: 0,
    message: "",
  });

  const [importResult, setImportResult] = useState(null);
  // Ref to track whether parsing was cancelled by the user
  const parsingAbortedRef = useRef(false);

  // Dialog states for view/edit
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(null);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  // Session Storage Keys
  const STORAGE_KEY = "metaskills_bulk_import_drafts";

  // --- Initialization & Session Storage ---
  useEffect(() => {
    // Recover drafts from session storage
    const storedDrafts = sessionStorage.getItem(STORAGE_KEY);
    if (storedDrafts) {
      try {
        const parsedDrafts = JSON.parse(storedDrafts);
        if (parsedDrafts && parsedDrafts.length > 0) {
          setDrafts(parsedDrafts);
          setPhase(PHASES.PREVIEW);
          toast.success(`Recovered ${parsedDrafts.length} pending questions.`);
        }
      } catch (e) {
        console.error("Failed to parse stored drafts", e);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Update session storage whenever drafts change
  useEffect(() => {
    if (drafts.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } else if (phase !== PHASES.SUCCESS) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [drafts, phase]);

  // Prevent accidental tab closure if there are pending drafts
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (drafts.length > 0 && phase === PHASES.PREVIEW) {
        e.preventDefault();
        e.returnValue = ""; // Standard way to trigger the browser's unsaved changes warning
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [drafts, phase]);

  // --- Validation Logic ---
  // Run validation on a single draft
  const validateDraft = useCallback((draft) => {
    const errors = [];
    const answerType = draft.answerType || "MCQ";

    // Check question slate
    if (draft.questionSlate) {
      const qVal = validateQuestionStep(draft.questionSlate);
      if (!qVal.isValid) errors.push(qVal.error);
    } else {
      errors.push("Question text is missing.");
    }

    // Check answer based on type
    if (answerType === "MCQ") {
      if (draft.optionsSlate) {
        const dummyOptions = {
          type: "MCQ",
          mcq: draft.optionsSlate,
        };
        const aVal = validateAnswerStep(draft.questionSlate, dummyOptions);
        if (!aVal.isValid) errors.push(aVal.error);
      } else {
        errors.push("Answer options are missing.");
      }
    } else if (answerType === "SA") {
      if (!draft.optionsSlate?.sa || !draft.optionsSlate.sa.trim()) {
        errors.push("Short answer is missing.");
      }
    } else if (answerType === "fillInTheBlanks") {
      // Use standard validation: extractBlanks from the question slate
      const dummyOptions = {
        type: "fillInTheBlanks",
        fillInTheBlanks: draft.optionsSlate?.fillInTheBlanks || [],
      };
      const aVal = validateAnswerStep(draft.questionSlate, dummyOptions);
      if (!aVal.isValid) errors.push(aVal.error);
    }

    // Check explanation slate (required for all types)
    if (draft.explanationSlate) {
      const eVal = validateExplanationStep(draft.explanationSlate);
      if (!eVal.isValid) errors.push(eVal.error);
    } else {
      errors.push("Explanation is missing.");
    }

    return errors;
  }, []);

  // Compute validation status for all drafts
  const draftsValidation = useMemo(() => {
    let validCount = 0;
    const validatedDrafts = drafts.map((draft) => {
      const errors = validateDraft(draft);
      if (errors.length === 0) validCount++;
      return { ...draft, validationErrors: errors };
    });
    return { drafts: validatedDrafts, validCount, total: drafts.length };
  }, [drafts, validateDraft]);

  // --- Phase 1: Upload ---
  const handleFileSelected = useCallback((file) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  /**
   * Converts a single AI draft object into a Slate-based draft structure
   * with a unique client ID, ready for preview and editing.
   */
  const initializeDraft = useCallback((draft) => {
    const questionType = draft.questionType || "mcq";

    let optionsSlate;
    let answerType;
    let questionSlate;

    if (questionType === "mcq") {
      answerType = "MCQ";
      questionSlate = markdownToSlate(draft.questionText);
      optionsSlate = {
        A: { slate: markdownToSlate(draft.options[0] || "") },
        B: { slate: markdownToSlate(draft.options[1] || "") },
        C: { slate: markdownToSlate(draft.options[2] || "") },
        D: { slate: markdownToSlate(draft.options[3] || "") },
        correct: ["A", "B", "C", "D"][draft.correctOptionIndex] || null,
        correctAnswerInExtras: false,
        originalCorrectOptionId: null,
      };
    } else if (questionType === "short_answer") {
      answerType = "SA";
      questionSlate = markdownToSlate(draft.questionText);
      optionsSlate = {
        type: "SA",
        sa: draft.correctAnswer || "",
      };
    } else if (questionType === "fill_in_the_blank") {
      answerType = "fillInTheBlanks";
      // Parse pipe-delimited answers from AI
      const answers = draft.correctAnswer
        ? draft.correctAnswer.split("|").map((a) => a.trim())
        : [];
      // Convert _____ patterns to inline-blank Slate nodes
      questionSlate = markdownToSlateWithBlanks(draft.questionText, answers);
      optionsSlate = {
        type: "fillInTheBlanks",
        fillInTheBlanks: answers,
      };
    }

    return {
      _clientId: ObjectId().toHexString(),
      questionText: draft.questionText,
      questionType,
      answerType,
      options: draft.options,
      correctOptionIndex: draft.correctOptionIndex,
      correctAnswer: draft.correctAnswer || "",
      explanation: draft.explanation,
      questionSlate,
      optionsSlate,
      explanationSlate: markdownToSlate(
        draft.explanation || "No explanation provided.",
      ),
    };
  }, []);

  const handleStartParsing = async () => {
    if (!selectedFile) return;

    setPhase(PHASES.PARSING);
    setError(null);
    setDrafts([]);
    setParsingProgress({ current: 0, total: 0, message: "Preparing PDF..." });
    parsingAbortedRef.current = false;

    try {
      const generator = parsePdf(selectedFile);
      let totalPages = 0;
      let totalQuestionsFound = 0;
      let fullText = "";

      // Phase 1: Extract all text
      for await (const chunk of generator) {
        if (parsingAbortedRef.current) break;

        if (chunk.type === "info") {
          totalPages = chunk.pageCount;
          setParsingProgress({
            current: 0,
            total: chunk.pageCount,
            message: "Extracting text...",
          });
          continue;
        }

        // chunk.type === "page"
        setParsingProgress((prev) => ({
          ...prev,
          current: chunk.pageNumber,
          message: `Extracting text from page ${chunk.pageNumber} of ${totalPages}...`,
        }));

        if (chunk.text && chunk.text.trim().length >= 20) {
          fullText += chunk.text + "\n\n";
        }
      }

      if (parsingAbortedRef.current) {
        toast("Parsing cancelled.", { icon: "⚠️" });
        setPhase(PHASES.UPLOAD);
        return;
      }

      // Phase 2: Batch text by paragraphs (~4,000 characters per batch)
      const batches = [];
      const paragraphs = fullText.split(/\n\n+/);
      let currentBatch = "";

      for (const p of paragraphs) {
        if (p.trim().length === 0) continue;
        if (currentBatch.length + p.length > 4000) {
          if (currentBatch.trim()) {
            batches.push(currentBatch.trim());
          }
          currentBatch = p + "\n\n";
        } else {
          currentBatch += p + "\n\n";
        }
      }
      if (currentBatch.trim()) {
        batches.push(currentBatch.trim());
      }

      // Phase 3: Analyze batches sequentially
      let previousTail = "";
      for (let i = 0; i < batches.length; i++) {
        if (parsingAbortedRef.current) break;

        const batchText = batches[i];
        setParsingProgress((prev) => ({
          ...prev,
          current: i + 1,
          total: batches.length,
          message: `Analyzing Batch ${i + 1} of ${batches.length}...`,
        }));

        let retries = 0;
        const MAX_RETRIES = 3;
        let batchSuccess = false;

        while (retries <= MAX_RETRIES && !batchSuccess) {
          try {
            const { data } = await adminApiClient.post(
              "/api/genai/parse-questions",
              { rawText: batchText, previousTail },
              { timeout: 180000 }, // 3min timeout
            );

            previousTail = data.residualText || "";

            if (data.drafts && data.drafts.length > 0) {
              const newDrafts = data.drafts.map((d) => initializeDraft(d));
              totalQuestionsFound += newDrafts.length;
              setDrafts((prev) => [...prev, ...newDrafts]);
            }

            if (data.partial) {
              console.warn(
                `[BulkImport] Batch ${i + 1}: partial results returned.`,
              );
            }

            batchSuccess = true;
          } catch (batchErr) {
            const isRateLimit = batchErr.response?.status === 429;
            const errMsg = batchErr.response?.data?.message || batchErr.message;

            if (isRateLimit && retries < MAX_RETRIES) {
              retries++;
              const waitSeconds = 20 * retries; // 20s, 40s, 60s
              setParsingProgress((prev) => ({
                ...prev,
                message: `Rate limit hit. Retrying batch ${i + 1} in ${waitSeconds}s... (attempt ${retries + 1}/${MAX_RETRIES + 1})`,
              }));
              await new Promise((resolve) =>
                setTimeout(resolve, waitSeconds * 1000),
              );
            } else {
              console.error(`[BulkImport] Batch ${i + 1} failed:`, errMsg);
              toast.error(
                `Batch ${i + 1} failed: ${isRateLimit ? "Rate limit exceeded" : errMsg}`,
              );
              break; // Move to next batch
            }
          }
        }
      }

      // After loop completes
      if (parsingAbortedRef.current) {
        toast(
          "Parsing cancelled. Questions found so far are available for review.",
          { icon: "⚠️" },
        );
      } else if (totalQuestionsFound === 0) {
        throw new Error(
          "No valid questions found in the PDF. Please try a different document.",
        );
      } else {
        toast.success(
          `Successfully parsed ${totalQuestionsFound} questions from ${batches.length} batches.`,
        );
      }

      setPhase(PHASES.PREVIEW);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "AI parsing failed.";
      setError(message);
      setPhase(drafts.length > 0 ? PHASES.PREVIEW : PHASES.UPLOAD);
    }
  };

  // --- Phase 3: Preview Actions ---
  const handleRemoveDraft = (clientId) => {
    setDrafts((prev) => prev.filter((d) => d._clientId !== clientId));
    toast.success("Draft removed.");
  };

  const handleViewDraft = (draft) => {
    setActiveDraft(draft);
    setViewDialogOpen(true);
  };

  const handleEditDraft = (draft) => {
    setActiveDraft(draft);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (editorContextValues) => {
    if (!activeDraft) return;

    const { question, options, explanation } = editorContextValues;

    setDrafts((prev) =>
      prev.map((d) => {
        if (d._clientId === activeDraft._clientId) {
          // Determine the correct optionsSlate structure based on draft type
          let updatedOptionsSlate;
          if (d.answerType === "MCQ") {
            updatedOptionsSlate = options.mcq;
          } else if (d.answerType === "SA") {
            updatedOptionsSlate = { type: "SA", sa: options.sa || "" };
          } else {
            // fillInTheBlanks — re-extract from the edited question slate
            updatedOptionsSlate = {
              type: "fillInTheBlanks",
              fillInTheBlanks: options.fillInTheBlanks || [],
            };
          }

          return {
            ...d,
            questionSlate: question,
            optionsSlate: updatedOptionsSlate,
            explanationSlate: explanation,
          };
        }
        return d;
      }),
    );

    setEditDialogOpen(false);
    setActiveDraft(null);
    toast.success("Draft updated.");
  };

  // --- Submit Import ---
  const handleImport = async (
    selectedModules,
    { tags = [], skills = [] } = {},
  ) => {
    const targetModuleId = selectedModules[0];
    if (!targetModuleId) {
      toast.error("Please select a target module.");
      return;
    }

    const { validCount, total, drafts: validatedDrafts } = draftsValidation;
    if (validCount !== total) {
      toast.error(
        `Cannot import. ${total - validCount} questions have validation errors. Please edit or remove them.`,
      );
      return;
    }

    setPhase(PHASES.IMPORTING);
    setError(null);

    try {
      // Transform AI drafts into backend schema format
      const questions = validatedDrafts.map((draft) => {
        const questionId = ObjectId().toHexString();
        const answerType = draft.answerType || "MCQ";

        if (answerType === "MCQ") {
          // MCQ logic (existing)
          const optKeys = ["A", "B", "C", "D"];
          const optionObjects = optKeys.map((key) => ({
            _id: ObjectId().toHexString(),
            slate: draft.optionsSlate[key]?.slate ||
              draft.optionsSlate[key] || [
                { type: "paragraph", children: [{ text: "" }] },
              ],
            html: "",
            __key: key, // temp key for finding correct option
          }));

          const correctObj = optionObjects.find(
            (o) => o.__key === draft.optionsSlate.correct,
          );
          const correctOption = correctObj ? correctObj._id : null;
          const optionIndex = optKeys.indexOf(draft.optionsSlate.correct);

          // Clean up temp keys
          optionObjects.forEach((o) => delete o.__key);

          return {
            _id: questionId,
            question: { slate: draft.questionSlate },
            answerType: "MCQ",
            options: { type: "MCQ", mcq: optionObjects },
            correctOption,
            optionIndex: optionIndex !== -1 ? optionIndex : 0,
            explanation: { slate: draft.explanationSlate },
            tags,
            skills,
          };
        } else if (answerType === "SA") {
          return {
            _id: questionId,
            question: { slate: draft.questionSlate },
            answerType: "SA",
            options: { sa: draft.optionsSlate?.sa || "" },
            explanation: { slate: draft.explanationSlate },
            tags,
            skills,
          };
        } else {
          // fillInTheBlanks — answers come from inline-blank nodes in the question slate
          return {
            _id: questionId,
            question: { slate: draft.questionSlate },
            answerType: "fillInTheBlanks",
            options: {
              fillInTheBlanks: draft.optionsSlate?.fillInTheBlanks || [],
            },
            explanation: { slate: draft.explanationSlate },
            tags,
            skills,
          };
        }
      });

      const { data } = await adminApiClient.post("/api/quiz/bulk-import", {
        moduleId: targetModuleId,
        questions,
      });

      setImportResult(data);
      sessionStorage.removeItem(STORAGE_KEY);
      setDrafts([]);
      setPhase(PHASES.SUCCESS);
      toast.success(`${data.count} question(s) imported successfully!`);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Import failed.";
      setError(message);
      toast.error(message);
      setPhase(PHASES.PREVIEW);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setParsingProgress({ current: 0, total: 0, message: "" });
    setDrafts([]);
    setError(null);
    setImportResult(null);
    setPhase(PHASES.UPLOAD);
  };

  // --- Renders ---

  // Format a draft to look like a database question for QuestionDisplayTabs
  const buildMockQuestionForView = (draft) => {
    if (!draft) return null;
    const answerType = draft.answerType || "MCQ";

    if (answerType === "MCQ") {
      const optKeys = ["A", "B", "C", "D"];
      const formattedOptions = optKeys.map((key, index) => {
        const optionData = draft.optionsSlate?.[key];
        return {
          _id: String(index), // Fake ID
          slate: optionData?.slate ||
            optionData || [{ type: "paragraph", children: [{ text: "" }] }],
        };
      });
      const correctIdx = optKeys.indexOf(draft.optionsSlate?.correct);
      return {
        answerType: "MCQ",
        question: { slate: draft.questionSlate },
        options: { type: "MCQ", mcq: formattedOptions },
        correctOption: correctIdx !== -1 ? String(correctIdx) : null,
        explanation: { slate: draft.explanationSlate },
      };
    } else if (answerType === "SA") {
      return {
        answerType: "SA",
        question: { slate: draft.questionSlate },
        options: { sa: draft.optionsSlate?.sa || "" },
        explanation: { slate: draft.explanationSlate },
      };
    } else {
      return {
        answerType: "fillInTheBlanks",
        question: { slate: draft.questionSlate },
        options: { fillInTheBlanks: draft.optionsSlate?.fillInTheBlanks || [] },
        explanation: { slate: draft.explanationSlate },
      };
    }
  };

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader
          title="Bulk Import Questions"
          backPath="/admin"
          showActions={false}
        />

        {error && (
          <StatusMessage $error>
            <FaExclamationCircle size={20} />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </StatusMessage>
        )}

        {phase === PHASES.UPLOAD && (
          <StepCard>
            <SectionTitle>Step 1: Upload PDF Source</SectionTitle>
            <p
              style={{
                color: "#666",
                marginBottom: "20px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              Upload a PDF document containing questions. Our system will
              extract the text page-by-page and use AI to identify and format
              all question types — MCQ, Short Answer, and Fill-in-the-Blank.
            </p>

            <PdfUploader onFileSelected={handleFileSelected} />

            <Flex style={{ marginTop: "24px", justifyContent: "flex-end" }}>
              <Button
                $primary
                disabled={!selectedFile}
                onClick={handleStartParsing}
              >
                Parse with AI →
              </Button>
            </Flex>
          </StepCard>
        )}

        {phase === PHASES.PARSING && (
          <CenterContainer>
            <Spinner style={{ marginBottom: "24px" }} />
            <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>
              {parsingProgress.message || "Preparing..."}
            </h3>
            {parsingProgress.total > 0 && (
              <div
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  margin: "16px auto",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#e9ecef",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#df4523ff",
                      width: `${(parsingProgress.current / parsingProgress.total) * 100}%`,
                      transition: "width 0.3s ease",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  <span>
                    Page {parsingProgress.current} of {parsingProgress.total}
                  </span>
                  <span>
                    {Math.round(
                      (parsingProgress.current / parsingProgress.total) * 100,
                    )}
                    %
                  </span>
                </div>
              </div>
            )}
            {drafts.length > 0 && (
              <p
                style={{ color: "#4caf50", marginTop: "12px", fontWeight: 500 }}
              >
                {drafts.length} question(s) found so far...
              </p>
            )}
            <p
              style={{
                color: "#999",
                marginTop: "16px",
                fontSize: "12px",
                maxWidth: "400px",
                lineHeight: "1.4",
              }}
            >
              Each page is analyzed individually by AI. Questions split across
              pages are automatically merged.
            </p>
          </CenterContainer>
        )}

        {phase === PHASES.PREVIEW && (
          <>
            <SectionTitle style={{ marginTop: "10px" }}>
              Step 2: Review and Edit ({draftsValidation.validCount}/
              {draftsValidation.total} Valid)
            </SectionTitle>
            <p
              style={{
                color: "#666",
                marginBottom: "20px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              Please review the extracted questions. You can edit them to fix
              any formatting issues or add missing information. All questions
              must be valid before importing.
            </p>

            {drafts.length === 0 ? (
              <CenterContainer>
                <EmptyState
                  message="No questions found. Try uploading a different document."
                  icon={<LuFileQuestion />}
                />
                <Button onClick={resetImport} style={{ marginTop: "16px" }}>
                  Start Over
                </Button>
              </CenterContainer>
            ) : (
              <QuestionListContainer>
                {draftsValidation.drafts.map((draft, index) => {
                  const hasErrors =
                    draft.validationErrors && draft.validationErrors.length > 0;

                  return (
                    <div
                      key={draft._clientId}
                      style={{
                        border: hasErrors
                          ? "2px solid #ffcdd2"
                          : "1px solid #eaeaea",
                        borderRadius: "12px",
                        overflow: "hidden",
                        marginBottom: "16px",
                        background: "#fff",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      }}
                    >
                      <AdminItemCard
                        icon={
                          <QuestionNumber
                            $weight={700}
                            $gradient={
                              hasErrors
                                ? "linear-gradient(90deg, #d32f2f, #f44336)"
                                : "linear-gradient(90deg, #E91E63, #ff4800)"
                            }
                          >
                            {index + 1}
                          </QuestionNumber>
                        }
                        title={
                          <div style={{ width: "100%" }}>
                            <ExpandableQuestion
                              html={draft.questionSlate || draft.questionText}
                            />
                          </div>
                        }
                        subtitle={
                          <Flex
                            style={{
                              gap: "8px",
                              marginTop: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <Tag
                              label={
                                draft.answerType === "MCQ"
                                  ? "MCQ"
                                  : draft.answerType === "SA"
                                    ? "Short Answer"
                                    : "Fill in the Blank"
                              }
                              active
                              style={{
                                background:
                                  draft.answerType === "MCQ"
                                    ? "#f5f5f5"
                                    : draft.answerType === "SA"
                                      ? "#e8f5e9"
                                      : "#fff3e0",
                                color:
                                  draft.answerType === "MCQ"
                                    ? "#666"
                                    : draft.answerType === "SA"
                                      ? "#2e7d32"
                                      : "#e65100",
                                borderColor:
                                  draft.answerType === "MCQ"
                                    ? "#e0e0e0"
                                    : draft.answerType === "SA"
                                      ? "#c8e6c9"
                                      : "#ffe0b2",
                              }}
                            />
                          </Flex>
                        }
                        actions={
                          <Flex style={{ gap: "10px" }}>
                            <IconButton
                              onClick={() => handleViewDraft(draft)}
                              title="Preview"
                            >
                              <FaRegEye />
                            </IconButton>
                            <IconButton
                              onClick={() => handleEditDraft(draft)}
                              title="Edit"
                            >
                              <LuPencil />
                            </IconButton>
                            <IconButton
                              onClick={() => handleRemoveDraft(draft._clientId)}
                              $danger
                              title="Remove"
                            >
                              <LuTrash2 />
                            </IconButton>
                          </Flex>
                        }
                      />
                      {hasErrors && (
                        <ErrorContainer>
                          {draft.validationErrors.map((err, i) => (
                            <Badge
                              key={i}
                              bg="#ffebee"
                              color="#c62828"
                              padding="6px 12px"
                              radius="6px"
                              fontSize="13px"
                              fontWeight="600"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <FaExclamationCircle /> {err}
                            </Badge>
                          ))}
                        </ErrorContainer>
                      )}
                    </div>
                  );
                })}
              </QuestionListContainer>
            )}

            {drafts.length > 0 && (
              <FooterActions>
                <EditorProvider>
                  <ModuleEditor
                    onSave={handleImport}
                    saveButtonText={`Import ${draftsValidation.validCount} Valid Question(s)`}
                    disabled={
                      draftsValidation.validCount !== draftsValidation.total ||
                      drafts.length === 0
                    }
                    multiSelect={false}
                  />
                  <Flex style={{ justifyContent: "center", marginTop: "16px" }}>
                    <Button onClick={() => setDiscardModalOpen(true)}>
                      Discard All Drafts
                    </Button>
                  </Flex>
                </EditorProvider>
              </FooterActions>
            )}
          </>
        )}

        {phase === PHASES.IMPORTING && (
          <CenterContainer>
            <Spinner style={{ marginBottom: "24px" }} />
            <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>
              Importing Questions...
            </h3>
            <p style={{ color: "#666" }}>
              Saving valid questions to the database.
            </p>
          </CenterContainer>
        )}

        {phase === PHASES.SUCCESS && importResult && (
          <CenterContainer>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ margin: "0 0 16px 0", color: "#2e7d32" }}>
              Import Complete!
            </h2>
            <p
              style={{ fontSize: "16px", color: "#555", marginBottom: "32px" }}
            >
              Successfully imported <strong>{importResult.count}</strong>{" "}
              questions into the module.
            </p>
            <Flex style={{ gap: "16px" }}>
              <Button onClick={() => navigate("/admin")}>
                Return to Dashboard
              </Button>
              <Button $primary onClick={resetImport}>
                Import More Questions
              </Button>
            </Flex>
          </CenterContainer>
        )}
      </PageContainer>

      {/* View Dialog */}
      <CommonDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        title="Preview Question"
        maxWidth="800px"
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setViewDialogOpen(false)}>
              Close
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        {activeDraft && (
          <div style={{ padding: "16px 0" }}>
            <QuestionDisplayTabs
              question={buildMockQuestionForView(activeDraft)}
              showContext={false}
            />
          </div>
        )}
      </CommonDialog>

      {/* Edit Dialog - Wraps QuestionEditor in an EditorProvider initialized with draft data */}
      {editDialogOpen && activeDraft && (
        <EditorDialogWrapper
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          draft={activeDraft}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal: Discard All Drafts Confirmation */}
      <CommonDialog
        open={discardModalOpen}
        onOpenChange={setDiscardModalOpen}
        title="Discard All Drafts"
        description="Are you sure you want to discard these drafts and start over? This action cannot be undone."
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setDiscardModalOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton
              $danger
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY);
                resetImport();
                setDiscardModalOpen(false);
              }}
            >
              Discard Drafts
            </DialogButton>
          </DialogButtonGroup>
        }
      />
    </Wrapper>
  );
}

// A helper component to wrap the QuestionEditor in its own context provider
function EditorDialogWrapper({ open, onOpenChange, draft, onSave }) {
  const answerType = draft.answerType || "MCQ";

  // Build initial values for the EditorContext based on question type
  let initialOptions;
  if (answerType === "MCQ") {
    initialOptions = {
      type: "MCQ",
      mcq: draft.optionsSlate,
      sa: "",
      optionIndex: null,
    };
  } else if (answerType === "SA") {
    initialOptions = {
      type: "SA",
      sa: draft.optionsSlate?.sa || "",
      mcq: null,
      optionIndex: null,
    };
  } else {
    initialOptions = {
      type: "fillInTheBlanks",
      fillInTheBlanks: draft.optionsSlate?.fillInTheBlanks || [],
      mcq: null,
      sa: "",
      optionIndex: null,
    };
  }

  const initialValues = {
    question: draft.questionSlate,
    options: initialOptions,
    explanation: draft.explanationSlate,
  };

  return (
    <CommonDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Question"
      maxWidth="900px"
      disableBackdropClick={true} // prevent accidental clicks outside causing data loss
    >
      <EditorProvider initialValues={initialValues}>
        <EditorDialogInner
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
        />
      </EditorProvider>
    </CommonDialog>
  );
}

// The inner component needs access to the EditorContext to save
import { useContext } from "react";
import EditorContext from "../../context/EditorContext";

function EditorDialogInner({ onCancel, onSave }) {
  const editorContextValues = useContext(EditorContext);
  const [activeTab, setActiveTab] = useState("question");

  const handleSave = () => {
    // Validate current editor state
    const qVal = validateQuestionStep(editorContextValues.question);
    const aVal = validateAnswerStep(
      editorContextValues.question,
      editorContextValues.options,
    );
    const eVal = validateExplanationStep(editorContextValues.explanation);

    if (!qVal.isValid || !aVal.isValid || !eVal.isValid) {
      toast.error("Please fix validation errors before saving.");
      // The Editor UI will highlight empty fields as well
      return;
    }

    onSave(editorContextValues);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "70vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{ flex: 1, overflowY: "auto", padding: "10px", width: "100%" }}
      >
        <AdminTabs
          tabs={[
            { id: "question", label: "Question" },
            { id: "answer", label: "Answer" },
            { id: "explanation", label: "Explanation" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          layoutId="draftEditorTabIndicator"
          containerStyle={{
            margin: "0 0 20px 0",
            width: "100%",
            justifyContent: "flex-start",
          }}
        />
        <div style={{ width: "100%", marginTop: "16px" }}>
          {activeTab === "question" && <QuestionWriter compact={true} />}
          {activeTab === "answer" && <AnswerWriter compact={true} />}
          {activeTab === "explanation" && <ExplanationWriter compact={true} />}
        </div>
      </div>
      <DialogButtonGroup
        style={{
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid #eee",
        }}
      >
        <DialogButton onClick={onCancel}>Cancel</DialogButton>
        <DialogButton $primary onClick={handleSave}>
          Save Changes
        </DialogButton>
      </DialogButtonGroup>
    </div>
  );
}
