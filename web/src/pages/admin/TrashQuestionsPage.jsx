/**
 * TrashQuestions.jsx
 *
 * PURPOSE:
 * Admin component for managing soft-deleted questions. Allows administrators to view
 * questions currently in the 'trash', with the ability to either restore them back to
 * the active question pool or delete them permanently.
 *
 * DEPENDENCIES:
 * - react, styled-components: Standard React libraries for UI and styling.
 * - @tanstack/react-query: For data fetching, mutations, and cache management.
 * - react-icons: For UI visual cues (eye, trash, rotate, etc.).
 * - react-hot-toast: For user feedback via toast notifications.
 * - mathlive: For rendering mathematical content in preview.
 * - Various local styles, components, and quizService methods for API interaction.
 *
 * EXPORTS:
 * - TrashQuestions (default): The main functional component for the trash management page.
 *
 * INTERCONNECTIONS:
 * - Accessed from the main Admin dashboard.
 * - Interacts with quizService for backend data manipulation.
 * - Utilizes CommonDialog for confirmation workflows.
 */

import { IconButton } from "../../components/admin/AdminStyles";
import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Flex } from "../../styles/Flex.style";
import { Font } from "../../styles/Font.style";
import { FaRegEye } from "react-icons/fa6";
import { LuTrash2, LuRotateCcw, LuBan } from "react-icons/lu";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonRect } from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import CommonDialog from "../../components/common/CommonDialog";
import {
  Wrapper,
  PageContainer,
  Button,
  DialogButtonGroup,
  DialogButton,
  QuestionListContainer,
} from "../../components/admin/AdminStyles";
import AdminHeader from "../../components/admin/AdminHeader";
import { ExpandableQuestion } from "../../utils/adminUtils.jsx";
import QuestionDisplayTabs from "../../components/admin/QuestionDisplayTabs";
import { SearchContainer } from "../../components/admin/SearchAndFilter";
import {
  getTrashQuestions,
  restoreQuestion,
  deletePermanent,
  emptyTrash,
  getQuestionByIdAdmin,
} from "../../services/quizService";

/**
 * QuestionCard Styled Component
 * Provides a clean container for individual trash items.
 */
const QuestionCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

export default function TrashQuestionsPage() {
  // Retrieve administrative authentication token from local storage

  const queryClient = useQueryClient();

  // ── UI States ─────────────────────────────────────────────────────────────

  /* Controls visibility and state for individual question permanent deletion */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  /* Controls visibility for bulk 'Empty Trash' action */
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);

  /* Countdown logic for permanent deletion safety barrier */
  const [isDeleting, setIsDeleting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef(null);

  /* States for viewing full details of a specific question in a modal */
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewQuestionData, setViewQuestionData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  /**
   * Initialize MathLive custom elements once for proper rendering of
   * mathematical LaTeX content in previews.
   */
  useEffect(() => {
    if (!window.customElements.get("math-field")) {
      import("mathlive").then(({ MathfieldElement }) => {
        if (!window.customElements.get("math-field")) {
          window.customElements.define("math-field", MathfieldElement);
        }
      });
    }
  }, []);

  // ── Data Fetching ─────────────────────────────────────────────────────────

  /**
   * Fetches all questions currently in the trash.
   * Cached by TanStack Query under the key 'trashQuestions'.
   */
  const { data, isLoading } = useQuery({
    queryKey: ["trashQuestions"],
    queryFn: () => getTrashQuestions(),
  });

  const questions = data?.data ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Restores a deleted question back to active status.
   */
  const restoreMutation = useMutation({
    mutationFn: (id) => restoreQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashQuestions"] });
      toast.success("Question restored successfully");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to restore question");
    },
  });

  /**
   * Permanently removes a question from the database.
   */
  const deletePermanentMutation = useMutation({
    mutationFn: (id) => deletePermanent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashQuestions"] });
      toast.success("Question deleted permanently");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to delete question permanently");
    },
    onSettled: () => {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
    },
  });

  /**
   * Permanently removes all questions currently in the trash.
   */
  const emptyTrashMutation = useMutation({
    mutationFn: () => emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trashQuestions"] });
      toast.success("Trash emptied successfully");
      setEmptyTrashOpen(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to empty trash");
    },
  });

  // ── Timer Logic ───────────────────────────────────────────────────────────

  /**
   * Starts a 5-second countdown before executing permanent deletion.
   * This provides a fail-safe 'Undo' window for administrators.
   */
  const startDeleteCountdown = () => {
    setIsDeleting(true);
    setCountdown(5);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Execute deletion mutation after countdown completion
          deletePermanentMutation.mutate(questionToDelete._id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Side effect to clean up the deletion timer on component unmount
   * or when the countdown lifecycle ends.
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Aborts the pending deletion countdown and resets UI state.
   */
  const cancelDelete = () => {
    clearInterval(timerRef.current);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setQuestionToDelete(null);
  };

  // ── View Logic ────────────────────────────────────────────────────────────

  /**
   * Fetches full question details on demand when an admin clicks the view icon.
   * Prepares the data for display in the QuestionDisplayTabs component within a modal.
   */
  const handleViewQuestion = async (id) => {
    setViewQuestionData(null);
    setViewModalOpen(true);
    setViewLoading(true);
    try {
      const res = await getQuestionByIdAdmin(id);
      setViewQuestionData(res?.data ?? null);
    } catch (err) {
      console.error("Failed to fetch question", err);
      toast.error("Failed to load question data");
    } finally {
      setViewLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader title="Trash" backPath="/admin" />

        <SearchContainer
          style={{ marginBottom: "20px" }}
          count={questions.length}
          label="Trash Items"
        />

        {/* Action bar for bulk operations */}
        <Flex
          style={{
            gap: "12px",
            margin: "10px 0 20px auto",
            width: "fit-content",
          }}
        >
          <Button
            onClick={() => setEmptyTrashOpen(true)}
            disabled={questions.length === 0}
            style={{
              fontSize: "14px",
              padding: "8px 16px",
              background: "#ffebee",
              color: "#d32f2f",
              border: "1px solid #ffcdd2",
              boxShadow: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: questions.length === 0 ? 0.5 : 1,
              cursor: questions.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <LuBan /> Empty Trash
          </Button>
        </Flex>

        <QuestionListContainer>
          {isLoading ? (
            /* Loading skeleton state */
            Array.from({ length: 3 }).map((_, i) => (
              <QuestionCard key={i}>
                <Flex style={{ gap: "15px", alignItems: "center" }}>
                  <SkeletonRect $width="30px" $height="30px" />
                  <div style={{ flex: 1 }}>
                    <SkeletonRect $width="100%" $height="60px" />
                  </div>
                </Flex>
              </QuestionCard>
            ))
          ) : questions.length > 0 ? (
            /* Map through list of trashed questions */
            questions.map((question, index) => (
              <QuestionCard key={question._id}>
                <Flex
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Flex>
                    {/* Visual index with gradient styling */}
                    <Font
                      $weight={700}
                      $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
                      style={{
                        display: "block",
                        borderRight: "solid 2px rgba(204, 204, 204, 0.23)",
                        paddingRight: "5px",
                        marginRight: "5px",
                        width: "fit-content",
                        height: "fit-content",
                        minWidth: "20px",
                      }}
                    >
                      {index + 1}
                    </Font>
                    <div style={{ flex: 1 }}>
                      {/* Truncated question preview */}
                      <ExpandableQuestion
                        html={question.question.slate || question.question.html}
                      />
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "5px",
                        }}
                      >
                        Modules:{" "}
                        {question.modules && question.modules.length > 0
                          ? question.modules.map((m) => m.name).join(", ")
                          : "Unassigned"}
                      </div>
                    </div>
                  </Flex>

                  {/* Item-level actions */}
                  <Flex style={{ gap: "15px" }}>
                    <IconButton
                      onClick={() => handleViewQuestion(question._id)}
                      title="View Question"
                    >
                      <FaRegEye />
                    </IconButton>

                    <IconButton
                      $success
                      onClick={() => {
                        restoreMutation.mutate(question._id);
                      }}
                      title="Restore"
                    >
                      <LuRotateCcw />
                    </IconButton>

                    <IconButton
                      onClick={() => {
                        setQuestionToDelete(question);
                        setDeleteModalOpen(true);
                      }}
                      $danger
                      title="Delete Permanently"
                    >
                      <LuTrash2 />
                    </IconButton>
                  </Flex>
                </Flex>
              </QuestionCard>
            ))
          ) : (
            /* Empty state when no questions are in trash */
            <EmptyState message="Trash is empty." icon={<LuTrash2 />} />
          )}
        </QuestionListContainer>

        {/* Modal: Detailed Question View */}
        <CommonDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title="View Question Details"
          maxWidth="700px"
          footer={
            <DialogButtonGroup>
              <DialogButton
                type="button"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          {viewLoading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "8px 0",
              }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonRect key={i} $height="48px" $borderRadius="10px" />
              ))}
            </div>
          ) : viewQuestionData ? (
            <QuestionDisplayTabs
              question={viewQuestionData}
              showContext={false}
            />
          ) : null}
        </CommonDialog>

        {/* Modal: Permanent Deletion Confirmation with Countdown */}
        <CommonDialog
          open={deleteModalOpen}
          onOpenChange={(open) => {
            if (!open && isDeleting) return; // Prevent closing while countdown is active
            setDeleteModalOpen(open);
          }}
          title="Delete Permanently"
          description={
            isDeleting
              ? `Deleting in ${countdown} seconds...`
              : "Are you sure you want to delete this question permanently? This action is irreversible and will remove associated images."
          }
          footer={
            <DialogButtonGroup>
              {isDeleting ? (
                <DialogButton
                  type="button"
                  onClick={cancelDelete}
                  style={{ width: "100%" }}
                >
                  Undo ({countdown}s)
                </DialogButton>
              ) : (
                <>
                  <DialogButton
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                  >
                    Cancel
                  </DialogButton>
                  <DialogButton
                    type="button"
                    $danger
                    onClick={startDeleteCountdown}
                  >
                    Delete Permanently
                  </DialogButton>
                </>
              )}
            </DialogButtonGroup>
          }
        ></CommonDialog>

        {/* Modal: Bulk Trash Emptying Confirmation */}
        <CommonDialog
          open={emptyTrashOpen}
          onOpenChange={setEmptyTrashOpen}
          title="Empty Trash"
          description="Are you sure you want to permanently delete all questions in the trash? This action cannot be undone."
          footer={
            <DialogButtonGroup>
              <DialogButton
                type="button"
                onClick={() => setEmptyTrashOpen(false)}
              >
                Cancel
              </DialogButton>
              <DialogButton
                type="button"
                $danger
                onClick={() => {
                  emptyTrashMutation.mutate();
                }}
                disabled={emptyTrashMutation.isPending}
              >
                {emptyTrashMutation.isPending ? "Emptying..." : "Empty Trash"}
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>
      </PageContainer>
    </Wrapper>
  );
}
