/**
 * @file ModulesViewPage.jsx
 * @description Admin component for browsing, searching, and filtering learning modules (English/Maths).
 * Implements infinite scrolling and virtualization for performance with large datasets.
 *
 * @dependencies
 * - @tanstack/react-query: For efficient data fetching, caching, and infinite pagination.
 * - react-router-dom: For navigation and URL-based tab state management.
 * - styled-components: For component-specific styling.
 * - react-icons: For visual indicators and buttons.
 * - quizService: API service for fetching module data.
 * - ModuleContext: For sharing selected module state across the admin flow.
 * - useAdminVirtualizer: Custom hook for virtualizing the module list.
 * - useInfiniteScroll: Custom hook for trigger-based pagination.
 *
 * @exports
 * - ViewModules (default): The main functional component for the module management view.
 *
 * @interconnections
 * - Navigates to module-specific question views via react-router.
 * - Integrates with AddModule for creating new content.
 * - Uses AdminHeader and AdminStyles for consistent dashboard layout.
 */

import { useState, useEffect, useCallback } from "react";
import { useAdminVirtualizer } from "../../hooks/useAdminVirtualizer";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { Flex } from "../../styles/Flex.style";
// Kept Font as it might be used, though I didn't see it in body, better safe or re-check. Wait, I checked and it wasn't used.
import { IoIosArrowForward } from "react-icons/io";
import { TbListLetters } from "react-icons/tb";
import { PiCalendarDotsBold } from "react-icons/pi";
import { FaThList } from "react-icons/fa";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getModules } from "../../services/quizService";
import { LuPencil, LuTrash2, LuPlus } from "react-icons/lu";
import { AddModule } from "../../components/ModuleEditor.jsx";
import GradeSelector from "../../components/common/GradeSelector";
import { useModule } from "../../context/ModuleContext.jsx";
import { SkeletonRect } from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import AdminItemCard from "../../components/admin/AdminItemCard";
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
  FilterButton,
  SearchContainer,
} from "../../components/admin/SearchAndFilter";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import useKeyboardShortcut from "../../hooks/event-hooks/useKeyboardShortcut";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import AdminContextMenu from "../../components/admin/AdminContextMenu";
import ModuleActionDialogs from "../../components/admin/ModuleActionDialogs";
import { useAdminAuth } from "../../components/admin/AdminAuthProvider";

/**
 * Wrapper for the gradient border effect on module cards.
 */
const ModuleItemWrapper = styled.div`
  background: linear-gradient(45deg, #f44336, #ff5722);
  padding-bottom: 2px;
  border-radius: 16px;
  box-shadow: 0 0 6px -2px #84260938;
`;

/**
 * Customized version of AdminItemCard with specific hover and transition effects.
 */
const StyledModuleCard = styled(AdminItemCard)`
  padding: 30px;
  border-radius: 16px; /* Inherit doesn't work well over component boundaries sometimes, explicit is safer or inherit */
  border-radius: inherit;
  margin-bottom: 0; /* Wrapper handles spacing via ModuleList gap */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: 500ms;

  &:hover {
    transform: translateY(-8px);
    scale: 1.01 1.005;
    box-shadow: 0 4px 3px 0px rgba(65, 19, 5, 0.22);
    border-color: transparent; /* Override AdminItemCard orange border */
  }
`;

/**
 * Subject-based navigation tabs.
 */
/**
 * Layout components for the filter popover/dropdown.
 */
const FilterHeaderFlex = styled.div`
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FilterTitle = styled.span`
  font-weight: bold;
  color: var(--text-primary, #333);
`;

const ClearFilterBtn = styled.button`
  border: none;
  background: none;
  color: var(--color-primary, #ff5722);
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
`;

const FilterSectionTitle = styled.div`
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: bold;
  color: var(--text-primary, #333);
`;

/**
 * Clickable status filter chips (All, Completed, Incomplete).
 */
const StatusFilterChip = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  border: 1px solid
    ${(props) => (props.$active ? "var(--color-primary, #ff5722)" : "#eee")};
  background: ${(props) =>
    props.$active ? "var(--color-primary, #ff5722)" : "#f9f9f9"};
  color: ${(props) => (props.$active ? "#fff" : "var(--text-secondary, #555)")};
  text-transform: capitalize;
  transition: all 0.2s;
`;

const MetaIconBase = `
  color: rgb(211, 64, 19);
  width: 26px;
  height: 26px;
`;

const StyledListIcon = styled(TbListLetters)`
  ${MetaIconBase}
`;
const StyledCalendarIcon = styled(PiCalendarDotsBold)`
  ${MetaIconBase}
`;
const StyledCompletedIcon = styled(IoCheckmarkDoneCircle)`
  ${MetaIconBase}
`;

const MetaText = styled.span`
  font-weight: bolder;
  color: rgb(216, 64, 18);
`;

const GradesBadge = styled.span`
  font-size: 12px;
  background: var(--badge-bg-red, #ffebee);
  padding: 2px 8px;
  border-radius: 4px;
  color: #d32f2fca;
  font-weight: bold;
`;

const ArrowIcon = styled(IoIosArrowForward)`
  margin: auto;
  width: 40px;
  height: 40px;
  fill: var(--color-primary, #ff5722);
  stroke: var(--color-primary, #ff5722);
  stroke-width: 10px;
  stroke-linejoin: round;
`;

export default function ModulesViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("english");
  const { setModule } = useModule();

  const [contextMenuModule, setContextMenuModule] = useState(null);
  const [editModuleOpen, setEditModuleOpen] = useState(false);
  const [deleteModuleOpen, setDeleteModuleOpen] = useState(false);

  const { adminUser } = useAdminAuth() || {};
  const [dialogOpen, setDialogOpen] = useState(false);

  /**
   * Sync active tab with URL query parameters on mount or navigation.
   */
  /**
   * Sync active tab with URL query parameters on mount or navigation.
   * Guarded to prevent double rerenders when the state is already correct.
   */
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get("tab");

    if (tabParam && ["english", "maths"].includes(tabParam)) {
      if (tabParam !== activeTab) {
        setActiveTab(tabParam);
      }
    } else if (!tabParam) {
      // If no tab in URL, ensure the current activeTab state is reflected in the URL
      navigate(`?tab=${activeTab}`, { replace: true });
    }
  }, [location.search, activeTab, navigate]);

  /**
   * Handles switching between English and Maths tabs, resetting search.
   */
  // Attach global shortcut for creating a new module
  useKeyboardShortcut({
    key: "+",
    onTrigger: () => setDialogOpen(true),
  });

  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setSearchQuery("");
    navigate(`?tab=${tab}`, { replace: true });
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [filterCompleted, setFilterCompleted] = useState("all"); // 'all', 'completed', 'incomplete'

  /**
   * Debounce search input to prevent excessive API calls while typing.
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const queryClient = useQueryClient();

  /**
   * Data fetching hook using @tanstack/react-query.
   * Manages caching, background fetching, and infinite pagination.
   * queryKey includes filters to automatically reset and refetch on change.
   */
  const {
    data: modulesData,
    isFetching: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage: hasMore,
  } = useInfiniteQuery({
    queryKey: [
      "modules",
      {
        subject: activeTab,
        search: debouncedSearch,
        grades: selectedGrades,
        isComplete: filterCompleted,
      },
    ],
    queryFn: ({ pageParam = 1 }) =>
      getModules(
        {},
        {
          subject: activeTab,
          page: pageParam,
          limit: 10,
          search: debouncedSearch,
          grades: selectedGrades,
          isComplete: filterCompleted,
        },
      ),
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      return meta && meta.page < meta.pages ? meta.page + 1 : undefined;
    },
    enabled: !!adminUser,
    staleTime: 30_000,
  });

  // Flatten paginated pages into a single array for rendering
  const modules = modulesData?.pages.flatMap((p) => p.data || []) ?? [];
  const total = modulesData?.pages[0]?.meta?.total ?? 0;

  /**
   * Infinite scroll observer: triggers fetchNextPage when the last element enters the viewport.
   */
  const lastModuleRef = useInfiniteScroll(
    loading || isFetchingNextPage,
    !!hasMore,
    fetchNextPage,
  );

  /**
   * Virtualizer setup for performance optimization.
   * Only renders items currently visible in the viewport.
   */
  const { listRef: listParentRef, virtualizer: moduleVirtualizer } =
    useAdminVirtualizer({
      count: modules.length,
      estimateSize: 140,
      overscan: 4,
    });

  /**
   * Merges virtualization ref with infinite scroll ref for the last item in the list.
   */
  const getMergedRef = useCallback(
    (isLast) => (el) => {
      moduleVirtualizer.measureElement(el);
      if (isLast) lastModuleRef(el);
    },
    [moduleVirtualizer, lastModuleRef],
  );

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader title="Modules" backPath="/admin/view-content" />

        <Flex style={{ justifyContent: "flex-end", marginBottom: "10px" }}>
          {/* Subject-based navigation tabs using unified AdminTabs */}
          <AdminTabs
            tabs={[
              { id: "english", label: "English" },
              { id: "maths", label: "Maths" },
            ]}
            activeTab={activeTab}
            onChange={handleTabChange}
            layoutId="modulesSubjectTabIndicator"
          />
        </Flex>

        <SearchContainer
          style={{ marginTop: "20px", justifyContent: "space-between" }}
          count={total}
          label="Total Modules"
        >
          <div style={{ flex: 1, marginRight: "20px" }}>
            <SearchInput
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ActionButtonsContainer>
            <AddModule
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              loading={loading}
              setLoading={() => {}}
              onSuccess={() =>
                queryClient.invalidateQueries({ queryKey: ["modules"] })
              }
            >
              <ActionButton>
                <LuPlus /> New Module
              </ActionButton>
            </AddModule>
          </ActionButtonsContainer>

          <FilterButton active={selectedGrades.length}>
            <FilterHeaderFlex>
              <FilterTitle>Filter by Grade</FilterTitle>
              {selectedGrades.length > 0 && (
                <ClearFilterBtn
                  onClick={() => setSelectedGrades([])}
                  aria-label="Clear grade filters"
                >
                  Clear
                </ClearFilterBtn>
              )}
            </FilterHeaderFlex>
            <GradeSelector setGrades={setSelectedGrades} />

            <FilterSectionTitle>Filter by Status</FilterSectionTitle>
            <Flex style={{ gap: "10px", flexWrap: "wrap" }}>
              {["all", "completed", "incomplete"].map((status) => (
                <StatusFilterChip
                  key={status}
                  onClick={() => setFilterCompleted(status)}
                  $active={filterCompleted === status}
                >
                  {status}
                </StatusFilterChip>
              ))}
            </Flex>
          </FilterButton>
        </SearchContainer>

        {/* Empty state when no data matches criteria */}
        {!loading && modules.length === 0 && (
          <EmptyState
            message={`No ${activeTab} modules found matching your criteria.`}
            icon={<FaThList />}
          />
        )}

        {/* Virtualized scroll container: absolutely positions items based on scroll offset */}
        {(modules.length > 0 || loading) && (
          <div
            ref={listParentRef}
            style={{
              height: moduleVirtualizer.getTotalSize(),
              position: "relative",
              minHeight: "200px",
            }}
          >
            {moduleVirtualizer.getVirtualItems().map((vRow) => {
              const module = modules[vRow.index];
              const isLast = vRow.index === modules.length - 1;
              if (!module) return null;

              return (
                <div
                  key={module._id || vRow.key}
                  data-index={vRow.index}
                  ref={getMergedRef(isLast)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${
                      vRow.start - moduleVirtualizer.options.scrollMargin
                    }px)`,
                    paddingBottom: "20px",
                  }}
                >
                  <ModuleItemWrapper>
                    <AdminContextMenu
                      items={[
                        {
                          label: "Edit Module",
                          icon: <LuPencil />,
                          onClick: () => {
                            setContextMenuModule(module);
                            setEditModuleOpen(true);
                          },
                        },
                        {
                          label: "Delete Module",
                          icon: <LuTrash2 />,
                          danger: true,
                          onClick: () => {
                            setContextMenuModule(module);
                            setDeleteModuleOpen(true);
                          },
                        },
                      ]}
                    >
                      <StyledModuleCard
                        onClick={() => {
                          setModule(module);
                          navigate("../questions");
                        }}
                        title={
                          <span style={{ fontSize: "25px", fontWeight: "900" }}>
                            {module.name}
                          </span>
                        }
                        meta={
                          <Flex
                            style={{
                              gap: "20px",
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <Flex style={{ gap: "10px", alignItems: "center" }}>
                              <StyledListIcon />
                              <MetaText>
                                {module.questionIds?.filter((q) => q.active)
                                  .length || 0}
                              </MetaText>
                            </Flex>
                            <Flex style={{ gap: "10px", alignItems: "center" }}>
                              <StyledCalendarIcon />
                              <MetaText>
                                {new Date(module.updatedAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </MetaText>
                            </Flex>
                            {module.isComplete && (
                              <Flex>
                                <StyledCompletedIcon title="Completed" />
                              </Flex>
                            )}
                            {module.grades && module.grades.length > 0 && (
                              <Flex style={{ gap: "8px" }}>
                                <GradesBadge>
                                  Grades: {module.grades.join(", ")}
                                </GradesBadge>
                              </Flex>
                            )}
                          </Flex>
                        }
                        actions={<ArrowIcon />}
                      />
                    </AdminContextMenu>
                  </ModuleItemWrapper>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading skeletons for infinite scrolling when fetching next page */}
        {loading &&
          modules.length > 0 &&
          Array.from({ length: 3 }).map((_, i) => (
            <ModuleItemWrapper key={`loading-${i}`}>
              <StyledModuleCard
                title={
                  <SkeletonRect $width="40%" $height="30px" $radius="4px" />
                }
                meta={
                  <SkeletonRect $width="60%" $height="20px" $radius="4px" />
                }
              />
            </ModuleItemWrapper>
          ))}

        <ModuleActionDialogs
          module={contextMenuModule}
          editOpen={editModuleOpen}
          setEditOpen={setEditModuleOpen}
          deleteOpen={deleteModuleOpen}
          setDeleteOpen={setDeleteModuleOpen}
          token={adminUser?.token}
          setGlobalModule={setModule}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["modules"] })
          }
        />
      </PageContainer>
    </Wrapper>
  );
}
