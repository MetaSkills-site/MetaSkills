/**
 * FILE: ViewQuestions.jsx
 * PURPOSE: Administrative view for managing questions within a specific module, including search, filter, edit, and delete functionalities.
 * DEPENDENCIES:
 *   - useQuery: TanStack Query hook for data synchronization.
 *   - quizService: API services for question and module operations.
 *   - ModuleContext: Provides the currently selected module context.
 *   - AdminUtils: Shared utility components like ExpandableQuestion and DifficultyBadge.
 * EXPORTS: ViewQuestions (Default export)
 * INTERCONNECTIONS: Directly linked from the module management page; interacts with EditQuestion and QuestionInfo modals.
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Flex } from "../../styles/Flex.style";
import { FaRegEye, FaPlus } from "react-icons/fa";
import {
  LuFileQuestion,
  LuInfo,
  LuPencil,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";
import {
  ExpandableQuestion,
  DifficultyBadge,
  QuestionNumber,
} from "../../utils/adminUtils";
import Tag from "../../components/common/Tag";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useModule } from "../../context/ModuleContext.jsx";
import { SkeletonRect } from "../../components/SkeletonLoader";
import { getQuestionsByModule } from "../../services/quizService";

import styled from "styled-components";
import {
  Wrapper,
  PageContainer,
  ActionButton,
  ActionButtonsContainer,
  QuestionListContainer,
  IconButton,
} from "../../components/admin/AdminStyles";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminItemCard from "../../components/admin/AdminItemCard";
import EmptyState from "../../components/EmptyState";
import {
  SearchInput,
  FilterButton,
  SearchContainer,
  FilterSectionHeader,
} from "../../components/admin/SearchAndFilter";
import AdminContextMenu from "../../components/admin/AdminContextMenu";
import useKeyboardShortcut from "../../hooks/event-hooks/useKeyboardShortcut";
import ModuleActionDialogs from "../../components/admin/ModuleActionDialogs";
import QuestionActionDialogs from "../../components/admin/QuestionActionDialogs";
// Styled Components for Question Filtering and Display
const TagChip = styled.div`
  padding: 4px 10px;
  border-radius: 16px;
  background: ${(props) =>
    props.$active ? "var(--color-primary, #ff5722)" : "#f5f5f5"};
  color: ${(props) =>
    props.$active ? "var(--text-inverse, white)" : "var(--text-muted, #666)"};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid
    ${(props) => (props.$active ? "var(--color-primary, #ff5722)" : "#e0e0e0")};
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$active ? "var(--color-primary-light, #e64a19)" : "#eeeeee"};
  }
`;

const FilterChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: ${(props) => (props.$withMargin ? "16px" : "0")};
`;

const DifficultyFilterChip = styled.div`
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid
    ${(props) => (props.$selected ? props.$color : props.$border)};
  background: ${(props) => (props.$selected ? props.$color : props.$bg)};
  color: ${(props) => (props.$selected ? "#fff" : props.$color)};
  transition: all 0.15s;
  user-select: none;
`;

const OrderBadge = styled.span`
  font-size: 12px;
  font-weight: bold;
  background: var(--badge-bg-red, #ffebee);
  padding: 2px 8px;
  border-radius: 4px;
  color: #d32f2fca;
  display: inline-block;
  margin-top: 8px;
`;

export default function QuestionsViewPage() {
  const { module, setModule } = useModule();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search and filter criteria states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState([]);

  // Module actions state
  const [editModuleOpen, setEditModuleOpen] = useState(false);
  const [deleteModuleOpen, setDeleteModuleOpen] = useState(false);

  // Question actions state
  const [contextMenuQuestion, setContextMenuQuestion] = useState(null);
  const [viewQuestionOpen, setViewQuestionOpen] = useState(false);
  const [editQuestionOpen, setEditQuestionOpen] = useState(false);
  const [infoQuestionOpen, setInfoQuestionOpen] = useState(false);
  const [deleteQuestionOpen, setDeleteQuestionOpen] = useState(false);
  const [addToModuleOpen, setAddToModuleOpen] = useState(false);

  // Attach global shortcut for adding a question to this module
  useKeyboardShortcut({
    key: "+",
    onTrigger: () => setAddToModuleOpen(true),
    ignoreFormElements: true,
  });

  // Auth and module existence guard
  useEffect(() => {
    if (!module?._id) {
      navigate("/admin/modules", { replace: true });
    }
  }, [module, navigate]);

  // Ensure MathLive (math-field) is registered as a custom element for LaTeX rendering
  useEffect(() => {
    if (!window.customElements.get("math-field")) {
      import("mathlive").then(({ MathfieldElement }) => {
        if (!window.customElements.get("math-field")) {
          window.customElements.define("math-field", MathfieldElement);
        }
      });
    }
  }, []);

  // ── Queries ──
  // Fetch questions associated with the currently selected module
  const { data, isLoading } = useQuery({
    queryKey: ["moduleQuestions", module?._id],
    queryFn: () => getQuestionsByModule(module._id),
    enabled: !!module?._id,
  });

  const questions = data?.data ?? [];

  // Extract unique tags from the question list for the filter UI
  const allTags = useMemo(() => {
    const tags = new Set();
    questions.forEach((q) => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [questions]);

  // Extract unique skills from the question list for the filter UI
  const allSkills = useMemo(() => {
    const skills = new Set();
    questions.forEach((q) => {
      if (q.skills && Array.isArray(q.skills)) {
        q.skills.forEach((s) => skills.add(s));
      }
    });
    return Array.from(skills).sort();
  }, [questions]);

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

  // Configuration for difficulty bands used in filtering
  const DIFFICULTY_BANDS = [
    {
      key: "easy",
      label: "Easy",
      color: "#2e7d32",
      bg: "#e8f5e9",
      border: "#c8e6c9",
      max: 35,
    },
    {
      key: "medium",
      label: "Medium",
      color: "#ef6c00",
      bg: "#fff3e0",
      border: "#ffe0b2",
      min: 36,
      max: 60,
    },
    {
      key: "hard",
      label: "Hard",
      color: "#c62828",
      bg: "#ffebee",
      border: "#ffcdd2",
      min: 61,
      max: 80,
    },
    {
      key: "veryhard",
      label: "Very Hard",
      color: "#4a148c",
      bg: "#f3e5f5",
      border: "#e1bee7",
      min: 81,
    },
  ];

  const toggleDifficulty = (key) => {
    if (selectedDifficulty.includes(key)) {
      setSelectedDifficulty(selectedDifficulty.filter((d) => d !== key));
    } else {
      setSelectedDifficulty([...selectedDifficulty, key]);
    }
  };

  /**
   * Helper function to map numeric difficulty to a string key for filtering.
   */
  const getDifficultyKey = (d) => {
    if (d == null) return null;
    if (d <= 35) return "easy";
    if (d <= 60) return "medium";
    if (d <= 80) return "hard";
    return "veryhard";
  };

  // Perform client-side filtering based on search query, tags, skills, and difficulty
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      (q.question?.html || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (q._id || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      (q.tags && selectedTags.some((tag) => q.tags.includes(tag)));

    const matchesSkills =
      selectedSkills.length === 0 ||
      (q.skills && selectedSkills.some((s) => q.skills.includes(s)));

    const matchesDifficulty =
      selectedDifficulty.length === 0 ||
      selectedDifficulty.includes(getDifficultyKey(q.displayDifficulty));

    return matchesSearch && matchesTags && matchesSkills && matchesDifficulty;
  });

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader
          title={module ? module.name : "Questions"}
          backPath="/admin/modules"
        />

        {/* Global search and multi-level filter controls */}
        <SearchContainer count={questions.length} label="Total Questions">
          <SearchInput
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <ActionButtonsContainer>
            <ActionButton onClick={() => setAddToModuleOpen(true)}>
              <LuPlus /> Add Question
            </ActionButton>
          </ActionButtonsContainer>

          <FilterButton
            active={
              selectedTags.length +
              selectedSkills.length +
              selectedDifficulty.length
            }
          >
            {/* Filter by Tags section */}
            <FilterSectionHeader
              title="Filter by Tags"
              showClear={selectedTags.length > 0}
              onClear={() => setSelectedTags([])}
            />
            <FilterChipContainer $withMargin>
              {allTags.map((tag) => (
                <TagChip
                  key={tag}
                  $active={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </TagChip>
              ))}
              {allTags.length === 0 && (
                <div style={{ color: "#999", fontSize: "12px" }}>
                  No tags found in current questions.
                </div>
              )}
            </FilterChipContainer>

            {/* Filter by Skills section */}
            <FilterSectionHeader
              title="Filter by Skills"
              showClear={selectedSkills.length > 0}
              onClear={() => setSelectedSkills([])}
            />
            <FilterChipContainer>
              {allSkills.map((skill) => (
                <TagChip
                  key={skill}
                  $active={selectedSkills.includes(skill)}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </TagChip>
              ))}
              {allSkills.length === 0 && (
                <div style={{ color: "#999", fontSize: "12px" }}>
                  No skills found in current questions.
                </div>
              )}
            </FilterChipContainer>

            {/* Filter by Difficulty section */}
            <FilterSectionHeader
              title="Filter by Difficulty"
              showClear={selectedDifficulty.length > 0}
              onClear={() => setSelectedDifficulty([])}
            />
            <FilterChipContainer>
              {DIFFICULTY_BANDS.map(({ key, label, color, bg, border }) => (
                <DifficultyFilterChip
                  key={key}
                  onClick={() => toggleDifficulty(key)}
                  $selected={selectedDifficulty.includes(key)}
                  $color={color}
                  $bg={bg}
                  $border={border}
                >
                  {label}
                </DifficultyFilterChip>
              ))}
            </FilterChipContainer>
          </FilterButton>
        </SearchContainer>

        {/* Module-level actions: Edit and Delete */}
        {module && (
          <ActionButtonsContainer
            style={{
              margin: "10px 0 20px auto",
              width: "fit-content",
            }}
          >
            <ActionButton onClick={() => setEditModuleOpen(true)}>
              <LuPencil /> Edit Module
            </ActionButton>
            <ActionButton $danger onClick={() => setDeleteModuleOpen(true)}>
              <LuTrash2 /> Delete Module
            </ActionButton>
          </ActionButtonsContainer>
        )}

        {/* List of questions with individual management actions */}
        <QuestionListContainer>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <AdminItemCard
                key={i}
                icon={<SkeletonRect $width="30px" $height="30px" />}
                title={<SkeletonRect $width="100%" $height="60px" />}
              />
            ))
          ) : filteredQuestions.length > 0 ? (
            filteredQuestions.map((question, index) => (
              <AdminContextMenu
                key={question._id}
                items={[
                  {
                    label: "View Question",
                    icon: <FaRegEye />,
                    onClick: () => {
                      setContextMenuQuestion(question);
                      setViewQuestionOpen(true);
                    },
                  },
                  {
                    label: "Edit Question",
                    icon: <LuPencil />,
                    onClick: () => {
                      setContextMenuQuestion(question);
                      setEditQuestionOpen(true);
                    },
                  },
                  {
                    label: "Add to Modules",
                    icon: <FaPlus />,
                    onClick: () => {
                      setContextMenuQuestion(question);
                      setAddToModuleOpen(true);
                    },
                  },
                  {
                    label: "Question Info",
                    icon: <LuInfo />,
                    onClick: () => {
                      setContextMenuQuestion(question);
                      setInfoQuestionOpen(true);
                    },
                  },
                  {
                    type: "separator",
                  },
                  {
                    label: "Detach from Module",
                    icon: <LuTrash2 />,
                    danger: true,
                    onClick: () => {
                      setContextMenuQuestion(question);
                      setDeleteQuestionOpen(true);
                    },
                  },
                ]}
              >
                <AdminItemCard
                  icon={
                    <QuestionNumber
                      $weight={700}
                      $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
                    >
                      {index + 1}
                    </QuestionNumber>
                  }
                  title={
                    <ExpandableQuestion
                      html={question.question?.slate || question.question?.html}
                    />
                  }
                  subtitle={
                    <Flex
                      style={{
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <OrderBadge>Order: {index + 1}</OrderBadge>
                      <DifficultyBadge
                        difficulty={question.displayDifficulty}
                      />
                      {question.skills?.length > 0 &&
                        question.skills.map((skill) => (
                          <Tag
                            key={skill}
                            label={skill}
                            active
                            style={{ fontSize: "11px", marginTop: "8px" }}
                          />
                        ))}
                    </Flex>
                  }
                  actions={
                    <Flex style={{ gap: "10px" }}>
                      <IconButton
                        onClick={() => {
                          setContextMenuQuestion(question);
                          setInfoQuestionOpen(true);
                        }}
                        title="Question Info"
                      >
                        <LuInfo />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setContextMenuQuestion(question);
                          setViewQuestionOpen(true);
                        }}
                        title="View Question"
                      >
                        <FaRegEye />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setContextMenuQuestion(question);
                          setEditQuestionOpen(true);
                        }}
                        title="Edit Question"
                      >
                        <LuPencil />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setContextMenuQuestion(question);
                          setDeleteQuestionOpen(true);
                        }}
                        $danger
                        title="Detach"
                      >
                        <LuTrash2 />
                      </IconButton>
                    </Flex>
                  }
                />
              </AdminContextMenu>
            ))
          ) : (
            <EmptyState
              message="No questions found matching your criteria."
              icon={<LuFileQuestion />}
            />
          )}
        </QuestionListContainer>

        {/* Dialogs */}
        <ModuleActionDialogs
          module={module}
          editOpen={editModuleOpen}
          setEditOpen={setEditModuleOpen}
          deleteOpen={deleteModuleOpen}
          setDeleteOpen={setDeleteModuleOpen}
          setGlobalModule={setModule}
        />

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
          isDetach={true}
          moduleId={module?._id}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["moduleQuestions", module?._id],
            });
          }}
        />
      </PageContainer>
    </Wrapper>
  );
}
