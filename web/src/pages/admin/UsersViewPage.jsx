/**
 * FILE: ViewUsers.jsx
 * PURPOSE: Administrative interface for user management, featuring virtualized infinite scrolling, search, and grade-based filtering.
 * DEPENDENCIES:
 *   - useInfiniteQuery: TanStack Query hook for efficient paginated data fetching.
 *   - useAdminVirtualizer: Custom hook for windowing long lists to maintain performance.
 *   - adminService: API services for user-related CRUD operations.
 *   - react-hot-toast: For displaying success/error notifications.
 * EXPORTS: ViewUsers (Default export)
 * INTERCONNECTIONS: Serves as the primary entry point for managing user accounts and viewing their activity history.
 */

import { IconButton } from "../../components/admin/AdminStyles";
import { useState, useCallback, useEffect } from "react";
import { Flex } from "../../styles/Flex.style";
import { useAdminVirtualizer } from "../../hooks/useAdminVirtualizer";

import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { Font } from "../../styles/Font.style";
import {
  Wrapper,
  PageContainer,
  DialogButtonGroup,
  DialogButton,
  FormField,
  FormLabel,
  FormInput,
} from "../../components/admin/AdminStyles";
import CommonDialog from "../../components/common/CommonDialog";
import SelectInput from "../../components/common/SelectInput";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getUsers, updateUser, deleteUser } from "../../services/adminService";
import toast from "react-hot-toast";

import { FaHistory } from "react-icons/fa";
import { FaRegEye } from "react-icons/fa6";
import { LuPencil, LuTrash2, LuUserX } from "react-icons/lu";
import { MdError } from "react-icons/md";
import { SkeletonRect, SkeletonCircle } from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import AdminHeader from "../../components/admin/AdminHeader";
import GradeSelector from "../../components/common/GradeSelector";
import { IoGrid, IoList } from "react-icons/io5";
import AdminItemCard from "../../components/admin/AdminItemCard";
import ProfilePicture from "../../components/ProfilePicture";
import {
  SearchInput,
  FilterButton,
  SearchContainer,
  FilterSectionHeader,
} from "../../components/admin/SearchAndFilter";
import Badge from "../../components/common/Badge";

// Styled Components for User List and View Toggles
const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

const ViewToggleContainer = styled.div`
  display: flex;
  background: #fff;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-top: 10px;
  width: -moz-fit-content;
  width: fit-content;
  margin-left: auto;
`;

const ViewToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: ${(props) =>
    props.$active ? "rgba(255, 87, 34, 0.1)" : "transparent"};
  color: ${(props) => (props.$active ? "#ff5722" : "#666")};
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-family: inherit;

  &:hover {
    background: ${(props) =>
      props.$active ? "rgba(255, 87, 34, 0.15)" : "rgba(0,0,0,0.03)"};
  }
`;

import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { useAdminAuth } from "../../components/admin/AdminAuthProvider";

export default function UsersViewPage() {
  const navigate = useNavigate();
  // Retrieve admin user details from local storage for authentication
  const { authenticated } = useAdminAuth() || {};

  // UI and selection states
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [viewMode, setViewMode] = useState("compact"); // 'compact' for list, 'details' for grid-like view

  // Safeguard delete states: incorporates a countdown to prevent accidental deletions
  const [deleteTimer, setDeleteTimer] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state for editing user details
  const [editForm, setEditForm] = useState({
    fullname: "",
    email: "",
    grade: "",
  });

  const queryClient = useQueryClient();

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Mutation for updating user information
  const editMutation = useMutation({
    mutationFn: async () => {
      const { _id } = selectedUser;
      const payload = { ...editForm };
      return updateUser(_id, payload);
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsEditOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update user");
    },
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editMutation.mutate();
  };
  const saving = editMutation.isPending;

  // Debounce search input to minimize API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Cleanup delete timer on unmount or when modal closes
  useEffect(() => {
    if (!isDeleteOpen && deleteTimer) {
      clearInterval(deleteTimer);
      setDeleteTimer(null);
    }
    return () => {
      if (deleteTimer) clearInterval(deleteTimer);
    };
  }, [isDeleteOpen, deleteTimer]);

  /**
   * Infinite query for fetching users with search and grade filters.
   * Resets when filters change.
   */
  const {
    data: usersData,
    isFetching: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage: hasMore,
  } = useInfiniteQuery({
    queryKey: ["users", { search: debouncedSearch, grades: selectedGrades }],
    queryFn: ({ pageParam = 1 }) =>
      getUsers({
        page: pageParam,
        limit: 10,
        search: debouncedSearch,
        grades: selectedGrades,
      }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      if (!meta) return undefined;
      return meta.page < meta.pages ? meta.page + 1 : undefined;
    },
    enabled: authenticated,
    staleTime: 30_000,
  });

  // Consolidate paginated user data into a flat array
  const users = usersData?.pages.flatMap((p) => p.data || []) ?? [];
  const total = usersData?.pages[0]?.meta?.total ?? 0;

  // Ref for triggering infinite scroll
  const lastUserRef = useInfiniteScroll(
    loading || isFetchingNextPage,
    !!hasMore,
    fetchNextPage,
  );

  // virtualization setup for the user list to handle large datasets
  const { listRef: listParentRef, virtualizer: userVirtualizer } =
    useAdminVirtualizer({ count: users.length, estimateSize: 72, overscan: 5 });

  /**
   * Merges virtualizer measurement with the infinite scroll sentinel.
   */
  const getMergedRef = useCallback(
    (isLast) => (el) => {
      userVirtualizer.measureElement(el);
      if (isLast) lastUserRef(el);
    },
    [userVirtualizer, lastUserRef],
  );

  const handleView = (user) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullname: user.fullname || "",
      email: user.email || "",
      grade: user.grade || "",
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
    setCountdown(5);
    setIsDeleting(false);
    if (deleteTimer) clearInterval(deleteTimer);
  };

  /**
   * Initiates the multi-step deletion process with a visible countdown.
   */
  const startDeleteProcess = () => {
    setIsDeleting(true);
    let count = 5;
    setCountdown(count);

    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        executeDelete();
      }
    }, 1000);
    setDeleteTimer(timer);
  };

  // Mutation for deleting a user account
  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(selectedUser._id),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsDeleteOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const executeDelete = () => deleteMutation.mutate();

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader title="User Management" backPath="/admin" />

        {/* Search bar and grade filter dropdown */}
        <SearchContainer count={total} label="Total Users">
          <SearchInput
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <FilterButton active={selectedGrades.length}>
            <FilterSectionHeader
              title="Filter by Grade"
              showClear={selectedGrades.length > 0}
              onClear={() => setSelectedGrades([])}
            />
            <GradeSelector
              grades={selectedGrades}
              setGrades={setSelectedGrades}
            />
          </FilterButton>
        </SearchContainer>

        {/* Toggle buttons for switching between Compact and Details view */}
        <ViewToggleContainer>
          <ViewToggleButton
            $active={viewMode === "compact"}
            onClick={() => setViewMode("compact")}
          >
            <IoList /> Compact
          </ViewToggleButton>
          <ViewToggleButton
            $active={viewMode === "details"}
            onClick={() => setViewMode("details")}
          >
            <IoGrid /> Details
          </ViewToggleButton>
        </ViewToggleContainer>

        {/* Initial loading state with skeleton loaders */}
        {loading && users.length === 0 && (
          <UserList style={{ marginTop: "20px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <AdminItemCard
                key={i}
                icon={<SkeletonCircle $size="50px" />}
                title={
                  <SkeletonRect $width="60%" $height="20px" $radius="4px" />
                }
                subtitle={
                  <SkeletonRect $width="40%" $height="16px" $radius="4px" />
                }
              />
            ))}
          </UserList>
        )}

        {/* Empty state when no users match the criteria */}
        {!loading && users.length === 0 && (
          <EmptyState
            message="No users found matching your criteria."
            icon={<LuUserX />}
          />
        )}

        {/* Virtualized scroll container for the user list */}
        {users.length > 0 && (
          <div
            ref={listParentRef}
            style={{
              height: userVirtualizer.getTotalSize(),
              position: "relative",
              marginTop: "20px",
            }}
          >
            {userVirtualizer.getVirtualItems().map((vRow) => {
              const user = users[vRow.index];
              const isLast = vRow.index === users.length - 1;
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
                      vRow.start - userVirtualizer.options.scrollMargin
                    }px)`,
                    paddingBottom: "10px",
                  }}
                >
                  <AdminItemCard
                    icon={
                      viewMode === "details" ? (
                        <ProfilePicture
                          user={user}
                          style={{
                            width: "40px",
                            height: "40px",
                            fontSize: "16px",
                          }}
                          shadow={false}
                        />
                      ) : (
                        <Font
                          $weight={700}
                          $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
                          style={{
                            display: "block",
                            borderRight: "solid 2px rgba(204, 204, 204, 0.23)",
                            paddingRight: "5px",
                            width: "fit-content",
                            height: "fit-content",
                            minWidth: "20px",
                          }}
                        >
                          {vRow.index + 1}
                        </Font>
                      )
                    }
                    title={
                      <Flex style={{ gap: "8px", alignItems: "center" }}>
                        <span>{user.fullname}</span>
                        {!user.grade && (
                          <MdError
                            title="User has not completed profile"
                            style={{
                              color: "#f44336",
                              fontSize: "18px",
                            }}
                          />
                        )}
                      </Flex>
                    }
                    subtitle={
                      viewMode === "details" && (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "4px",
                          }}
                        >
                          <Badge
                            bg="#e3f2fd"
                            color="#1565c0"
                            padding="4px 8px"
                            radius="6px"
                            fontSize="12px"
                            fontWeight="600"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {user.email}
                          </Badge>
                          {user.grade && (
                            <Badge
                              bg="#fff3e0"
                              color="#ef6c00"
                              padding="4px 8px"
                              radius="6px"
                              fontSize="12px"
                              fontWeight="600"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              Grade {user.grade}
                            </Badge>
                          )}
                          {!user.grade && (
                            <Badge
                              bg="#ffebee"
                              color="#c62828"
                              padding="4px 8px"
                              radius="6px"
                              fontSize="12px"
                              fontWeight="600"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <MdError /> Incomplete Profile
                            </Badge>
                          )}
                        </div>
                      )
                    }
                    actions={
                      <Flex style={{ gap: "10px" }}>
                        <IconButton
                          onClick={() => handleView(user)}
                          title="View"
                        >
                          <FaRegEye />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            navigate(`/admin/users/${user._id}/history`)
                          }
                          title="History"
                          style={{ color: "#2196f3" }}
                        >
                          <FaHistory />
                        </IconButton>
                        <IconButton
                          onClick={() => handleEdit(user)}
                          title="Edit"
                        >
                          <LuPencil />
                        </IconButton>
                        <IconButton
                          $danger
                          onClick={() => handleDeleteClick(user)}
                          title="Delete"
                        >
                          <LuTrash2 />
                        </IconButton>
                      </Flex>
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
        {/* Load-more skeletons during infinite scroll */}
        {isFetchingNextPage &&
          users.length > 0 &&
          Array.from({ length: 3 }).map((_, i) => (
            <AdminItemCard
              key={`loading-${i}`}
              icon={<SkeletonCircle $size="50px" />}
              title={<SkeletonRect $width="60%" $height="20px" $radius="4px" />}
            />
          ))}

        {/* Read-only User Details Modal */}
        <CommonDialog
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          title="User Details"
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setIsViewOpen(false)}>
                Close
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          {selectedUser && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <ProfilePicture
                user={selectedUser}
                style={{
                  width: "80px",
                  height: "80px",
                  flexShrink: 0,
                  marginRight: "20px",
                }}
                shadow={false}
              />
              <div style={{ textAlign: "center" }}>
                <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>
                  {selectedUser.fullname}
                </h3>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  {selectedUser.email}
                </p>
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  {selectedUser.grade != null && (
                    <span
                      style={{
                        fontSize: "12px",
                        background: "#e0f2f1",
                        color: "#00695c",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      Grade {selectedUser.grade}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      background: "#fff3e0",
                      color: "#e65100",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedUser.carrots?.count || 0} Carrots
                  </span>
                </div>
              </div>
            </div>
          )}
        </CommonDialog>

        {/* Modal for Editing User profile */}
        <CommonDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit User"
        >
          <form onSubmit={handleEditSubmit}>
            <FormField>
              <FormLabel>Full Name</FormLabel>
              <FormInput
                type="text"
                name="fullname"
                value={editForm.fullname}
                onChange={handleEditChange}
                required
              />
            </FormField>
            <FormField>
              <FormLabel>Email</FormLabel>
              <FormInput
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                required
              />
            </FormField>
            <FormField>
              <FormLabel>Grade</FormLabel>
              <SelectInput
                value={String(editForm.grade || "")}
                onValueChange={(val) =>
                  setEditForm({ ...editForm, grade: val })
                }
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: String(i + 1),
                  label: `Grade ${i + 1}`,
                }))}
                placeholder="Select Grade"
              />
            </FormField>

            <DialogButtonGroup>
              <DialogButton type="button" onClick={() => setIsEditOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton type="submit" $primary disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </DialogButton>
            </DialogButtonGroup>
          </form>
        </CommonDialog>

        {/* High-stakes User Deletion Modal with countdown */}
        <CommonDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Delete User"
          description="This action cannot be undone. This will permanently delete the user account and remove their data from our servers."
          footer={
            <DialogButtonGroup>
              {!isDeleting ? (
                <>
                  <DialogButton onClick={() => setIsDeleteOpen(false)}>
                    Cancel
                  </DialogButton>
                  <DialogButton $danger onClick={startDeleteProcess}>
                    Delete
                  </DialogButton>
                </>
              ) : (
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    color: "#d32f2f",
                    fontWeight: "bold",
                  }}
                >
                  Deleting in {countdown}...
                </div>
              )}
            </DialogButtonGroup>
          }
        >
          <div
            style={{
              background: "#ffebee",
              padding: "15px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#d32f2f",
              marginBottom: "20px",
            }}
          >
            <MdError size={24} />
            <div>
              <strong>Warning:</strong> You are about to delete user{" "}
              <strong>{selectedUser?.fullname}</strong>.
            </div>
          </div>
        </CommonDialog>
      </PageContainer>
    </Wrapper>
  );
}
