/**
 * @file ViewAllQuestions.jsx
 * @description Comprehensive admin interface for browsing, filtering, searching, and managing all questions in the system.
 *
 * Dependencies:
 * - @tanstack/react-query: Used for efficient data fetching, caching, and state synchronization.
 * - react-icons: Visual icons for actions and status.
 * - styled-components: For component-level styling and layout.
 * - quizService: API service for question-related operations.
 * - Custom Hooks: useInfiniteScroll, useAdminVirtualizer, useQuestionFetch for UI performance and data management.
 *
 * Exports:
 * - ViewAllQuestions (default): The main functional component for the questions management page.
 *
 * Interconnections:
 * - Communicates with the backend via quizService.
 * - Utilizes various modal components (EditQuestion, QuestionInfoModal, etc.) for specific question operations.
 */

import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import styled from "styled-components";
import { Flex } from "../../styles/Flex.style";
import { Font } from "../../styles/Font.style";
import { FaRegEye, FaPlus } from "react-icons/fa6";
import { LuFileQuestion, LuInfo, LuPencil, LuTrash2 } from "react-icons/lu";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAllQuestions, getQuestionSkills } from "../../services/quizService";
import { SkeletonRect } from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import {
  Wrapper,
  PageContainer,
  QuestionListContainer,
  ActionButton,
  ActionButtonsContainer,
  IconButton,
} from "../../components/admin/AdminStyles";
import useKeyboardShortcut from "../../hooks/event-hooks/useKeyboardShortcut";
import AdminItemCard from "../../components/admin/AdminItemCard";
import AdminHeader from "../../components/admin/AdminHeader";
import {
  ExpandableQuestion,
  DifficultyBadge,
} from "../../utils/adminUtils.jsx";
import Tag from "../../components/common/Tag";

import {
  SearchInput,
  FilterButton,
  SearchContainer,
  FilterSectionHeader,
} from "../../components/admin/SearchAndFilter";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { useAdminVirtualizer } from "../../hooks/useAdminVirtualizer";
import AdminContextMenu from "../../components/admin/AdminContextMenu";
import QuestionActionDialogs from "../../components/admin/QuestionActionDialogs";
import { useAdminAuth } from "../../components/admin/AdminAuthProvider";

/**
 * Styled component for filter chips (tags/skills).
 */
const TagChip = styled.div`
  padding: 4px 10px;
  border-radius: 16px;
  background: ${(props) => (props.$active ? "#ff5722" : "#f5f5f5")};
  color: ${(props) => (props.$active ? "white" : "#666")};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${(props) => (props.$active ? "#ff5722" : "#e0e0e0")};
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? "#e64a19" : "#eeeeee")};
  }
`;

/**
 * Flex wrapper for filter chips with configurable margin.
 */
const FilterChipsWrapper = styled(Flex)`
  gap: 10px;
  flex-wrap: wrap;
  max-width: 250px;
  margin-bottom: ${(props) => props.$mb || "0"};
`;

/**
 * Styled text for empty filter results.
 */
const EmptyFilterText = styled.div`
  color: var(--text-muted, #999);
  font-size: 12px;
`;

/**
 * Specialized button for difficulty filtering with dynamic color mapping.
 */
const DifficultyFilterBtn = styled.div`
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid ${(props) => (props.$active ? props.$color : props.$border)};
  background: ${(props) => (props.$active ? props.$color : props.$bg)};
  color: ${(props) => (props.$active ? "#fff" : props.$color)};
  transition: all 0.15s;
  user-select: none;
`;

/**
 * Displays the index number of a question in the list.
 */
const IndexNumberDisplay = styled(Font)`
  display: block;
  border-right: solid 2px rgba(204, 204, 204, 0.23);
  padding-right: 5px;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  min-width: 20px;
`;

/**
 * Flex container for question metadata (Difficulty, Tags).
 */
const QuestionMetaFlex = styled(Flex)`
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

export default function AllQuestionsViewPage() {
  const { adminUser } = useAdminAuth() || {};

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Attach global shortcut for creating a new question
  useKeyboardShortcut({
    key: "+",
    onTrigger: () => navigate("/admin/questions/add"),
  });

  // Search & Filter State management
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState([]);

  // Question actions state
  const [contextMenuQuestion, setContextMenuQuestion] = useState(null);
  const [viewQuestionOpen, setViewQuestionOpen] = useState(false);
  const [editQuestionOpen, setEditQuestionOpen] = useState(false);
  const [infoQuestionOpen, setInfoQuestionOpen] = useState(false);
  const [deleteQuestionOpen, setDeleteQuestionOpen] = useState(false);
  const [addToModuleOpen, setAddToModuleOpen] = useState(false);

  // Implementation of search debouncing to prevent excessive API calls.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Main data fetching logic using useInfiniteQuery for paginated scrolling.
  const {
    data: questionsData,
    isFetching: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage: hasMore,
  } = useInfiniteQuery({
    queryKey: [
      "allQuestions",
      {
        search: debouncedSearch,
        tags: selectedTags,
        skills: selectedSkills,
        difficulty: selectedDifficulty,
      },
    ],
    queryFn: ({ pageParam = 1 }) =>
      getAllQuestions(
        {},
        {
          page: pageParam,
          limit: 10,
          search: debouncedSearch,
          tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
          skills:
            selectedSkills.length > 0 ? selectedSkills.join(",") : undefined,
          difficulty:
            selectedDifficulty.length > 0
              ? selectedDifficulty.join(",")
              : undefined,
        },
      ),
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      return meta && meta.page < meta.pages ? meta.page + 1 : undefined;
    },
    enabled: !!adminUser,
    staleTime: 30_000,
  });

  // Flat mapping the paginated data for easier iteration.
  const questions = questionsData?.pages.flatMap((p) => p.data || []) ?? [];
  const total = questionsData?.pages[0]?.meta?.total ?? 0;

  // Fetch available skills for the filter dropdown.
  const { data: skillsData } = useQuery({
    queryKey: ["questionSkills"],
    queryFn: () => getQuestionSkills(),
    enabled: !!adminUser,
    staleTime: 10 * 60_000,
  });
  const availableSkillsResolved = skillsData?.data || [];

  // Hook to handle infinite scrolling trigger when reaching the end of the list.
  const lastQuestionRef = useInfiniteScroll(
    loading || isFetchingNextPage,
    !!hasMore,
    fetchNextPage,
  );

  // Virtualization hook to manage large lists by only rendering visible items.
  const { listRef: listParentRef, virtualizer: questionVirtualizer } =
    useAdminVirtualizer({
      count: questions.length,
      estimateSize: 100,
      overscan: 5,
    });

  /**
   * Combines virtualization measurement and infinite scroll intersection observer.
   */
  const getMergedRef = useCallback(
    (isLast) => (el) => {
      questionVirtualizer.measureElement(el);
      if (isLast) lastQuestionRef(el);
    },
    [questionVirtualizer, lastQuestionRef],
  );

  // Derive unique tags from the current set of fetched questions for the filter UI.
  const allTags = useMemo(() => {
    const tags = new Set();
    questions.forEach((q) => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [questions]);

  // Filter toggle handlers
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Difficulty level configuration for UI rendering.
  const DIFFICULTY_BANDS = [
    {
      key: "easy",
      label: "Easy",
      color: "#2e7d32",
      bg: "#e8f5e9",
      border: "#c8e6c9",
    },
    {
      key: "medium",
      label: "Medium",
      color: "#ef6c00",
      bg: "#fff3e0",
      border: "#ffe0b2",
    },
    {
      key: "hard",
      label: "Hard",
      color: "#c62828",
      bg: "#ffebee",
      border: "#ffcdd2",
    },
    {
      key: "veryhard",
      label: "Very Hard",
      color: "#4a148c",
      bg: "#f3e5f5",
      border: "#e1bee7",
    },
  ];

  const toggleDifficulty = (key) => {
    if (selectedDifficulty.includes(key)) {
      setSelectedDifficulty(selectedDifficulty.filter((d) => d !== key));
    } else {
      setSelectedDifficulty([...selectedDifficulty, key]);
    }
  };

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader title="All Questions" backPath="/admin" />

        {/* Search and filtering interface */}
        <SearchContainer count={total} label="Total Questions">
          <SearchInput
            placeholder="Search all questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <ActionButtonsContainer>
            <ActionButton onClick={() => navigate("/admin/questions/add")}>
              <FaPlus /> New Question
            </ActionButton>
          </ActionButtonsContainer>

          <FilterButton
            active={
              selectedTags.length +
              selectedSkills.length +
              selectedDifficulty.length
            }
          >
            {/* Tags section */}
            <FilterSectionHeader
              title="Filter by Tags"
              showClear={selectedTags.length > 0}
              onClear={() => setSelectedTags([])}
            />
            <FilterChipsWrapper $mb="16px">
              {allTags.map((tag) => (
                <TagChip
                  key={tag}
                  $active={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </TagChip>
              ))}
            </FilterChipsWrapper>

            {/* Skills section */}
            <FilterSectionHeader
              title="Filter by Skills"
              showClear={selectedSkills.length > 0}
              onClear={() => setSelectedSkills([])}
            />
            <FilterChipsWrapper>
              {availableSkillsResolved.map((skill) => (
                <TagChip
                  key={skill}
                  $active={selectedSkills.includes(skill)}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </TagChip>
              ))}
              {availableSkillsResolved.length === 0 && (
                <EmptyFilterText>No skills available.</EmptyFilterText>
              )}
            </FilterChipsWrapper>

            {/* Difficulty section */}
            <FilterSectionHeader
              title="Filter by Difficulty"
              showClear={selectedDifficulty.length > 0}
              onClear={() => setSelectedDifficulty([])}
            />
            <FilterChipsWrapper>
              {DIFFICULTY_BANDS.map(({ key, label, color, bg, border }) => (
                <DifficultyFilterBtn
                  key={key}
                  onClick={() => toggleDifficulty(key)}
                  $active={selectedDifficulty.includes(key)}
                  $color={color}
                  $bg={bg}
                  $border={border}
                >
                  {label}
                </DifficultyFilterBtn>
              ))}
            </FilterChipsWrapper>
          </FilterButton>
        </SearchContainer>

        <QuestionListContainer>
          {/* Skeleton loaders for initial data fetch */}
          {loading &&
            questions.length === 0 &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ marginBottom: "20px" }}>
                <SkeletonRect $height="100px" $borderRadius="12px" />
              </div>
            ))}

          {/* Fallback UI when no questions match the filters */}
          {!loading && questions.length === 0 && (
            <EmptyState
              message="No questions found"
              icon={<LuFileQuestion />}
            />
          )}

          {/* Virtualized list rendering for performance optimization */}
          {questions.length > 0 && (
            <div
              ref={listParentRef}
              style={{
                height: questionVirtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {questionVirtualizer.getVirtualItems().map((vRow) => {
                const q = questions[vRow.index];
                const isLast = vRow.index === questions.length - 1;
                return (
                  <div
                    key={vRow.key}
                    data-index={vRow.index}
                    ref={getMergedRef(isLast)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${
                        vRow.start - questionVirtualizer.options.scrollMargin
                      }px)`,
                      paddingBottom: "12px",
                    }}
                  >
                    <AdminContextMenu
                      items={[
                        {
                          label: "View Question",
                          icon: <FaRegEye />,
                          onClick: () => {
                            setContextMenuQuestion(q);
                            setViewQuestionOpen(true);
                          },
                        },
                        {
                          label: "Edit Question",
                          icon: <LuPencil />,
                          onClick: () => {
                            setContextMenuQuestion(q);
                            setEditQuestionOpen(true);
                          },
                        },
                        {
                          label: "Add to Modules",
                          icon: <FaPlus />,
                          onClick: () => {
                            setContextMenuQuestion(q);
                            setAddToModuleOpen(true);
                          },
                        },
                        {
                          label: "Question Info",
                          icon: <LuInfo />,
                          onClick: () => {
                            setContextMenuQuestion(q);
                            setInfoQuestionOpen(true);
                          },
                        },
                        {
                          type: "separator",
                        },
                        {
                          label: "Delete Question",
                          icon: <LuTrash2 />,
                          danger: true,
                          onClick: () => {
                            setContextMenuQuestion(q);
                            setDeleteQuestionOpen(true);
                          },
                        },
                      ]}
                    >
                      <AdminItemCard
                        icon={
                          <IndexNumberDisplay
                            $weight={700}
                            $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
                          >
                            {vRow.index + 1}
                          </IndexNumberDisplay>
                        }
                        title={
                          <ExpandableQuestion
                            html={q.question?.slate || q.question?.html}
                          />
                        }
                        subtitle={
                          <QuestionMetaFlex>
                            <DifficultyBadge difficulty={q.displayDifficulty} />
                            {q.skills?.length > 0 &&
                              q.skills.map((skill) => (
                                <Tag
                                  key={skill}
                                  label={skill}
                                  active
                                  style={{ fontSize: "11px" }}
                                />
                              ))}
                          </QuestionMetaFlex>
                        }
                        actions={
                          <Flex style={{ gap: "10px" }}>
                            <IconButton
                              onClick={() => {
                                setContextMenuQuestion(q);
                                setInfoQuestionOpen(true);
                              }}
                              title="Question Info"
                            >
                              <LuInfo />
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                setContextMenuQuestion(q);
                                setViewQuestionOpen(true);
                              }}
                              title="View Question"
                            >
                              <FaRegEye />
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                setContextMenuQuestion(q);
                                setEditQuestionOpen(true);
                              }}
                              title="Edit Question"
                            >
                              <LuPencil />
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                setContextMenuQuestion(q);
                                setAddToModuleOpen(true);
                              }}
                              title="Add to Module"
                            >
                              <FaPlus />
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                setContextMenuQuestion(q);
                                setDeleteQuestionOpen(true);
                              }}
                              $danger
                              title="Delete"
                            >
                              <LuTrash2 />
                            </IconButton>
                          </Flex>
                        }
                      />
                    </AdminContextMenu>
                  </div>
                );
              })}
              {/* Infinite scroll loading indicator */}
              {loading && questions.length > 0 && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  Loading more...
                </div>
              )}
            </div>
          )}
        </QuestionListContainer>

        {/* Dialogs */}
        <QuestionActionDialogs
          question={contextMenuQuestion}
          viewOpen={viewQuestionOpen}
          setViewOpen={setViewQuestionOpen}
          editOpen={editQuestionOpen}
          setEditOpen={setEditQuestionOpen}
          infoOpen={infoQuestionOpen}
          setInfoOpen={setInfoQuestionOpen}
          deleteOpen={deleteQuestionOpen}
          setDeleteOpen={setDeleteQuestionOpen}
          addToModuleOpen={addToModuleOpen}
          setAddToModuleOpen={setAddToModuleOpen}
          token={adminUser?.token}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
          }}
        />
      </PageContainer>
    </Wrapper>
  );
}
