/**
 * @file NotificationsManagementPage.jsx
 * @description Administrative interface for creating, viewing, and deleting system-wide notifications for users.
 * @dependencies
 *   - axios: For making API requests to the notification management endpoints.
 *   - useInfiniteScroll: Custom hook for paginated notification lists.
 *   - SlateRenderer: For displaying rich-text notification content.
 *   - Editor: Rich-text editor for composing notification content.
 * @exports NotificationsManagementPage (Default export)
 * @interconnections Directly accessible from the admin dashboard; interacts with the backend notification service.
 */

import { useState, useEffect } from "react";
import styled from "styled-components";
import { toast } from "react-hot-toast";
import CommonDialog from "../../components/common/CommonDialog";
import Editor from "../../components/Editor/Editor";
import useKeyboardShortcut from "../../hooks/event-hooks/useKeyboardShortcut";
import {
  Wrapper,
  PageContainer,
  ActionButton,
  ActionButtonsContainer,
  DialogButtonGroup,
  DialogButton,
  FormInput,
  FormLabel,
  FormField,
  IconButton,
} from "../../components/admin/AdminStyles";
import AdminHeader from "../../components/admin/AdminHeader";
import {
  SearchInput,
  SearchContainer,
} from "../../components/admin/SearchAndFilter";
import { LuTrash2, LuPlus, LuBell } from "react-icons/lu";
import { FaRegEye } from "react-icons/fa6";
import { Flex } from "../../styles/Flex.style";
import EmptyState from "../../components/EmptyState";

import AdminItemCard from "../../components/admin/AdminItemCard";

// Styled Components for Notification Display
const NotificationTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #333;
  font-weight: 700;
  font-size: 1.1rem;
`;

const NotificationContent = styled.div`
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
  max-height: 100px;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40px;
    background: linear-gradient(to bottom, transparent, white);
    pointer-events: none;
  }

  p {
    margin: 0;
  }
`;

import SlateRenderer from "../../components/SlateRenderer";

import adminApiClient from "../../services/adminApi";
import { API_ENDPOINTS } from "../../api/requestMap";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { SkeletonRect } from "../../components/admin/AdminDashboardView";

export default function NotificationsManagementPage() {
  // State for notification list and interaction modals
  const [notifications, setNotifications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // Initial empty state for the Slate editor
  const initialSlate = [{ type: "paragraph", children: [{ text: "" }] }];
  const [newContent, setNewContent] = useState(initialSlate);
  const [loading, setLoading] = useState(true);

  // Deletion and View states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [notificationToView, setNotificationToView] = useState(null);

  // Pagination and search states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial data fetch and refetch on search change
  useEffect(() => {
    fetchNotifications(true);
  }, [debouncedSearch]);

  /**
   * Fetches notifications from the backend with pagination support.
   * @param {boolean} reset - If true, clears the current list and restarts from page 1.
   */
  const fetchNotifications = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setNotifications([]);
      setHasMore(true);
    }

    try {
      const res = await adminApiClient.get(
        API_ENDPOINTS.getAdminNotifications.url,
        {
          params: {
            page: reset ? 1 : page,
            limit: 10,
            search: debouncedSearch,
          },
        },
      );

      const newNotifications = res.data.data || [];
      const meta = res.data.meta;

      setNotifications((prev) =>
        reset ? newNotifications : [...prev, ...newNotifications],
      );
      // Determine if more pages exist based on backend meta or result length
      setHasMore(
        meta ? meta.page < meta.pages : newNotifications.length === 10,
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
      setLoading(false);
    }
  };

  // Trigger next page fetch when the 'page' state increments
  useEffect(() => {
    if (page > 1) {
      fetchNotifications(false);
    }
  }, [page]);

  // Sentinel ref for infinite scroll trigger
  const lastNotificationRef = useInfiniteScroll(loading, hasMore, () => {
    setPage((prev) => prev + 1);
  });

  /**
   * Validates and submits a new notification to the backend.
   */
  // Attach global shortcut for creating a new notification
  useKeyboardShortcut({
    key: "+",
    onTrigger: () => setIsModalOpen(true),
  });

  const handleCreate = async () => {
    // Basic validation for title and rich-text content presence
    const hasText = newContent.some(
      (n) =>
        n.children && n.children.some((c) => c.text && c.text.trim() !== ""),
    );
    if (!newTitle || !hasText) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await adminApiClient.post(
        API_ENDPOINTS.createAdminNotification.url,
        { title: newTitle, content: newContent }, // Content sent as Slate JSON
      );

      toast.success("Notification created");
      setIsModalOpen(false);
      setNewTitle("");
      setNewContent(initialSlate);
      fetchNotifications(true);
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Error creating notification");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the deletion of a selected notification.
   */
  const handleDelete = async () => {
    if (!notificationToDelete) return;

    setLoading(true);
    try {
      await adminApiClient.delete(API_ENDPOINTS.deleteAdminNotification.url, {
        data: {
          notificationId: notificationToDelete._id,
          clearSeen: false,
        },
      });

      toast.success("Notification deleted");
      setDeleteModalOpen(false);
      fetchNotifications(true);
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Error deleting notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader title="Manage Notifications" backPath="/admin" />

        {/* Search bar and Action buttons */}
        <SearchContainer
          count={notifications.length}
          label="Total Notifications"
          style={{ justifyContent: "space-between" }}
        >
          <div style={{ flex: 1, marginRight: "20px" }}>
            <SearchInput
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ActionButtonsContainer>
            <ActionButton onClick={() => setIsModalOpen(true)}>
              <LuPlus /> Create Notification
            </ActionButton>
          </ActionButtonsContainer>
        </SearchContainer>

        {/* Main notification list display area */}
        <div style={{ marginTop: "20px" }}>
          {/* Loading skeleton state */}
          {loading && notifications.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <AdminItemCard
                key={i}
                title={
                  <SkeletonRect $width="60%" $height="22px" $radius="4px" />
                }
                subtitle={
                  <SkeletonRect $width="100%" $height="16px" $radius="4px" />
                }
                meta={
                  <SkeletonRect $width="100px" $height="14px" $radius="4px" />
                }
              />
            ))
          ) : notifications.length === 0 ? (
            <EmptyState message="No notifications found." icon={<LuBell />} />
          ) : (
            <>
              {/* Render notification cards */}
              {notifications.map((notif, index) => {
                const isLast = index === notifications.length - 1;
                return (
                  <div
                    ref={isLast ? lastNotificationRef : null}
                    key={notif._id}
                  >
                    <AdminItemCard
                      title={
                        <NotificationTitle>{notif.title}</NotificationTitle>
                      }
                      subtitle={
                        <NotificationContent>
                          <SlateRenderer slate={notif.content} />
                        </NotificationContent>
                      }
                      meta={
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#999",
                            marginTop: "5px",
                          }}
                        >
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </div>
                      }
                      actions={
                        <Flex style={{ gap: "10px" }}>
                          <IconButton
                            onClick={() => {
                              setNotificationToView(notif);
                              setViewModalOpen(true);
                            }}
                            title="View"
                          >
                            <FaRegEye />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setNotificationToDelete(notif);
                              setDeleteModalOpen(true);
                            }}
                            $danger
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
              {/* Loading skeletons for infinite scrolling */}
              {loading &&
                notifications.length > 0 &&
                Array.from({ length: 3 }).map((_, i) => (
                  <AdminItemCard
                    key={`loading-${i}`}
                    title={
                      <SkeletonRect $width="60%" $height="22px" $radius="4px" />
                    }
                    subtitle={
                      <SkeletonRect
                        $width="100%"
                        $height="16px"
                        $radius="4px"
                      />
                    }
                  />
                ))}
            </>
          )}
        </div>

        {/* Modal for creating a new notification */}
        <CommonDialog
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title="Create Notification"
          maxWidth="70%"
          footer={
            <DialogButtonGroup>
              <DialogButton type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton
                type="button"
                $primary
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          <FormField>
            <FormLabel>Title</FormLabel>
            <FormInput
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter notification title"
            />
          </FormField>

          <FormField>
            <FormLabel>Content</FormLabel>
            <div
              style={{
                border: "2px solid rgba(255, 87, 34, 0.2)",
                borderRadius: "10px",
                minHeight: "200px",
                overflow: "hidden",
              }}
            >
              {/* Rich-text editor for notification content */}
              <Editor value={newContent} onChange={(e) => setNewContent(e)} />
            </div>
          </FormField>
        </CommonDialog>

        {/* Read-only view modal for existing notifications */}
        <CommonDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={notificationToView?.title}
          maxWidth="600px"
          footer={
            <DialogButtonGroup>
              <DialogButton
                type="button"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          <div
            style={{
              color: "#333",
              fontSize: "1rem",
              lineHeight: "1.6",
              marginTop: "10px",
            }}
          >
            <SlateRenderer slate={notificationToView?.content} />
          </div>
        </CommonDialog>

        {/* Confirmation modal for notification deletion */}
        <CommonDialog
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          title="Delete Notification"
          footer={
            <DialogButtonGroup>
              <DialogButton
                type="button"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </DialogButton>
              <DialogButton
                type="button"
                $danger
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          <div style={{ marginBottom: "20px", color: "#666" }}>
            Are you sure you want to delete this notification?
          </div>
        </CommonDialog>
      </PageContainer>
    </Wrapper>
  );
}
