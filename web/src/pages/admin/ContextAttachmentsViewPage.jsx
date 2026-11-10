/**
 * @file ViewContextAttachments.jsx
 * @description Admin dashboard for managing context attachments (passages, diagrams, or instructions)
 * that can be linked to multiple quiz questions. Supports CRUD operations and reference tracking.
 *
 * @dependencies
 * - axios: For API communication with the backend.
 * - react-hot-toast: For user notifications.
 * - react-icons/lu, fa6: For iconography.
 * - styled-components: For component-level styling.
 * - useInfiniteScroll: Custom hook for paginated data fetching.
 * - CommonDialog: Shared modal component for various actions.
 * - ContextEditor: Specialized editor for context content.
 *
 * @exports
 * - ViewContextAttachments (default): The main functional component for context management.
 *
 * @interconnections
 * - Interacts with context-attachments API for lifecycle management.
 * - Queries quiz/questions API to identify which questions are linked to a specific context.
 * - Allows detaching questions from contexts directly from the reference view.
 */

import { useState, useEffect, memo } from "react";
import axios from "axios";
import adminApiClient from "../../services/adminApi";
import { API_ENDPOINTS } from "../../api/requestMap";
import toast from "react-hot-toast";
import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

import {
  LuEye,
  LuLink,
  LuPencil,
  LuTrash2,
  LuFileText,
  LuUnlink,
} from "react-icons/lu";
import { FaPlus } from "react-icons/fa6";

import AdminHeader from "../../components/admin/AdminHeader";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import CommonDialog from "../../components/common/CommonDialog";
import {
  PageContainer,
  Wrapper,
  DialogButtonGroup,
  DialogButton,
  IconButton,
} from "../../components/admin/AdminStyles";
import useKeyboardShortcut from "../../hooks/event-hooks/useKeyboardShortcut";
import { HtmlContent } from "../../utils/adminUtils";

import QuestionDisplayTabs from "../../components/admin/QuestionDisplayTabs";
import { Flex } from "../../styles/Flex.style";
import { Font } from "../../styles/Font.style";
import { SkeletonRect } from "../../components/admin/AdminDashboardView";
import EmptyState from "../../components/EmptyState";
import ContextEditor from "../../components/admin/ContextEditor";
import {
  SearchInput,
  SearchContainer,
} from "../../components/admin/SearchAndFilter";
import { ResponsiveGrid } from "../../styles/Flex.style";
import SurfaceCard from "../../components/common/SurfaceCard";

/**
 * Styled card for displaying questions that reference a specific context.
 */
const RefQuestionCard = styled(SurfaceCard).attrs({
  padding: "15px",
  radius: "10px",
  border: "1px solid #f0f0f0",
  shadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
  hoverLift: "-2px",
  hoverShadow: "0 4px 8px rgba(0, 0, 0, 0.08)",
  interactive: true,
})`
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const GridContainer = styled(ResponsiveGrid)`
  margin-top: 30px;
`;

/**
 * Main card component for individual context attachments.
 */
const ContextCard = styled(SurfaceCard).attrs({
  padding: "20px",
  radius: "12px",
  shadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  hoverLift: "-5px",
  hoverShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
  interactive: true,
})`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 180px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 15px;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
`;

const DetailTitle = styled.h3`
  margin-bottom: 15px;
`;

const ScrollableContent = styled.div`
  flex: 1;
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 8px;
`;

const ListContainer = styled.div`
  flex: 1;
  padding-left: 5px;
  margin: 10px 0;
  padding-right: 5px;
`;

const ContextTitle = styled.span`
  font-size: 20px;
  font-weight: 900;
  color: #333333ff;
  margin-bottom: 10px;
  display: block;
`;

const ContextDate = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
`;

const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`;

const FlexColumn = styled.div`
  flex: 1;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff5722 0%, #ff7043 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(255, 87, 34, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(255, 87, 34, 0.3);
  }

  svg {
    font-size: 14px;
  }
`;

import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { useAdminAuth } from "../../components/admin/AdminAuthProvider";

const ContextSearchHeader = styled(SearchContainer)`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  margin-right: 20px;
`;

const RefQuestionHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
`;

const RefQuestionDetailsFlex = styled(Flex)`
  flex: 1;
  align-items: center;
  gap: 10px;
`;

const IndexNumberDisplay = styled(Font)`
  display: block;
  border-right: solid 2px rgba(204, 204, 204, 0.23);
  padding-right: 5px;
  margin-right: 5px;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  min-width: 20px;
`;

const QuestionSnippetWrapper = styled.div`
  flex: 1;
  max-height: 60px;
  overflow: hidden;
`;

const RefActionButtonsFlex = styled(Flex)`
  gap: 8px;
  margin-left: 10px;
`;

const NoReferencesText = styled.p`
  font-style: italic;
  color: var(--text-muted, #666);
  padding: 20px 0;
`;

const ContextAttachmentsViewPage = memo(function ContextAttachmentsViewPage() {
  const [user, setUser] = useState(null);

  // Modal control states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);

  const [refModalOpen, setRefModalOpen] = useState(false);
  const [referencedQuestions, setReferencedQuestions] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const navigate = useNavigate();

  const [viewQuestionModalOpen, setViewQuestionModalOpen] = useState(false);
  const [questionToView, setQuestionToView] = useState(null);

  // Search and Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Context creation states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newContext, setNewContext] = useState({});

  // Attach global shortcut for creating a new context
  useKeyboardShortcut({
    key: "+",
    onTrigger: () => setCreateModalOpen(true),
    ignoreFormElements: true,
  });

  const { adminUser } = useAdminAuth() || {};

  useEffect(() => {
    if (adminUser) {
      setUser(adminUser);
    } else {
      navigate("/admin/login");
    }
  }, [adminUser, navigate]);

  /**
   * Debounce logic: delays the search execution until the user stops typing for 500ms.
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const queryClient = useQueryClient();

  const {
    data: contextsData,
    isFetching: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage: hasMore,
  } = useInfiniteQuery({
    queryKey: ["context-attachments", { search: debouncedSearch }],
    queryFn: async ({ pageParam = 1, signal }) => {
      try {
        const res = await adminApiClient.get(
          API_ENDPOINTS.listContextAttachments.url,
          {
            params: { page: pageParam, limit: 10, search: debouncedSearch },
            signal,
          },
        );
        return res.data;
      } catch (err) {
        if (!axios.isCancel(err)) {
          toast.error("Failed to load context attachments");
        }
        throw err;
      }
    },
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      return meta && meta.page < meta.pages ? meta.page + 1 : undefined;
    },
    enabled: !!user?.token,
    staleTime: 30_000,
  });

  const contexts = contextsData?.pages.flatMap((p) => p.data || []) ?? [];
  const total = contextsData?.pages[0]?.meta?.total ?? 0;

  /**
   * Infinite scroll observer hook.
   */
  const lastContextRef = useInfiniteScroll(
    loading || isFetchingNextPage,
    !!hasMore,
    fetchNextPage,
  );

  /**
   * Handles the creation of a new context attachment.
   */
  const handleCreate = async () => {
    const isTitleValid =
      typeof newContext.title === "string" &&
      newContext.title.trim().length > 0;

    let isTextValid = false;
    if (typeof newContext.text === "string") {
      isTextValid = newContext.text.trim().length > 0;
    } else if (newContext.text && typeof newContext.text === "object") {
      const slateText = newContext.text.slate || "";
      const htmlText = newContext.text.html || "";
      isTextValid =
        (typeof slateText === "string" && slateText.trim().length > 0) ||
        (typeof htmlText === "string" && htmlText.trim().length > 0);
    }

    if (!isTitleValid || !isTextValid) {
      toast.error("Title and content are required");
      return;
    }

    try {
      await adminApiClient.post(
        API_ENDPOINTS.createContextAttachment.url,
        newContext,
      );
      toast.success("Context created successfully");
      setCreateModalOpen(false);
      setNewContext({});
      queryClient.invalidateQueries({ queryKey: ["context-attachments"] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create context");
    }
  };

  const handleView = (context) => {
    setSelectedContext(context);
    setViewModalOpen(true);
  };

  /**
   * Fetches all quiz questions that are currently linked to the selected context.
   */
  const handleCheckReferences = async (context) => {
    setSelectedContext(context);
    setRefModalOpen(true);
    setLoadingRefs(true);
    try {
      const res = await adminApiClient.post(API_ENDPOINTS.getQuestions.url, {
        contextAttachmentId: context._id,
      });
      setReferencedQuestions(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch referenced questions");
    } finally {
      setLoadingRefs(false);
    }
  };

  /**
   * Fetches full question details for the preview modal.
   */
  const handleViewQuestion = async (questionId) => {
    try {
      const res = await adminApiClient.post(
        API_ENDPOINTS.getQuestionByIdAdmin.url,
        { id: questionId },
      );
      setQuestionToView(res.data.data);

      setViewQuestionModalOpen(true);
    } catch (err) {
      toast.error("Failed to fetch question details");
      console.error(err);
    }
  };

  const [detachModalOpen, setDetachModalOpen] = useState(false);
  const [questionToDetach, setQuestionToDetach] = useState(null);

  const checkDetachQuestion = (questionId) => {
    setQuestionToDetach(questionId);
    setDetachModalOpen(true);
  };

  /**
   * Unlinks a question from its context by setting the contextAttachmentId to null.
   */
  const confirmDetachQuestion = async () => {
    if (!questionToDetach) return;

    try {
      await adminApiClient.put(API_ENDPOINTS.detachQuestion.url, {
        id: questionToDetach,
        contextAttachmentId: null,
      });
      toast.success("Question detached successfully");
      setDetachModalOpen(false);
      setQuestionToDetach(null);
      // Refresh the references list to reflect the removal
      handleCheckReferences(selectedContext);
    } catch (err) {
      toast.error("Failed to detach question");
      console.error(err);
    }
  };

  const handleEdit = (context) => {
    setSelectedContext(context);
    setEditModalOpen(true);
  };

  /**
   * Deletes the context attachment from the system.
   */
  const handleDelete = async () => {
    if (!selectedContext) return;
    try {
      await adminApiClient.delete(
        API_ENDPOINTS.deleteContextAttachment.url({ id: selectedContext._id }),
      );
      toast.success("Context attachment deleted");
      setDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["context-attachments"] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete context attachment");
    }
  };

  /**
   * Updates an existing context attachment's data.
   */
  const handleUpdate = async (contextData) => {
    try {
      await adminApiClient.put(
        API_ENDPOINTS.updateContextAttachment.url({ id: contextData._id }),
        contextData,
      );
      toast.success("Context updated successfully");
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["context-attachments"] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update context");
    }
  };

  return (
    <Wrapper>
      <PageContainer style={{ maxWidth: "1200px", width: "90%" }}>
        <AdminHeader
          title="Context Attachments"
          backPath="/admin"
          count={total}
        />

        <ContextSearchHeader count={total} label="Total Contexts">
          <SearchInputWrapper>
            <SearchInput
              placeholder="Search context attachments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInputWrapper>
          <CreateButton onClick={() => setCreateModalOpen(true)}>
            <FaPlus />
            Add New Context
          </CreateButton>
        </ContextSearchHeader>

        {/* Loading and Empty State handling */}
        {loading && contexts.length === 0 ? (
          <GridContainer>
            {[1, 2, 3].map((i) => (
              <SkeletonRect key={i} $height="200px" />
            ))}
          </GridContainer>
        ) : contexts.length === 0 ? (
          <EmptyState
            message={
              searchQuery
                ? "No matching contexts found"
                : "No context attachments found"
            }
            icon={<LuFileText />}
          />
        ) : (
          <GridContainer>
            {contexts.map((context, index) => {
              const isLast = index === contexts.length - 1;
              return (
                <ContextCard
                  ref={isLast ? lastContextRef : null}
                  key={context._id}
                >
                  <div>
                    <ContextTitle>{context.title}</ContextTitle>
                    <ContextDate>
                      {(() => {
                        /* Ordinal date formatting logic (e.g., 1st, 2nd, 3rd) */
                        const d = new Date(context.createdAt);
                        const day = d.getDate();
                        const suffix = {
                          one: "st",
                          two: "nd",
                          few: "rd",
                          other: "th",
                        }[
                          new Intl.PluralRules("en-US", {
                            type: "ordinal",
                          }).select(day)
                        ];
                        return `${day}${suffix} ${d.toLocaleString("en-GB", { month: "short" }).toLowerCase()} ${d.getFullYear()}`;
                      })()}
                    </ContextDate>
                  </div>

                  {/* Context action buttons */}
                  <Actions>
                    <IconButton
                      onClick={() => handleView(context)}
                      title="View Content"
                    >
                      <LuEye />
                    </IconButton>
                    <IconButton
                      onClick={() => handleCheckReferences(context)}
                      title="Check References"
                    >
                      <LuLink />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEdit(context)}
                      title="Edit"
                    >
                      <LuPencil />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedContext(context);
                        setDeleteModalOpen(true);
                      }}
                      title="Delete"
                      $danger
                    >
                      <LuTrash2 />
                    </IconButton>
                  </Actions>
                </ContextCard>
              );
            })}
            {/* Infinite loading indicators */}
            {loading &&
              contexts.length > 0 &&
              [1, 2, 3].map((i) => (
                <SkeletonRect key={`loading-${i}`} $height="200px" />
              ))}
          </GridContainer>
        )}

        {/* View Modal: Displays context content as HTML/Slate */}
        <CommonDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title="View Context Document"
          maxWidth="70vw"
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setViewModalOpen(false)}>
                Close
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          {selectedContext && (
            <FlexColumn>
              <DetailTitle>{selectedContext.title}</DetailTitle>
              <ScrollableContent>
                <HtmlContent
                  html={
                    selectedContext.text?.slate ??
                    selectedContext.text?.html ??
                    ""
                  }
                />
              </ScrollableContent>
            </FlexColumn>
          )}
        </CommonDialog>

        {/* References Modal: Lists all questions using this context */}
        <CommonDialog
          open={refModalOpen}
          onOpenChange={setRefModalOpen}
          title="Referenced Questions"
          maxWidth="50vw"
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setRefModalOpen(false)}>
                Close
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          {loadingRefs ? (
            <SkeletonContainer>
              {[1, 2, 3].map((i) => (
                <SkeletonRect key={i} $height="80px" $radius="10px" />
              ))}
            </SkeletonContainer>
          ) : referencedQuestions.length > 0 ? (
            <ListContainer>
              {referencedQuestions.map((q, index) => (
                <RefQuestionCard key={q._id}>
                  <RefQuestionHeader>
                    <RefQuestionDetailsFlex>
                      <IndexNumberDisplay
                        $weight={700}
                        $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
                      >
                        {index + 1}
                      </IndexNumberDisplay>
                      <QuestionSnippetWrapper>
                        <HtmlContent
                          html={q.question?.slate ?? q.question?.html ?? ""}
                        />
                      </QuestionSnippetWrapper>
                    </RefQuestionDetailsFlex>
                    <RefActionButtonsFlex>
                      <IconButton
                        onClick={() => handleViewQuestion(q._id)}
                        title="View Details"
                      >
                        <LuEye />
                      </IconButton>
                      <IconButton
                        onClick={() => checkDetachQuestion(q._id)}
                        title="Detach from Context"
                        $danger
                      >
                        <LuUnlink />
                      </IconButton>
                    </RefActionButtonsFlex>
                  </RefQuestionHeader>
                </RefQuestionCard>
              ))}
            </ListContainer>
          ) : (
            <NoReferencesText>
              No questions utilize this context attachment.
            </NoReferencesText>
          )}
        </CommonDialog>

        {/* Question View Modal: Preview of specific question linked to context */}
        <CommonDialog
          open={viewQuestionModalOpen}
          onOpenChange={setViewQuestionModalOpen}
          title="View Question Details"
          maxWidth="700px"
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setViewQuestionModalOpen(false)}>
                Close
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          {questionToView && (
            <QuestionDisplayTabs
              question={questionToView}
              showContext={false}
            />
          )}
        </CommonDialog>

        {/* Edit Modal: Form to modify context title and body */}
        <CommonDialog
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          title="Edit Context Attachment"
          maxWidth="900px"
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setEditModalOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton
                $primary
                onClick={() => handleUpdate(selectedContext)}
              >
                Save Changes
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          {selectedContext && (
            <ContextEditor
              contextId={selectedContext._id}
              initialData={selectedContext}
              onUpdate={(data) => {
                setSelectedContext({ ...selectedContext, ...data });
              }}
              onDetach={() => {}}
              hideDetach={true}
            />
          )}
        </CommonDialog>

        {/* Delete Confirmation Dialog */}
        <CommonDialog
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          title="Confirm Delete"
          description="Are you sure you want to delete this context attachment? This action cannot be undone."
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton
                style={{ background: "#d32f2f", color: "white" }}
                onClick={handleDelete}
              >
                Delete
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>

        {/* Create Modal: Form to add a brand new context attachment */}
        <CommonDialog
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          title="Create Context Attachment"
          maxWidth="900px"
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setCreateModalOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton $primary onClick={handleCreate}>
                Create Context
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          <ContextEditor
            onUpdate={(data) => {
              setNewContext(data);
            }}
            onDetach={() => {}}
            hideDetach={true}
          />
        </CommonDialog>

        {/* Detach Confirmation Dialog: Unlinks a question without deleting it */}
        <CommonDialog
          open={detachModalOpen}
          onOpenChange={setDetachModalOpen}
          title="Confirm Detach"
          description="Are you sure you want to detach this question from the context attachment?"
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setDetachModalOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton
                style={{ background: "#d32f2f", color: "white" }}
                onClick={confirmDetachQuestion}
              >
                Detach
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>
      </PageContainer>
    </Wrapper>
  );
});
export default ContextAttachmentsViewPage;
