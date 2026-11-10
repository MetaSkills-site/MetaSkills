/**
 * ActiveSessions.jsx
 *
 * PURPOSE:
 * Provides an administrative interface for monitoring and managing active user sessions.
 * Admins can view who is currently online, inspect user profiles, and terminate
 * (suspend) individual or all active sessions to force logouts.
 *
 * DEPENDENCIES:
 * - @tanstack/react-query: For real-time session monitoring and data synchronization.
 * - radix-ui: Specifically for accessible Avatar components.
 * - react-icons: For UI visual cues (server status, sort, eye, trash).
 * - adminService: To interface with backend session management endpoints.
 * - CommonDialog: For confirmation-heavy operations like bulk logout.
 *
 * EXPORTS:
 * - ActiveSessions (default): The main functional component for the session manager.
 *
 * INTERCONNECTIONS:
 * - Accessed from the Admin main navigation menu.
 * - Triggers backend invalidation of the 'adminSessions' query upon session termination.
 */

import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CommonDialog from "../../components/common/CommonDialog";
import {
  Wrapper,
  PageContainer,
  DialogButtonGroup,
  DialogButton,
  FormField,
  FormLabel,
  IconButton,
} from "../../components/admin/AdminStyles";
import {
  SearchInput,
  SearchContainer,
} from "../../components/admin/SearchAndFilter";
import AdminHeader from "../../components/admin/AdminHeader";
import EmptyState from "../../components/EmptyState";
import { SkeletonRect, SkeletonCircle } from "../../components/SkeletonLoader";
import ProfilePicture from "../../components/ProfilePicture";
import { Avatar } from "radix-ui";
import {
  FaServer,
  FaSortAmountDown,
  FaSortAmountUp,
  FaRegEye,
} from "react-icons/fa";
import { LuTrash2 } from "react-icons/lu";

import {
  getSessions,
  deleteSession,
  deleteAllSessions,
  getUserById,
} from "../../services/adminService";

// ── Styled Components ───────────────────────────────────────────────────────

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

const SessionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-weight: 700;
  font-size: 16px;
  color: #333;
`;

const SessionDate = styled.span`
  font-size: 13px;
  color: #666;
`;

const ViewButton = styled(IconButton)`
  color: #2196f3;
  margin-right: 5px;
  &:hover {
    background: #e3f2fd;
  }
`;

const AvatarRoot = styled(Avatar.Root)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  overflow: hidden;
  user-select: none;
  width: 80px;
  height: 80px;
  border-radius: 100%;
  background-color: #f3f4f6;
  margin-right: 20px;
  border: 2px solid #ff5722;
`;

const AvatarImage = styled(Avatar.Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
`;

const AvatarFallback = styled(Avatar.Fallback)`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  color: #ff5722;
  font-size: 24px;
  font-weight: 600;
`;

const ModalFlex = styled.div`
  display: flex;
  align-items: flex-start;
`;

const HeaderControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #555;
  font-weight: 600;
  font-size: 13px;

  &:hover {
    background: #f5f5f5;
  }
`;

const ClearAllButton = styled.button`
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
  padding: 8px 15px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: #ffcdd2;
  }
`;

export default function ActiveSessionsPage() {
  // Safe authentication token retrieval

  const queryClient = useQueryClient();

  // ── UI Control States ─────────────────────────────────────────────────────

  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Confirmation dialog visibility and target state
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);

  // User Inspection Modal state
  const [viewUserId, setViewUserId] = useState(null);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);

  // Timer to synchronize modal animations and prevent flickering on close
  const viewUserTimerRef = useRef(null);
  const CLOSE_DELAY = 300;

  // ── Data Fetching ─────────────────────────────────────────────────────────

  /**
   * Continuous query to fetch all currently active sessions from the server.
   */
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["adminSessions"],
    queryFn: () => getSessions(),
  });

  /**
   * On-demand query to fetch detailed profile information for a specific user
   * when they are selected for inspection in the modal.
   */
  const { data: viewUser, isLoading: userLoading } = useQuery({
    queryKey: ["adminUser", viewUserId],
    queryFn: () => getUserById(viewUserId),
    enabled: !!viewUserId,
    select: (res) => res?.data ?? res,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Terminate a specific session.
   */
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSessions"] });
      toast.success("Session suspended");
      setIsDeleteOpen(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to suspend session");
    },
    onSettled: () => setDeleteSessionId(null),
  });

  /**
   * Terminate ALL sessions on the platform.
   */
  const clearAllMutation = useMutation({
    mutationFn: () => deleteAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSessions"] });
      toast.success("All sessions cleared");
      setIsClearAllOpen(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to clear sessions");
    },
  });

  // Lifecycle cleanup for close-animation timer
  useEffect(() => {
    return () => clearTimeout(viewUserTimerRef.current);
  }, []);

  // ── Client-side Data Processing ──────────────────────────────────────────

  /**
   * Filter sessions based on case-insensitive search across name and email.
   */
  const filteredSessions = sessions.filter(
    (session) =>
      (session.id?.fullname || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (session.id?.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  /**
   * Sort sessions by their creation date (active since).
   */
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortAsc ? dateA - dateB : dateB - dateA;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * Open the individual session suspension dialog.
   */
  const confirmDelete = (id) => {
    setDeleteSessionId(id);
    setIsDeleteOpen(true);
  };

  /**
   * Open the user inspection modal and trigger the background profile fetch.
   */
  const handleViewUser = (userId) => {
    if (!userId) return;
    setViewUserId(userId);
    setIsViewUserOpen(true);
  };

  /**
   * Closes the user inspection modal with a small delay before clearing the ID
   * to ensure smooth UI transitions during the close animation.
   */
  const handleCloseViewUser = () => {
    setIsViewUserOpen(false);
    // Clear any existing timer to avoid overlapping state updates
    if (viewUserTimerRef.current) {
      clearTimeout(viewUserTimerRef.current);
    }
    viewUserTimerRef.current = setTimeout(() => {
      setViewUserId(null);
      viewUserTimerRef.current = null;
    }, CLOSE_DELAY);
  };

  const actionLoading =
    deleteSessionMutation.isPending || clearAllMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader title="Active Sessions" backPath="/admin" />

        <SearchContainer
          style={{ marginBottom: "20px" }}
          count={filteredSessions.length}
          label="Active Sessions"
        >
          <SearchInput
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        {/* Sorting and bulk action bar */}
        <HeaderControls>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <SortButton onClick={() => setSortAsc(!sortAsc)}>
              {sortAsc ? <FaSortAmountUp /> : <FaSortAmountDown />}
              Sort by Date
            </SortButton>
            <span style={{ fontSize: "13px", color: "#666", fontWeight: 600 }}>
              {sessions.length} Active Session{sessions.length !== 1 ? "s" : ""}
            </span>
          </div>
          {sessions.length > 0 && (
            <ClearAllButton onClick={() => setIsClearAllOpen(true)}>
              Clear All Sessions
            </ClearAllButton>
          )}
        </HeaderControls>

        {/* List of active sessions with status indicators */}
        <SessionList>
          {isLoading ? (
            /* Loading state skeletons */
            Array.from({ length: 5 }).map((_, i) => (
              <SessionItem key={i}>
                <UserInfo>
                  <SkeletonCircle $size="40px" />
                  <UserDetails>
                    <SkeletonRect $width="120px" $height="16px" $mb="5px" />
                    <SkeletonRect $width="80px" $height="12px" />
                  </UserDetails>
                </UserInfo>
                <SkeletonCircle $size="30px" />
              </SessionItem>
            ))
          ) : sessions.length > 0 ? (
            /* Map through sorted session data */
            sortedSessions.map((session) => (
              <SessionItem key={session._id}>
                <UserInfo>
                  {session.id ? (
                    <ProfilePicture
                      user={session.id}
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "16px",
                      }}
                      shadow={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "#eee",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                  <UserDetails>
                    <UserName>
                      {session.id?.fullname || "Unknown User"}
                    </UserName>
                    <SessionDate>
                      Active since{" "}
                      {new Date(session.createdAt).toLocaleDateString()} at{" "}
                      {new Date(session.createdAt).toLocaleTimeString()}
                    </SessionDate>
                  </UserDetails>
                </UserInfo>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Inspection and suspension buttons */}
                  <ViewButton
                    onClick={() => handleViewUser(session.id?._id)}
                    title="View User Details"
                  >
                    <FaRegEye />
                  </ViewButton>
                  <IconButton
                    onClick={() => confirmDelete(session._id)}
                    title="Suspend Session"
                  >
                    <LuTrash2 />
                  </IconButton>
                </div>
              </SessionItem>
            ))
          ) : (
            /* Zero-state illustration */
            <EmptyState
              message="No active sessions found."
              icon={<FaServer size={48} />}
            />
          )}
        </SessionList>

        {/* Confirmation Modal: Suspend Individual Session */}
        <CommonDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Suspend Session?"
          description="Are you sure you want to suspend this user's session? They will be logged out immediately."
          footer={
            <DialogButtonGroup>
              <DialogButton
                disabled={actionLoading}
                onClick={() => setIsDeleteOpen(false)}
              >
                Cancel
              </DialogButton>
              <DialogButton
                $danger
                onClick={() => deleteSessionMutation.mutate(deleteSessionId)}
                disabled={actionLoading}
              >
                {deleteSessionMutation.isPending ? "Suspending..." : "Suspend"}
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>

        {/* Confirmation Modal: Bulk Session Termination */}
        <CommonDialog
          open={isClearAllOpen}
          onOpenChange={setIsClearAllOpen}
          title="Clear All Sessions?"
          description="This will log out ALL users (except potentially you, depending on token validity). Are you absolutely sure?"
          footer={
            <DialogButtonGroup>
              <DialogButton
                disabled={actionLoading}
                onClick={() => setIsClearAllOpen(false)}
              >
                Cancel
              </DialogButton>
              <DialogButton
                $danger
                onClick={() => clearAllMutation.mutate()}
                disabled={actionLoading}
              >
                {clearAllMutation.isPending ? "Clearing..." : "Clear All"}
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>

        {/* Inspection Modal: Detailed User Profile View */}
        <CommonDialog
          open={isViewUserOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseViewUser();
          }}
          title="User Details"
          description="View detailed information about this user."
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={handleCloseViewUser}>Close</DialogButton>
            </DialogButtonGroup>
          }
        >
          {userLoading ? (
            /* User profile loading state */
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
                padding: "10px 0",
              }}
            >
              <SkeletonCircle $size="80px" />
              <div style={{ flex: 1 }}>
                <SkeletonRect $width="60%" $height="20px" $mb="10px" />
                <SkeletonRect $width="80%" $height="16px" $mb="10px" />
                <SkeletonRect $width="40%" $height="16px" />
              </div>
            </div>
          ) : viewUser ? (
            /* Populated user profile view */
            <ModalFlex>
              <div style={{ flexShrink: 0 }}>
                <AvatarRoot>
                  <AvatarImage
                    src={viewUser.profilePicture || ""}
                    alt={viewUser.fullname}
                  />
                  <AvatarFallback delayMs={600}>
                    {viewUser.fullname?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </AvatarRoot>
              </div>
              <div style={{ flexGrow: 1 }}>
                <FormField>
                  <FormLabel>Name</FormLabel>
                  <div>{viewUser.fullname}</div>
                </FormField>
                <FormField>
                  <FormLabel>Email</FormLabel>
                  <div>{viewUser.email}</div>
                </FormField>
                <FormField>
                  <FormLabel>Grade</FormLabel>
                  <div>{viewUser.grade || "N/A"}</div>
                </FormField>
                <FormField>
                  <FormLabel>Carrots</FormLabel>
                  <div>{viewUser.carrots?.count ?? 0}</div>
                </FormField>
              </div>
            </ModalFlex>
          ) : (
            <div>User not found</div>
          )}
        </CommonDialog>
      </PageContainer>
    </Wrapper>
  );
}
