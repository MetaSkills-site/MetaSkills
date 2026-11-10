/**
 * FILE: ModuleSelector.jsx
 * PURPOSE: A reusable component for selecting educational modules with support for subjects, search, and infinite scrolling.
 * DEPENDENCIES:
 *   - axios: For handling HTTP requests to fetch modules.
 *   - useInfiniteScroll: Custom hook for implementing infinite scroll logic.
 *   - styled-components: For component-level styling.
 * EXPORTS: ModuleSelector (Default export)
 * INTERCONNECTIONS: Used in administrative forms where module association is required (e.g., creating/editing questions).
 */

import { useEffect, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { IoCheckmarkCircle, IoLibrary, IoSearch } from "react-icons/io5";
import adminApiClient from "../../services/adminApi";
import { API_ENDPOINTS } from "../../api/requestMap";
import toast from "react-hot-toast";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { Flex } from "../../styles/Flex.style";
import EmptyState from "../EmptyState";
import { FormField, FormLabel } from "./AdminStyles";
import SelectInput from "../common/SelectInput";

// Styled Components for the Module Selector interface
const ModuleContainer = styled(Flex)`
  height: 15em;
  overflow-y: auto;
  background: rgba(255, 215, 202, 0.07);
  padding: 15px;
  border-radius: 14px;
  border: solid 2px #ffd8cc80;
  flex-wrap: wrap;
  gap: 10px;
  align-content: flex-start;
`;

const Module = styled.div`
  background: #fff;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  width: -moz-fit-content;
  width: fit-content;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  border: 1px solid transparent;
  font-size: 14px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    border-color: #ff572240;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  margin-bottom: 12px;
`;

const SearchIcon = styled(IoSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 9px 12px 9px 36px;
  border-radius: 10px;
  border: 1.5px solid #eee;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease;
  background: #fff;
  box-sizing: border-box;

  &:focus {
    border-color: #ff5722;
  }

  &::placeholder {
    color: #bbb;
  }
`;

export default function ModuleSelector({
  selectedModules = [],
  onToggleModule,
  multiSelect = true,
  refetchCounter = 0, // Optional prop to force a refresh if external factors change
}) {
  // Component state management
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [subject, setSubject] = useState("english");
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchTerm, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const moduleRef = useRef({});

  // Debounce search input to limit API calls during typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Fetches modules from the backend based on current filters and pagination.
   * @param {boolean} reset - If true, clears the current list and starts from page 1.
   */
  const fetchModules = useCallback(
    async (reset = false) => {
      setLoading(true);
      if (reset) {
        setPage(1);
        setModules([]);
        setHasMore(true);
      }
      const currentPage = reset ? 1 : page;

      try {
        const res = await adminApiClient.post(
          API_ENDPOINTS.getModulesList.url,
          {
            subject,
            limit: 20,
            page: currentPage,
            isComplete: showCompleted ? "all" : "incomplete",
            ...(debouncedSearch && { search: debouncedSearch }),
          },
        );

        const newModules = res.data?.data || [];
        const meta = res.data?.meta;

        // Update module list with newly fetched data
        setModules((prev) => (reset ? newModules : [...prev, ...newModules]));
        // Determine if more pages are available based on meta information or result length
        setHasMore(meta ? meta.page < meta.pages : newModules.length === 20);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch modules");
      } finally {
        setLoading(false);
      }
    },
    [subject, showCompleted, page, debouncedSearch],
  );

  // Re-fetch modules when filters or external refetch trigger changes
  useEffect(() => {
    fetchModules(true);
  }, [subject, showCompleted, refetchCounter, debouncedSearch]);

  // Handle pagination: fetch next page when 'page' state updates
  useEffect(() => {
    if (page > 1) {
      fetchModules(false);
    }
  }, [page, fetchModules]);

  // Sentinel ref for infinite scrolling
  const lastModuleRef = useInfiniteScroll(loading, hasMore, () => {
    setPage((prev) => prev + 1);
  });

  const subjectOptions = [
    { value: "english", label: "English" },
    { value: "maths", label: "Maths" },
  ];

  /**
   * Handles module selection/toggling logic.
   * Supports both single and multi-selection modes.
   */
  const handleToggle = (id) => {
    // Normalize ID to string for consistent comparison
    const idStr = typeof id === "string" ? id : id?.toString();
    if (multiSelect) {
      onToggleModule(idStr);
    } else {
      // In single select mode, toggling the same module deselects it
      if (selectedModules.includes(idStr)) {
        onToggleModule("");
      } else {
        onToggleModule(idStr);
      }
    }
  };

  return (
    <div>
      {/* Subject filter dropdown */}
      <FormField>
        <FormLabel>Subject</FormLabel>
        <SelectInput
          value={subject}
          onValueChange={setSubject}
          options={subjectOptions}
          placeholder="Select subject..."
        />
      </FormField>

      <div style={{ margin: "20px 0" }}>
        {/* Completion filter checkbox */}
        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            id="showCompleted"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              accentColor: "#ff5722",
              marginRight: "8px",
              cursor: "pointer",
            }}
          />
          <label
            htmlFor="showCompleted"
            style={{
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              color: "#555",
            }}
          >
            Include Completed Modules
          </label>
        </div>

        <h3 style={{ marginBottom: 10, fontSize: "16px", color: "#555" }}>
          Available Modules
        </h3>

        {/* Module search input */}
        <SearchWrapper>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchWrapper>

        {/* Conditional rendering for Empty State, Loading, or Module List */}
        {!loading && modules.length === 0 ? (
          <EmptyState
            icon={<IoLibrary />}
            message={
              debouncedSearch
                ? `No modules found for "${debouncedSearch}".`
                : showCompleted
                  ? "No modules found for this subject."
                  : "No incomplete modules found. Check 'Include Completed Modules' to see more."
            }
          />
        ) : loading && modules.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#aaa",
              fontSize: "14px",
            }}
          >
            Loading modules...
          </div>
        ) : (
          <ModuleContainer>
            {modules.map((module, index) => {
              const isLast = index === modules.length - 1;
              const moduleIdStr =
                typeof module._id === "string"
                  ? module._id
                  : module._id?.toString();
              const isSelected = selectedModules
                .map(String)
                .includes(moduleIdStr);

              return (
                <Module
                  key={moduleIdStr}
                  onClick={() => handleToggle(moduleIdStr)}
                  ref={(el) => {
                    moduleRef.current[moduleIdStr] = el;
                    if (isLast) lastModuleRef(el);
                  }}
                  style={{
                    background: isSelected ? "#ff5722" : "#fff",
                    color: isSelected ? "#fff" : "#ff5722",
                  }}
                >
                  <span style={{ marginRight: "8px" }}>{module.name}</span>
                  {/* Selection and Completion indicators */}
                  {isSelected && (
                    <IoCheckmarkCircle
                      size={18}
                      fill="rgba(255, 255, 255, 0.8)"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  {module.isComplete && !isSelected && (
                    <IoCheckmarkCircle
                      size={18}
                      fill="#4caf50"
                      style={{ flexShrink: 0 }}
                      title="Completed"
                    />
                  )}
                </Module>
              );
            })}
          </ModuleContainer>
        )}
      </div>
    </div>
  );
}
