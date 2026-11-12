/**
 * @file PassagesViewPage.jsx
 * @description Administrative dashboard for managing English marathon content including reading passages, sentence practice, and vocabulary entries.
 * @architecture Mounted within the admin routing tree, consumes passagesService with TanStack Query infinite scrolling, and orchestrates modular list and modal views.
 * @agent_note Manages multiple content tabs (passages, sentences, vocabulary) alongside modal dialogs for single and bulk content creation.
 */

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getPassages,
  updatePassage,
  deletePassage,
  bulkCreateSentences,
} from "../../services/passagesService";
import {
  getVocabulary,
  updateVocabulary,
  deleteVocabulary,
  createVocabularyBulk,
} from "../../services/passagesService";
import toast from "react-hot-toast";

import { FaPlus } from "react-icons/fa6";

import {
  Wrapper,
  PageContainer,
  ActionButton,
  ActionButtonsContainer,
} from "../../components/admin/AdminStyles";
import AdminTabs from "../../components/admin/AdminTabs";
import AdminHeader from "../../components/admin/AdminHeader";
import {
  SearchInput,
  SearchContainer,
  FilterButton,
  FilterSectionHeader,
} from "../../components/admin/SearchAndFilter";

// Import extracted components for modularity
import PassagesList from "../../components/admin/passages/PassagesList";
import SentencesList from "../../components/admin/passages/SentencesList";
import VocabularyList from "../../components/admin/passages/VocabularyList";
import PassageModals from "../../components/admin/passages/PassageModals";
import useKeyboardShortcut from "../../hooks/event-hooks/useKeyboardShortcut";
import VocabularyModals from "../../components/admin/passages/VocabularyModals";
import { useAdminAuth } from "../../components/admin/AdminAuthProvider";

// Styled Components for UI layout and elements
const DifficultyFilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const DifficultyFilterBtn = styled.button`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  border: 1px solid ${(props) => (props.$active ? props.$color : props.$border)};
  background: ${(props) => (props.$active ? props.$color : props.$bg)};
  color: ${(props) => (props.$active ? "#fff" : props.$color)};
  transition: all 0.2s;
`;

// Configuration for difficulty bands used in filtering
const DIFFICULTY_BANDS = [
  {
    key: "Easy",
    label: "Easy (<35)",
    color: "#2e7d32",
    bg: "#e8f5e9",
    border: "#c8e6c9",
  },
  {
    key: "Medium",
    label: "Medium (35-60)",
    color: "#ef6c00",
    bg: "#fff3e0",
    border: "#ffe0b2",
  },
  {
    key: "Hard",
    label: "Hard (60-80)",
    color: "#c62828",
    bg: "#ffebee",
    border: "#ffcdd2",
  },
  {
    key: "Very Hard",
    label: "Very Hard (>80)",
    color: "#4a148c",
    bg: "#f3e5f5",
    border: "#e1bee7",
  },
];

/**
 * DifficultyFilter component renders a set of buttons to filter content by difficulty.
 */
const DifficultyFilter = ({
  selectedDifficulty,
  toggleDifficulty,
  setSelectedDifficulty,
}) => (
  <FilterButton active={selectedDifficulty.length}>
    <FilterSectionHeader
      title="Filter by Difficulty"
      showClear={selectedDifficulty.length > 0}
      onClear={() => setSelectedDifficulty([])}
    />
    <DifficultyFilterContainer>
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
    </DifficultyFilterContainer>
  </FilterButton>
);

/**
 * Admin passages management page component providing CRUD and bulk operations for reading passages, sentences, and vocabulary.
 * @component
 * @returns {JSX.Element}
 */
export default function PassagesViewPage() {
  const { adminUser: user } = useAdminAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation and filtering state
  const [activeTab, setActiveTab] = useState("passages");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState([]);

  // Modal visibility and selection state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Debouncing search input to optimize API requests
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(h);
  }, [searchQuery]);

  const queryClient = useQueryClient();

  // Dynamic callback based on activeTab to determine which "Add" modal to open
  const handleGlobalAdd = useCallback(() => {
    if (activeTab === "passages") setCreateModalOpen(true);
    else if (activeTab === "sentences") setBulkModalOpen(true);
    else if (activeTab === "vocabulary") setVocabBulkModalOpen(true);
  }, [activeTab]);

  // Attach global shortcut for "Add" actions
  useKeyboardShortcut({
    key: "+",
    onTrigger: handleGlobalAdd,
    ignoreFormElements: true,
  });

  /**
   * Infinite query for fetching passages and sentences.
   * Resets when activeTab, search, or difficulty changes.
   */
  const {
    data: passagesData,
    isFetching: passageLoading,
    isFetchingNextPage: passageFetchingNext,
    fetchNextPage: fetchNextPassagePage,
    hasNextPage: passageHasMore,
  } = useInfiniteQuery({
    queryKey: [
      "passages",
      {
        type: activeTab,
        search: debouncedSearch,
        difficulty: selectedDifficulty,
      },
    ],
    queryFn: ({ pageParam = 1 }) =>
      getPassages({
        page: pageParam,
        limit: 20,
        search: debouncedSearch,
        type: activeTab === "sentences" ? "sentence" : "passage",
        difficulty:
          selectedDifficulty.length > 0
            ? selectedDifficulty.join(",")
            : undefined,
      }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      return meta && meta.page < meta.pages ? meta.page + 1 : undefined;
    },
    enabled: activeTab === "passages" || activeTab === "sentences",
    staleTime: 30_000,
  });
  const passages = passagesData?.pages.flatMap((p) => p.data || []) ?? [];
  const passageTotal = passagesData?.pages[0]?.meta?.total ?? 0;
  const loading = passageLoading && !passageFetchingNext;

  /**
   * Infinite query for fetching vocabulary items.
   * Separated from passages to allow independent data management.
   */
  const {
    data: vocabData,
    isFetching: vocabLoading,
    isFetchingNextPage: vocabFetchingNext,
    fetchNextPage: fetchNextVocabPage,
    hasNextPage: vocabHasMore,
  } = useInfiniteQuery({
    queryKey: [
      "vocabulary",
      { search: debouncedSearch, difficulty: selectedDifficulty },
    ],
    queryFn: ({ pageParam = 1 }) =>
      getVocabulary({
        page: pageParam,
        limit: 20,
        search: debouncedSearch,
        difficulty:
          selectedDifficulty.length > 0
            ? selectedDifficulty.join(",")
            : undefined,
      }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      return meta && meta.page < meta.pages ? meta.page + 1 : undefined;
    },
    enabled: activeTab === "vocabulary",
    staleTime: 30_000,
  });
  const vocabulary = vocabData?.pages.flatMap((p) => p.data || []) ?? [];
  const vocabTotal = vocabData?.pages[0]?.meta?.total ?? 0;

  // Toggle difficulty selection for filtering
  const toggleDifficulty = (key) => {
    if (selectedDifficulty.includes(key)) {
      setSelectedDifficulty(selectedDifficulty.filter((d) => d !== key));
    } else {
      setSelectedDifficulty([...selectedDifficulty, key]);
    }
  };

  // State management for vocabulary modals and forms
  const [vocabViewModalOpen, setVocabViewModalOpen] = useState(false);
  const [selectedVocab, setSelectedVocab] = useState(null);
  const [vocabEditModalOpen, setVocabEditModalOpen] = useState(false);
  const [vocabDeleteModalOpen, setVocabDeleteModalOpen] = useState(false);
  const [vocabBulkModalOpen, setVocabBulkModalOpen] = useState(false);

  const [vocabBulkText, setVocabBulkText] = useState("");
  const [editVocabForm, setEditVocabForm] = useState({
    word: "",
    definition: "",
  });

  // Infinite scroll refs for triggering next page loads
  const lastPassageElementRef = useInfiniteScroll(
    passageLoading || passageFetchingNext,
    !!passageHasMore,
    fetchNextPassagePage,
  );
  const lastVocabElementRef = useInfiniteScroll(
    vocabLoading || vocabFetchingNext,
    !!vocabHasMore,
    fetchNextVocabPage,
  );

  /**
   * Synchronize active tab with URL search parameters.
   */
  /**
   * Synchronize active tab with URL search parameters.
   * Guarded to prevent redundant state updates when switching manually.
   */
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get("tab");

    if (
      tabParam &&
      ["passages", "sentences", "vocabulary"].includes(tabParam)
    ) {
      if (tabParam !== activeTab) {
        setActiveTab(tabParam);
      }
    } else if (!tabParam) {
      navigate(`?tab=${activeTab}`, { replace: true });
    }
  }, [location.search, navigate, activeTab]);

  // Handle manual tab switching and URL update
  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setSearchQuery("");
    navigate(`?tab=${tab}`, { replace: true });
  };

  // Cache invalidation helpers
  const invalidatePassages = () =>
    queryClient.invalidateQueries({ queryKey: ["passages"] });
  const invalidateVocab = () =>
    queryClient.invalidateQueries({ queryKey: ["vocabulary"] });

  // Mutation for bulk sentence creation
  const bulkCreateMutation = useMutation({
    mutationFn: () => bulkCreateSentences(bulkText),
    onSuccess: (res) => {
      toast.success(res.message || "Sentences added");
      setBulkModalOpen(false);
      setBulkText("");
      invalidatePassages();
    },
    onError: () => toast.error("Failed to add sentences"),
  });
  const handleBulkCreate = () => {
    if (!bulkText.trim()) {
      toast.error("Please enter some text");
      return;
    }
    bulkCreateMutation.mutate();
  };

  // Mutation for updating a single passage
  const updatePassageMutation = useMutation({
    mutationFn: (passageData) => updatePassage(passageData._id, passageData),
    onSuccess: () => {
      toast.success("Passage updated successfully");
      setEditModalOpen(false);
      invalidatePassages();
    },
    onError: () => toast.error("Failed to update passage"),
  });
  const handleUpdate = (passageData) =>
    updatePassageMutation.mutate(passageData);

  // Mutation for deleting a passage
  const deletePassageMutation = useMutation({
    mutationFn: () => deletePassage(selectedPassage._id),
    onSuccess: () => {
      toast.success("Passage deleted successfully");
      setDeleteModalOpen(false);
      invalidatePassages();
    },
    onError: () => toast.error("Failed to delete passage"),
  });
  const handleDelete = () => {
    if (selectedPassage) deletePassageMutation.mutate();
  };

  // Mutation for bulk vocabulary creation
  const vocabBulkMutation = useMutation({
    mutationFn: () => createVocabularyBulk({ text: vocabBulkText }),
    onSuccess: (res) => {
      toast.success(res.message || "Vocabulary added");
      setVocabBulkModalOpen(false);
      setVocabBulkText("");
      invalidateVocab();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add vocabulary"),
  });
  const handleVocabBulkCreate = () => {
    if (!vocabBulkText.trim()) {
      toast.error("Please enter some text");
      return;
    }
    vocabBulkMutation.mutate();
  };

  // Mutation for updating vocabulary entry
  const updateVocabMutation = useMutation({
    mutationFn: () => updateVocabulary(selectedVocab._id, editVocabForm),
    onSuccess: () => {
      toast.success("Vocabulary updated successfully");
      setVocabEditModalOpen(false);
      invalidateVocab();
    },
    onError: () => toast.error("Failed to update vocabulary"),
  });
  const handleVocabUpdate = () => {
    if (!editVocabForm.word || !editVocabForm.definition) {
      toast.error("Word and definition are required");
      return;
    }
    updateVocabMutation.mutate();
  };

  // Mutation for deleting vocabulary entry
  const deleteVocabMutation = useMutation({
    mutationFn: () => deleteVocabulary(selectedVocab._id),
    onSuccess: () => {
      toast.success("Vocabulary deleted");
      setVocabDeleteModalOpen(false);
      invalidateVocab();
    },
    onError: () => toast.error("Failed to delete vocabulary"),
  });
  const handleVocabDelete = () => {
    if (selectedVocab) deleteVocabMutation.mutate();
  };

  // Handlers for opening vocabulary-related modals
  const handleViewVocab = useCallback((vocab) => {
    setSelectedVocab(vocab);
    setVocabViewModalOpen(true);
  }, []);

  const handleEditVocab = useCallback((vocab) => {
    setSelectedVocab(vocab);
    setEditVocabForm({ word: vocab.word, definition: vocab.definition });
    setVocabEditModalOpen(true);
  }, []);

  const handleDeleteVocabClick = useCallback((vocab) => {
    setSelectedVocab(vocab);
    setVocabDeleteModalOpen(true);
  }, []);

  return (
    <Wrapper>
      <PageContainer style={{ maxWidth: "1200px", width: "90%" }}>
        <AdminHeader title="English Marathon Management" backPath="/admin" />

        {/* Tab Strip for navigating between content types using unified AdminTabs */}
        <AdminTabs
          tabs={[
            { id: "passages", label: "Passages" },
            { id: "sentences", label: "Sentences" },
            { id: "vocabulary", label: "Vocabulary" },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
          layoutId="passageNavTabIndicator"
          containerStyle={{ marginBottom: "20px" }}
        />

        {/* Search and Action Bar */}
        <SearchContainer
          count={activeTab === "vocabulary" ? vocabTotal : passageTotal}
          label={
            activeTab === "vocabulary"
              ? "Total Vocabulary"
              : activeTab === "sentences"
                ? "Total Sentences"
                : "Total Passages"
          }
          style={{
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, marginRight: "20px" }}>
            <SearchInput
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {activeTab === "passages" && (
            <ActionButtonsContainer>
              <DifficultyFilter
                selectedDifficulty={selectedDifficulty}
                toggleDifficulty={toggleDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
              />
              <ActionButton onClick={() => setCreateModalOpen(true)}>
                <FaPlus />
                Add New Passage
              </ActionButton>
            </ActionButtonsContainer>
          )}
          {activeTab === "sentences" && (
            <ActionButtonsContainer>
              <DifficultyFilter
                selectedDifficulty={selectedDifficulty}
                toggleDifficulty={toggleDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
              />
              <ActionButton onClick={() => setBulkModalOpen(true)}>
                <FaPlus />
                Add Sentences
              </ActionButton>
            </ActionButtonsContainer>
          )}
          {activeTab === "vocabulary" && (
            <ActionButtonsContainer>
              <DifficultyFilter
                selectedDifficulty={selectedDifficulty}
                toggleDifficulty={toggleDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
              />
              <ActionButton onClick={() => setVocabBulkModalOpen(true)}>
                <FaPlus />
                Add Vocabulary
              </ActionButton>
            </ActionButtonsContainer>
          )}
        </SearchContainer>

        {/* Dynamic List Rendering based on active tab */}
        {activeTab === "passages" && (
          <PassagesList
            passages={passages}
            loading={loading || passageLoading}
            searchQuery={searchQuery}
            onView={(passage) => {
              setSelectedPassage(passage);
              setViewModalOpen(true);
            }}
            onEdit={(passage) => {
              setSelectedPassage(passage);
              setEditModalOpen(true);
            }}
            onDelete={(passage) => {
              setSelectedPassage(passage);
              setDeleteModalOpen(true);
            }}
            lastElementRef={lastPassageElementRef}
          />
        )}

        {activeTab === "sentences" && (
          <SentencesList
            passages={passages}
            loading={loading || passageLoading}
            searchQuery={searchQuery}
            onDelete={(passage) => {
              setSelectedPassage(passage);
              setDeleteModalOpen(true);
            }}
            lastElementRef={lastPassageElementRef}
          />
        )}

        {activeTab === "vocabulary" && (
          <VocabularyList
            vocabulary={vocabulary}
            loading={vocabLoading}
            searchQuery={searchQuery}
            onView={handleViewVocab}
            onEdit={handleEditVocab}
            onDelete={handleDeleteVocabClick}
            lastElementRef={lastVocabElementRef}
          />
        )}

        {/* Modals for Passages/Sentences and Vocabulary CRUD operations */}
        <PassageModals
          user={user}
          viewModalOpen={viewModalOpen}
          setViewModalOpen={setViewModalOpen}
          selectedPassage={selectedPassage}
          createModalOpen={createModalOpen}
          setCreateModalOpen={setCreateModalOpen}
          editModalOpen={editModalOpen}
          setEditModalOpen={setEditModalOpen}
          deleteModalOpen={deleteModalOpen}
          setDeleteModalOpen={setDeleteModalOpen}
          bulkModalOpen={bulkModalOpen}
          setBulkModalOpen={setBulkModalOpen}
          bulkText={bulkText}
          setBulkText={setBulkText}
          onUpdate={handleUpdate}
          onCreate={() => {
            invalidatePassages();
            setCreateModalOpen(false);
          }}
          onBulkCreate={handleBulkCreate}
          onDelete={handleDelete}
          onUpdateLocal={(data) =>
            setSelectedPassage((prev) => ({ ...prev, ...data }))
          }
        />

        <VocabularyModals
          user={user}
          viewModalOpen={vocabViewModalOpen}
          setViewModalOpen={setVocabViewModalOpen}
          selectedVocab={selectedVocab}
          editModalOpen={vocabEditModalOpen}
          setEditModalOpen={setVocabEditModalOpen}
          editVocabForm={editVocabForm}
          setEditVocabForm={setEditVocabForm}
          deleteModalOpen={vocabDeleteModalOpen}
          setDeleteModalOpen={setVocabDeleteModalOpen}
          bulkModalOpen={vocabBulkModalOpen}
          setBulkModalOpen={setVocabBulkModalOpen}
          bulkText={vocabBulkText}
          setBulkText={setVocabBulkText}
          onUpdate={handleVocabUpdate}
          onDelete={handleVocabDelete}
          onBulkCreate={handleVocabBulkCreate}
        />
      </PageContainer>
    </Wrapper>
  );
}
