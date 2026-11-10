/**
 * @file UserHistoryPage.jsx
 * @description Admin-facing view that displays the detailed quiz attempt history for a specific user.
 * Implements window-based virtualization for performance and optimistic updates for data management.
 *
 * @dependencies
 * - @tanstack/react-query: For efficient data fetching, caching, and mutations.
 * - @tanstack/react-virtual: For window-level virtualization of long history lists.
 * - react-router-dom: For accessing the userId from the URL path.
 * - styled-components: For component-specific layouts and styling.
 * - adminService: For fetching combined user info and quiz history.
 *
 * @exports
 * - UserHistoryPage (default): The main functional component for viewing user progress.
 * - Various styled components for layout and status indicators.
 *
 * @interconnections
 * - Reached via the User Management dashboard.
 * - Integrates with QuestionBlock for rendering the actual quiz content in read-only mode.
 * - Uses AdminHeader and AdminStyles for consistent dashboard integration.
 */

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  Wrapper,
  PageContainer,
  DialogButtonGroup,
  DialogButton,
} from "../../components/admin/AdminStyles";
import CommonDialog from "../../components/common/CommonDialog";
import QuestionBlock from "../../components/QuestionBlock";
import AdminHeader from "../../components/admin/AdminHeader";
import { SearchContainer } from "../../components/admin/SearchAndFilter";
import EmptyState from "../../components/EmptyState";
import { LuHistory } from "react-icons/lu";
import { MdDelete } from "react-icons/md";
import { SkeletonRect } from "../../components/SkeletonLoader";
import SurfaceCard from "../../components/common/SurfaceCard";
import Badge from "../../components/common/Badge";
import {
  getUserHistoryAndInfo,
  deleteQuizResponse,
} from "../../services/adminService";

/**
 * Layout container for the history list.
 */
export const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-top: 20px;
`;

/**
 * Section card grouping questions by their parent module.
 */
export const ModuleSection = styled(SurfaceCard).attrs({
  radius: "15px",
  padding: "20px",
  shadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  border: "1px solid #eee",
  interactive: false,
})`
  margin-bottom: 30px;
`;

/**
 * Header for a module section showing title and subject.
 */
export const ModuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
`;

/**
 * Status indicator for module completion (Completed/Incomplete).
 */
export const StatusBadge = styled(Badge).attrs((props) => ({
  bg: props.status === "completed" ? "#e8f5e9" : "#fff3e0",
  color: props.status === "completed" ? "#2e7d32" : "#ef6c00",
  padding: "5px 12px",
  radius: "20px",
  fontSize: "0.85rem",
  fontWeight: "bold",
  capitalize: true,
}))``;

/**
 * Individual question response card with color-coded results.
 */
export const QuestionItem = styled(SurfaceCard).attrs({
  radius: "12px",
  padding: "20px",
  bg: "#f9f9f9",
  interactive: true,
  hoverLift: "-2px",
  hoverShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
})`
  margin-bottom: 30px;
  border: 1px solid #eee;

  /* Left border color logic based on correctness (Green: Correct, Orange: Partial, Red: Incorrect) */
  border-left: 5px solid
    ${(props) => {
      if (typeof props.$isCorrect === "number") {
        if (props.$isCorrect === 100) return "#4caf50";
        if (props.$isCorrect > 0) return "#ff9800";
        return "#f44336";
      }
      return props.$isCorrect ? "#4caf50" : "#f44336";
    }};
`;

/**
 * Metadata display for results, time taken, and timestamp.
 */
export const MetaInfo = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 15px;
  font-size: 0.9rem;
  color: #666;
  background: white;
  padding: 10px;
  border-radius: 8px;
`;

/**
 * Highlights the correct answer for incorrectly answered questions.
 */
export const CorrectAnswerDisplay = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  font-weight: bold;
`;

/**
 * Positioning context for virtualization. Required to correctly place items
 * in a 1D vertical list using absolute positioning.
 */
const VirtualListRoot = styled.div`
  position: relative;
  width: 100%;
`;

/**
 * Sticky-friendly header for module sections within the virtualized list.
 */
const ModuleSectionHeader = styled.div`
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export default function UserHistoryPage() {
  const { userId } = useParams();

  const queryClient = useQueryClient();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);

  /**
   * scrollMargin Calculation: Determines how far the list is from the top of the window.
   * This ensures virtualization offsets are correct relative to the page layout.
   */
  const listRef = useRef(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    if (listRef.current) {
      setScrollMargin(listRef.current.offsetTop);
    }
  }, []);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  /**
   * Fetches user info and quiz history in parallel to avoid sequential network waterfalls.
   * Query is keyed by userId to ensure data isolation.
   */
  const { data, isLoading } = useQuery({
    queryKey: ["userHistory", userId],
    queryFn: () => getUserHistoryAndInfo(userId),
    enabled: !!userId,
  });

  const userInfo = data?.userInfo?.data ?? data?.userInfo ?? null;
  const history = data?.history?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Handles deletion of a specific quiz response.
   * Implements optimistic UI updates by manually filtering the local cache before server confirmation.
   */
  const deleteResponseMutation = useMutation({
    mutationFn: (responseId) => deleteQuizResponse(responseId),
    onSuccess: (_, responseId) => {
      /**
       * Optimistic UI Logic: Manually update the 'userHistory' cache to remove the deleted question.
       * If a module becomes empty after deletion, the module itself is removed from the view.
       */
      queryClient.setQueryData(["userHistory", userId], (old) => {
        if (!old) return old;
        const newHistory = (old.history?.data ?? [])
          .map((m) => ({
            ...m,
            questions: m.questions.filter((q) => q.responseId !== responseId),
          }))
          .filter((m) => m.questions.length > 0);
        return {
          ...old,
          history: { ...old.history, data: newHistory },
        };
      });
      toast.success("Response deleted successfully");
      setDeleteModalOpen(false);
      setResponseToDelete(null);
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete response");
    },
  });

  // ── Utility Functions ─────────────────────────────────────────────────────

  /**
   * Formats total seconds into a human-readable duration string (hr, min, sec).
   */
  const formatTime = (seconds) => {
    if (!seconds) return "0 sec";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} hr`);
    if (m > 0) parts.push(`${m} min`);
    if (s > 0 || parts.length === 0) parts.push(`${s} sec`);
    return parts.join(" ");
  };

  /**
   * Helper to determine if the correct answer should be shown.
   * Shows it if isCorrect is < 100 (for numeric results) or not true (for boolean results).
   */
  const shouldShowCorrectAnswer = (isCorrect) => {
    if (typeof isCorrect === "number") {
      return isCorrect < 100;
    }
    return isCorrect !== true;
  };

  /**
   * Data Flattening logic: Transforms the nested module structure into a flat array of rows.
   * This is required for virtualization which expects a linear index to map to screen coordinates.
   */
  const flatRows = useMemo(() => {
    const rows = [];
    history.forEach((module) => {
      rows.push({
        type: "module-header",
        key: `module-${module.moduleId}`,
        data: module,
      });
      module.questions.forEach((q, idx) => {
        rows.push({
          type: "question",
          key: `q-${module.moduleId}-${q.questionId ?? idx}`,
          idx,
          data: q,
          moduleId: module.moduleId,
        });
      });
    });
    return rows;
  }, [history]);

  /**
   * useWindowVirtualizer: Optimizes rendering by only mounting DOM nodes that are visible in the viewport.
   * Uses estimateSize to predict scroll height before items are actually rendered.
   */
  const windowVirtualizer = useWindowVirtualizer({
    count: flatRows.length,
    estimateSize: (index) =>
      flatRows[index]?.type === "module-header" ? 80 : 380,
    overscan: 3,
    scrollMargin,
  });

  // ── Render Logic ──────────────────────────────────────────────────────────

  if (isLoading)
    return (
      <Wrapper>
        <PageContainer style={{ maxWidth: "1000px" }}>
          <AdminHeader
            title="Loading History..."
            backPath="/admin/viewUsers"
            backText="Back to Users"
          />
          <HistoryContainer>
            {Array.from({ length: 3 }).map((_, i) => (
              <ModuleSection key={i}>
                <ModuleHeader>
                  <div style={{ width: "100%" }}>
                    <SkeletonRect $height="24px" $width="40%" $mb="8px" />
                    <SkeletonRect $height="16px" $width="20%" />
                  </div>
                </ModuleHeader>
                <div style={{ padding: "20px" }}>
                  <SkeletonRect $height="100px" $width="100%" $radius="12px" />
                </div>
              </ModuleSection>
            ))}
          </HistoryContainer>
        </PageContainer>
      </Wrapper>
    );

  return (
    <Wrapper>
      <PageContainer style={{ maxWidth: "1000px" }}>
        <AdminHeader
          title={userInfo ? `${userInfo.fullname}'s History` : "User History"}
          backPath="/admin/viewUsers"
          backText="Back to Users"
        />

        <SearchContainer count={history.length} label="Total History Items" />

        {history.length === 0 ? (
          <EmptyState
            message="No quiz history found for this user."
            icon={<LuHistory />}
          />
        ) : (
          /**
           * Rendering context for virtualization. The parent height is set to
           * the total virtual size to maintain native window scroll behavior.
           */
          <VirtualListRoot
            ref={listRef}
            style={{ height: windowVirtualizer.getTotalSize() }}
          >
            {windowVirtualizer.getVirtualItems().map((vRow) => {
              const row = flatRows[vRow.index];
              return (
                <div
                  key={vRow.key}
                  data-index={vRow.index}
                  ref={windowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vRow.start - windowVirtualizer.options.scrollMargin}px)`,
                    paddingBottom: row.type === "module-header" ? "0" : "20px",
                  }}
                >
                  {/* Logic for rendering module section headers vs individual question responses */}
                  {row.type === "module-header" ? (
                    <ModuleSectionHeader
                      style={{
                        marginBottom: "10px",
                        marginTop: vRow.index > 0 ? "30px" : "20px",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                          {row.data.moduleName}
                        </h3>
                        <span style={{ fontSize: "0.9rem", color: "#666" }}>
                          {row.data.subject}
                        </span>
                      </div>
                      <StatusBadge status={row.data.status ?? "unknown"}>
                        {(row.data.status ?? "unknown").replace("_", " ")}
                      </StatusBadge>
                    </ModuleSectionHeader>
                  ) : (
                    <QuestionItem $isCorrect={row.data.isCorrect}>
                      <div
                        style={{
                          marginBottom: "10px",
                          fontWeight: "bold",
                          color: "#555",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>Question {row.idx + 1}</span>
                        {row.data.responseId && (
                          <MdDelete
                            size={20}
                            color="#ff4d4d"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setResponseToDelete(row.data.responseId);
                              setDeleteModalOpen(true);
                            }}
                            title="Delete Response"
                          />
                        )}
                      </div>

                      <QuestionBlock
                        question={{
                          slate: row.data.questionSlate,
                          answerType: row.data.answerType,
                          options: row.data.options,
                        }}
                        options={row.data.options}
                        selectedAnswer={row.data.userResponse}
                        readOnly={true}
                      />

                      <MetaInfo>
                        <span>
                          <strong>Result:</strong>{" "}
                          {typeof row.data.isCorrect === "number"
                            ? `${Math.round(row.data.isCorrect)}%`
                            : row.data.isCorrect
                              ? "Correct"
                              : "Incorrect"}
                        </span>
                        <span>
                          <strong>Time Taken:</strong>{" "}
                          {formatTime(row.data.timeTaken)}
                        </span>
                        <span>
                          <strong>Attempted:</strong>{" "}
                          {new Date(row.data.attemptedAt).toLocaleString()}
                        </span>
                      </MetaInfo>

                      {/* Fallback display for the correct answer if the user was wrong or partially correct */}
                      {shouldShowCorrectAnswer(row.data.isCorrect) && (
                        <CorrectAnswerDisplay>
                          Correct Answer: {row.data.correctAnswer}
                        </CorrectAnswerDisplay>
                      )}
                    </QuestionItem>
                  )}
                </div>
              );
            })}
          </VirtualListRoot>
        )}

        {/* Delete Confirmation Modal for destructive actions */}
        <CommonDialog
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          title="Delete Response"
          description="Are you sure you want to delete this response? This action cannot be undone."
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton
                type="button"
                $danger
                disabled={deleteResponseMutation.isPending}
                onClick={() => deleteResponseMutation.mutate(responseToDelete)}
              >
                {deleteResponseMutation.isPending ? "Deleting..." : "Delete"}
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>
      </PageContainer>
    </Wrapper>
  );
}
