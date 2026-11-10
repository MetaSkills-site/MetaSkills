/**
 * @file QuestionInfoModal.jsx
 * @description A detailed informational modal for administrators to inspect the metadata
 * of a specific quiz question, including its type, linked modules, tags, skills, and history.
 *
 * @dependencies
 * - @tanstack/react-query: For efficient, cached fetching of question details.
 * - react-icons/lu: For categorized section iconography.
 * - CommonDialog: Shared modal component for consistent UI behavior.
 * - AdminUtils: For specialized components like DifficultyBadge.
 *
 * @exports
 * - QuestionInfoModal (default): The functional modal component.
 *
 * @interconnections
 * - Triggered from question lists or the question editor.
 * - Fetches data using 'getQuestionByIdAdmin' from quizService when opened.
 */

import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import {
  LuCalendarDays,
  LuPencilLine,
  LuLayers,
  LuTag,
  LuBrain,
  LuFileType2,
} from "react-icons/lu";
import CommonDialog from "../common/CommonDialog";
import { DialogButtonGroup, DialogButton } from "./AdminStyles";
import { SkeletonRect } from "../SkeletonLoader";
import Tag from "../common/Tag";
import Badge from "../common/Badge";
import { DifficultyBadge } from "../../utils/adminUtils";

// ─── Styled Layout ────────────────────────────────────────────────

/**
 * Main grid container for categorized question information.
 */
const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

/**
 * Individual data section with an icon and content area.
 */
const Section = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

/**
 * Themed icon container with dynamic background and color.
 */
const IconWrap = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(p) => p.$bg || "rgba(255,87,34,0.08)"};
  color: ${(p) => p.$color || "#ff5722"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  margin-top: 2px;
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const SectionLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #aaa;
`;

const SectionValue = styled.span`
  font-size: 14px;
  color: #333;
  font-weight: 500;
  word-break: break-word;
`;

/**
 * Layout for displaying multiple chips or tags.
 */
const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`;

const EmptyHint = styled.span`
  font-size: 13px;
  color: #bbb;
  font-style: italic;
`;

/**
 * Specialized badge for IDs, allowing easy selection for copying.
 */
const IdBadge = styled(Badge).attrs({
  fontSize: "11px",
  color: "#888",
  bg: "#f5f5f5",
  padding: "2px 8px",
  radius: "6px",
  as: "code",
})`
  user-select: all;
  word-break: break-all;
`;

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Formats an ISO date into a readable string with relative context (Today, Yesterday, etc.)
 */
const formatDate = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round((startOfToday - startOfDate) / 86_400_000);

  // Logic for returning relative date strings vs absolute dates
  if (dayDiff === 0) return `Today at ${timeStr}`;
  if (dayDiff === 1) return `Yesterday at ${timeStr}`;
  if (dayDiff < 7) return `${dayDiff} days ago at ${timeStr}`;

  return (
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + ` at ${timeStr}`
  );
};

/**
 * Maps internal answerType values to human-readable format labels.
 */
const FORMAT_LABEL = {
  MCQ: "Multiple Choice (MCQ)",
  SA: "Short Answer (SA)",
  fillInTheBlanks: "Fill in the Blanks",
};

// ─── Component ───────────────────────────────────────────────────
export default function QuestionInfoModal({ questionId, open, onOpenChange }) {
  /**
   * Fetches full question details using React Query.
   * 'enabled' ensures we only fetch when the modal is actually visible.
   * 'staleTime' allows instant re-opening for the same question within a 5min window.
   */
  const { data: questionRaw, isLoading: loading } = useQuery({
    queryKey: ["question", questionId],
    queryFn: async () => {
      // Dynamic import of service to keep initial bundle size smaller
      const { getQuestionByIdAdmin } = await import(
        "../../services/quizService"
      );
      const res = await getQuestionByIdAdmin(questionId);
      return res?.data ?? null;
    },
    enabled: open && !!questionId,
    staleTime: 5 * 60_000,
  });

  const data = questionRaw ?? null;

  const modules = data?.modules || [];
  const tags = data?.tags || [];
  const skills = data?.skills || [];

  return (
    <CommonDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Question Info"
      maxWidth="520px"
      footer={
        <DialogButtonGroup>
          <DialogButton onClick={() => onOpenChange(false)}>Close</DialogButton>
        </DialogButtonGroup>
      }
    >
      {loading ? (
        /* Skeletons to maintain layout while data is in flight */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            padding: "4px 0",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRect key={i} $height="42px" $borderRadius="10px" />
          ))}
        </div>
      ) : data ? (
        <InfoGrid>
          {/* Question Database ID */}
          <Section>
            <IconWrap $bg="rgba(0,0,0,0.04)" $color="#888">
              <LuFileType2 />
            </IconWrap>
            <SectionContent>
              <SectionLabel>Question ID</SectionLabel>
              <IdBadge>{data._id}</IdBadge>
            </SectionContent>
          </Section>

          {/* Type and Difficulty Level */}
          <Section>
            <IconWrap $bg="rgba(33,150,243,0.08)" $color="#1976d2">
              <LuFileType2 />
            </IconWrap>
            <SectionContent>
              <SectionLabel>Format</SectionLabel>
              <SectionValue>
                {FORMAT_LABEL[data.answerType] || data.answerType || "—"}
              </SectionValue>
              <DifficultyBadge difficulty={data.displayDifficulty} />
            </SectionContent>
          </Section>

          {/* Modules this question belongs to */}
          <Section>
            <IconWrap $bg="rgba(103,58,183,0.08)" $color="#673ab7">
              <LuLayers />
            </IconWrap>
            <SectionContent>
              <SectionLabel>Modules</SectionLabel>
              {modules.length > 0 ? (
                <ChipRow>
                  {modules.map((m) => (
                    <Tag
                      key={m._id}
                      label={`${m.name}${m.subject ? ` · ${m.subject}` : ""}`}
                      style={{ fontSize: "12px" }}
                    />
                  ))}
                </ChipRow>
              ) : (
                <EmptyHint>Not attached to any module</EmptyHint>
              )}
            </SectionContent>
          </Section>

          {/* Administrative Tags */}
          <Section>
            <IconWrap $bg="rgba(233,30,99,0.08)" $color="#e91e63">
              <LuTag />
            </IconWrap>
            <SectionContent>
              <SectionLabel>Tags</SectionLabel>
              {tags.length > 0 ? (
                <ChipRow>
                  {tags.map((t) => (
                    <Tag key={t} label={t} style={{ fontSize: "12px" }} />
                  ))}
                </ChipRow>
              ) : (
                <EmptyHint>No tags</EmptyHint>
              )}
            </SectionContent>
          </Section>

          {/* Educational Skills associated */}
          <Section>
            <IconWrap $bg="rgba(0,150,136,0.08)" $color="#009688">
              <LuBrain />
            </IconWrap>
            <SectionContent>
              <SectionLabel>Skills</SectionLabel>
              {skills.length > 0 ? (
                <ChipRow>
                  {skills.map((s) => (
                    <Tag
                      key={s}
                      label={s}
                      active
                      style={{ fontSize: "12px" }}
                    />
                  ))}
                </ChipRow>
              ) : (
                <EmptyHint>No skills assigned</EmptyHint>
              )}
            </SectionContent>
          </Section>

          {/* Metadata: Creation Timestamp */}
          <Section>
            <IconWrap $bg="rgba(76,175,80,0.08)" $color="#388e3c">
              <LuCalendarDays />
            </IconWrap>
            <SectionContent>
              <SectionLabel>Created</SectionLabel>
              <SectionValue>{formatDate(data.createdAt)}</SectionValue>
            </SectionContent>
          </Section>

          {/* Metadata: Modification Timestamp */}
          <Section>
            <IconWrap $bg="rgba(255,152,0,0.08)" $color="#f57c00">
              <LuPencilLine />
            </IconWrap>
            <SectionContent>
              <SectionLabel>Last Modified</SectionLabel>
              <SectionValue>{formatDate(data.updatedAt)}</SectionValue>
            </SectionContent>
          </Section>
        </InfoGrid>
      ) : (
        /* Fallback for failed loads or empty data */
        <EmptyHint
          style={{ display: "block", textAlign: "center", padding: "24px 0" }}
        >
          Failed to load question details.
        </EmptyHint>
      )}
    </CommonDialog>
  );
}
