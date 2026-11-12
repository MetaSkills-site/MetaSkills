/**
 * @file ContextSelector.jsx
 * @description Context attachment selector allowing administrators to search, choose, or create reading passage contexts for questions.
 * @architecture Admin form control integrated into question authoring workflows, communicating with passagesService and TanStack Query.
 * @agent_note Invalidation of 'contextAttachments' query occurs upon creation of new contexts; ensure payload matches passage model.
 */

/**
 * ContextSelector.jsx
 *
 * PURPOSE:
 * A specialized selection component that allows administrators to search, select,
 * or create new context attachments (like reading passages or case studies)
 * for questions. It integrates directly with the question creation/editing workflow.
 *
 * DEPENDENCIES:
 * - @tanstack/react-query: For fetching and caching context attachments.
 * - react-icons: For UI icons (search, add, file).
 * - passagesService: API methods for fetching and creating context attachments.
 * - CommonDialog: For the "New Context" creation workflow.
 * - TextBox (Slate Editor): For rich-text content input.
 *
 * EXPORTS:
 * - ContextSelector (default): The functional component for context selection.
 *
 * INTERCONNECTIONS:
 * - Used in WriteQuestion and EditQuestion components.
 * - Triggers invalidation of the 'contextAttachments' query upon new creation.
 */

import { useState } from "react";
import styled from "styled-components";
import { Flex } from "../../styles/Flex.style";
import { SearchInput } from "./SearchAndFilter";
import CommonDialog from "../common/CommonDialog";
import { DialogButtonGroup, DialogButton } from "./AdminStyles";
import { IoIosAdd, IoIosSearch } from "react-icons/io";
import { LuFileText } from "react-icons/lu";
import TextBox from "../Editor/Editor";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonRect } from "../SkeletonLoader";

// ── Styled Components ───────────────────────────────────────────────────────

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`;

const ContextList = styled.div`
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`;

const ContextItem = styled.div`
  padding: 15px;
  background: ${(props) => (props.$selected ? "#e3f2fd" : "#f9f9f9")};
  border: 1px solid ${(props) => (props.$selected ? "#2196f3" : "#eee")};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: #f0f0f0;
    border-color: #ddd;
  }
`;

const Label = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #888;
  gap: 10px;
  font-size: 14px;
`;

const InputGroup = styled.div`
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 14px;
    font-weight: 600;
    color: #444;
  }

  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    outline: none;

    &:focus {
      border-color: #ff5722;
    }
  }
`;

/**
 * Context attachment selector component with search and inline creation dialog.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} [props.selectedId] - Currently selected context attachment ID.
 * @param {Function} props.onSelect - Callback invoked when a context is selected.
 * @param {boolean} [props.hideLabel=false] - Whether to suppress the section title label.
 * @returns {JSX.Element} Rendered context selection interface.
 */
export default function ContextSelector({
  selectedId,
  onSelect,
  hideLabel = false,
}) {
  const [search, setSearch] = useState("");

  // UI State for the creation dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContextTitle, setNewContextTitle] = useState("");
  const [newContextContent, setNewContextContent] = useState(null);

  const queryClient = useQueryClient();

  // ── Data Fetching ─────────────────────────────────────────────────────────

  /**
   * Fetches the list of available context attachments.
   * Uses dynamic import for passagesService to optimize bundle size.
   */
  const { data, isLoading: loading } = useQuery({
    queryKey: ["contextAttachments", search],
    queryFn: async () => {
      const { getContextAttachments } =
        await import("../../services/passagesService");
      return getContextAttachments({ search });
    },
    staleTime: 30_000,
  });

  const contexts = data?.data ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Mutation to create a new context attachment.
   * Auto-selects the newly created context upon success.
   */
  const createContextMutation = useMutation({
    mutationFn: async ({ title, text }) => {
      const { createContextAttachment } =
        await import("../../services/passagesService");
      return createContextAttachment({ title, text });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["contextAttachments"] });
      toast.success("Context created successfully");
      setIsDialogOpen(false);
      setNewContextTitle("");
      setNewContextContent(null);
      // Auto-select logic
      if (onSelect) onSelect(res?.data?._id ?? res?._id);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to create context");
    },
  });

  /**
   * Validation and execution of the creation mutation.
   * Checks for empty title and performs a deep check on Slate editor content
   * to ensure it's not just empty nodes or whitespace.
   */
  const handleCreateContext = () => {
    const trimmedTitle = newContextTitle.trim();
    if (!trimmedTitle) {
      toast.error("Please enter a title");
      return;
    }

    // Advanced check for Slate editor emptiness
    const isSlateEmpty =
      !newContextContent ||
      newContextContent.every((node) =>
        (node.children ?? []).every((c) => !(c.text ?? "").trim()),
      );

    if (isSlateEmpty) {
      toast.error("Please enter some content");
      return;
    }

    createContextMutation.mutate({
      title: trimmedTitle,
      text: { slate: newContextContent },
    });
  };

  return (
    <Container>
      {!hideLabel && <Label>Attach Context (Optional)</Label>}

      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* Search and Add bar */}
        <Flex style={{ gap: "10px" }}>
          <SearchInput
            placeholder="Search contexts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
          <DialogButton
            $primary
            onClick={() => setIsDialogOpen(true)}
            style={{
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <IoIosAdd size={20} /> New
          </DialogButton>
        </Flex>

        {/* Scrollable list of existing contexts */}
        <ContextList>
          {loading ? (
            /* Loading state skeletons */
            Array(4)
              .fill(0)
              .map((_, i) => (
                <SkeletonRect
                  key={i}
                  $height="60px"
                  $radius="8px"
                  style={{ marginBottom: "10px" }}
                />
              ))
          ) : contexts.length > 0 ? (
            /* Selection list */
            contexts.map((ctx) => (
              <ContextItem
                key={ctx._id}
                $selected={selectedId === ctx._id}
                onClick={() => {
                  if (onSelect) {
                    onSelect(
                      selectedId === ctx._id ? null : ctx._id,
                      selectedId === ctx._id ? null : ctx,
                    );
                  }
                }}
              >
                <LuFileText size={20} color="#666" />
                <span style={{ fontWeight: 500, color: "#666" }}>
                  {ctx.title}
                </span>
                {selectedId === ctx._id && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "12px",
                      color: "#2196f3",
                      fontWeight: "bold",
                    }}
                  >
                    Selected
                  </span>
                )}
              </ContextItem>
            ))
          ) : (
            /* Empty search results state */
            <EmptyState>
              <IoIosSearch size={40} />
              <span>No contexts to show</span>
            </EmptyState>
          )}
        </ContextList>
      </div>

      {/* Creation Modal: Add Context Dialog */}
      <CommonDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Create New Context Attachment"
        description="Add a passage or case study that can be attached to questions."
        maxWidth="800px"
        footer={
          <DialogButtonGroup>
            <DialogButton type="button" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton
              type="button"
              $primary
              onClick={handleCreateContext}
              disabled={createContextMutation.isPending}
            >
              {createContextMutation.isPending
                ? "Creating..."
                : "Create Context"}
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        <div style={{ margin: "20px 0" }}>
          {/* Title input field */}
          <InputGroup>
            <label>Title</label>
            <input
              value={newContextTitle}
              onChange={(e) => setNewContextTitle(e.target.value)}
              placeholder="e.g. Reading Passage 1"
            />
          </InputGroup>

          {/* Rich-text content area using Slate editor */}
          <InputGroup>
            <label>Content</label>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "6px",
                minHeight: "200px",
              }}
            >
              <TextBox
                value={newContextContent}
                onChange={setNewContextContent}
              />
            </div>
          </InputGroup>
        </div>
      </CommonDialog>
    </Container>
  );
}
