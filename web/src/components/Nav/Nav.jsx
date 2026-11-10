/**
 * @file Nav.jsx
 * @description The main navigation component for authenticated users.
 * It manages routing, user profile popovers, notifications, and carrot (currency) history.
 * It also provides functionality for updating the user's grade directly from the profile menu.
 *
 * @dependencies:
 * - SessionContext: For managing logout and global user state (carrots, grade).
 * - SlateRenderer: For rendering rich-text notification content.
 * - TanStack Query: For efficient fetching of unread notification status.
 * - Radix UI Popover: For accessible user profile and notification menus.
 * - react-router-dom: For handling application navigation.
 * - react-hot-toast: For transaction status feedback.
 *
 * @exports Nav (default)
 * @interconnections Main navigation bar used in authenticated layouts. Synchronizes grade updates via `login` callback.
 */

import styled from "styled-components";
import CommonDialog from "../common/CommonDialog";
import {
  Navbar,
  PopoverWrapper,
  ProfilePopover,
  NotificationItem,
  NotificationTitle,
  NotificationDate,
  NotificationPreview,
  EditButton,
  GradeSelect,
  MobileNavToggle,
  MobileMenuOverlay,
  MobileMenuButton,
  LoadingSpinner,
} from "./Nav.style";

import ProfilePicture from "../ProfilePicture";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Font } from "../../styles/Font.style";
import { SessionContext } from "../../context/SessionProvider";
import { IoMdCreate, IoMdCheckmark, IoMdClose, IoMdMenu } from "react-icons/io";
import { SkeletonRect } from "../admin/AdminDashboardView";
import Carrot from "../Carrot";
import toast from "react-hot-toast";
import NavIcon from "../common/NavIcon";
import * as Popover from "@radix-ui/react-popover";
import Tooltip from "../Tooltip";
import SlateRenderer from "../SlateRenderer";
import { extractTextFromSlate } from "../../utils/slateUtils";
import ChartWidget from "../ChartWidget";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../services/api";
import { API_ENDPOINTS } from "../../api/requestMap";

const Profile = styled.div`
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  padding: 0;
  position: absolute;
  top: 2%;
  right: 1%;
  border-radius: 100px;
  display: flex;
`;
const Candies = styled(Navbar.Button)`
  border-radius: 10em;
  padding-inline: 2px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
  padding: 0px 18px;
  width: auto;
  aspect-ratio: auto; /* Prevent inheriting 1/1 from Navbar.Button */

  svg {
    box-sizing: content-box;
    height: -moz-fit-content;
    height: fit-content;
    width: -moz-fit-content;
    width: fit-content;
    padding: 0px;
    margin-right: 20px;
  }
`;

function Nav() {
  const { user, logout, updateUser } = useContext(SessionContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Grade editing state for the profile popover
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [tempGrade, setTempGrade] = useState(user?.grade || 1);
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Synchronize local grade state with global user state
  useEffect(() => {
    if (user?.grade) {
      setTempGrade(user.grade);
    }
  }, [user?.grade]);

  /**
   * Persists the user's updated grade to the backend.
   * Upon success, it updates the local session with the new grade.
   */
  const handleSaveGrade = async () => {
    if (!tempGrade) return;
    setIsSavingGrade(true);
    try {
      const numericGrade = Number(tempGrade);
      const response = await apiClient.put(API_ENDPOINTS.editUser.url, {
        grade: numericGrade,
      });

      if (response?.status === 200) {
        updateUser({ grade: numericGrade });
        setIsEditingGrade(false);
        toast.success("Grade updated successfully");
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Error updating grade:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSavingGrade(false);
    }
  };

  /**
   * TanStack Query hook to check for unread notifications.
   */
  const { data: hasUnread = false } = useQuery({
    queryKey: ["notifications-unread"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await apiClient.get(
          API_ENDPOINTS.getUserNotificationsUnread.url,
        );
        return res.data;
      } catch {
        return false;
      }
    },
  });

  /**
   * Fetches notification content and marks them as read.
   */
  const handleNotificationClick = async () => {
    if (notifications.length === 0) {
      setLoadingNotifications(true);
      try {
        const response = await apiClient.post(
          API_ENDPOINTS.markAllNotificationsRead.url,
        );

        let newNotifications = [];
        if (Array.isArray(response?.data)) {
          newNotifications = response.data;
        } else if (Array.isArray(response?.data?.notifications)) {
          newNotifications = response.data.notifications;
        }

        setNotifications(newNotifications);
        // Optimistically clear the unread notification dot
        queryClient.setQueryData(["notifications-unread"], false);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setLoadingNotifications(false);
      }
    }
  };

  return (
    <>
      <MobileNavToggle
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={
          isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
        }
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-menu-overlay"
      >
        {isMobileMenuOpen ? <IoMdClose /> : <IoMdMenu />}
      </MobileNavToggle>

      <MobileMenuOverlay id="mobile-menu-overlay" $isOpen={isMobileMenuOpen}>
        <EditButton
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            fontSize: "2rem",
            width: "40px",
            height: "40px",
            zIndex: 2005,
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <IoMdClose />
        </EditButton>
        <MobileMenuButton
          onClick={() => {
            setIsMobileMenuOpen(false);
            navigate("/dashboard");
          }}
        >
          <NavIcon>
            <path d="M22,5.724V2c0-.552-.447-1-1-1s-1,.448-1,1v2.366L14.797,.855c-1.699-1.146-3.895-1.146-5.594,0L2.203,5.579c-1.379,.931-2.203,2.48-2.203,4.145v9.276c0,2.757,2.243,5,5,5h2c.553,0,1-.448,1-1V14c0-.551,.448-1,1-1h6c.552,0,1,.449,1,1v9c0,.552,.447,1,1,1h2c2.757,0,5-2.243,5-5V9.724c0-1.581-.744-3.058-2-4Z" />
          </NavIcon>
          Dashboard
        </MobileMenuButton>
        <MobileMenuButton
          onClick={() => {
            setIsMobileMenuOpen(false);
            navigate("/analytics");
          }}
        >
          <NavIcon>
            <path d="M22.5,21H5.5A2.5,2.5,0,0,1,3,18.5V1.5a1.5,1.5,0,0,0-3,0v17A5.506,5.506,0,0,0,5.5,24h17a1.5,1.5,0,0,0,0-3Z" />
            <path d="M22.5,3.976H19.414a1,1,0,0,0-.707,1.707l.733.732h0L15.853,10a.5.5,0,0,1-.708,0l-.17-.17a3.583,3.583,0,0,0-4.95,0l-4.1,4.1a1.5,1.5,0,1,0,2.121,2.121l4.1-4.1a.5.5,0,0,1,.708,0l.17.17a3.585,3.585,0,0,0,4.95,0l3.586-3.585h0l.732.733A1,1,0,0,0,24,8.562V5.476A1.5,1.5,0,0,0,22.5,3.976Z" />
          </NavIcon>
          Analytics
        </MobileMenuButton>
        <MobileMenuButton
          onClick={() => {
            setIsMobileMenuOpen(false);
            navigate("/report-issue");
          }}
        >
          <NavIcon>
            <path
              d="M19,7H16.19c-.45-.78-1.07-1.45-1.82-1.96L16,3.41,14.59,2,12.42,4.17c-.42-.11-.85-.17-1.32-.17s-.9,0-1.32,.17L7.61,2,6.2,3.41l1.62,1.63C7.07,5.55,6.45,6.22,6,7H3.19v2h1.91c-.05,.33-.09,.66-.09,1v1H3v2h2v1c0,.34,.04,.67,.09,1H3v2h1.91c1.04,1.79,2.97,3,5.19,3s4.15-1.21,5.19-3h1.91v-2h-1.91c.05-.33,.09-.66,.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1h1.91v-2Zm-7,8h-4v-2h4v2Zm0-4h-4v-2h4v2Z"
              transform="scale(1.1) translate(-1, -1)"
            />
          </NavIcon>
          Report an Issue
        </MobileMenuButton>

        <CommonDialog
          title="Notifications"
          trigger={
            <MobileMenuButton
              title="Notification"
              onClick={handleNotificationClick}
            >
              <div
                style={{
                  position: "relative",
                  width: "auto",
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <NavIcon>
                  <path
                    fill="currentColor"
                    d="M4.068,18H19.724a3,3,0,0,0,2.821-4.021L19.693,6.094A8.323,8.323,0,0,0,11.675,0h0A8.321,8.321,0,0,0,3.552,6.516l-2.35,7.6A3,3,0,0,0,4.068,18Z"
                  />
                  <path fill="currentColor" d="M7.1,20a5,5,0,0,0,9.8,0Z" />
                </NavIcon>
                {hasUnread && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ff5722",
                      borderRadius: "50%",
                      border: "2px solid white",
                    }}
                  />
                )}
              </div>
              Notifications
            </MobileMenuButton>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {loadingNotifications ? (
              <div style={{ padding: "15px" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <SkeletonRect $width="60%" $height="16px" />
                      <SkeletonRect $width="20%" $height="12px" />
                    </div>
                    <SkeletonRect $width="100%" $height="14px" $mb="4px" />
                    <SkeletonRect $width="80%" $height="14px" />
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif, index) => {
                const isLegacy = typeof notif.content === "string";
                const previewText = isLegacy
                  ? notif.content.replace(/<[^>]*>/g, " ")
                  : extractTextFromSlate(notif.content);

                return (
                  <NotificationItem
                    key={notif._id || notif.id || index}
                    onClick={() => {
                      setSelectedNotification(notif);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <NotificationTitle>{notif.title}</NotificationTitle>
                      <NotificationDate>
                        {new Date(notif.createdAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </NotificationDate>
                    </div>
                    <NotificationPreview>{previewText}</NotificationPreview>
                  </NotificationItem>
                );
              })
            ) : (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#888",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <NavIcon
                  width="40"
                  height="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "#ddd" }}
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </NavIcon>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  No new notifications
                </p>
              </div>
            )}
          </div>
        </CommonDialog>

        {/* Carrots History Graph */}
        <CommonDialog
          title="Carrots History"
          trigger={
            <MobileMenuButton title="Carrots">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Carrot size="28px" />
              </div>
              <span style={{ marginLeft: "5px" }}>
                {user.carrots?.count ?? user.carrots ?? 0}
              </span>
            </MobileMenuButton>
          }
        >
          <ChartWidget
            title="Carrots History"
            subtitle="Your earnings over the last 7 days."
            type="line"
            height="220px"
            data={{
              labels: Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toLocaleDateString(undefined, {
                  weekday: "short",
                });
              }),
              datasets: [
                {
                  label: "Carrots Earned",
                  data: [
                    ...Array(7).fill(0),
                    ...(user.carrots?.history || []),
                  ].slice(-7),

                  borderColor: "#ff9800",
                  backgroundColor: "rgba(255, 152, 0, 0.2)",
                  fill: true,
                  tension: 0.4,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { grid: { display: false } },
              },
            }}
            containerStyle={{
              margin: 0,
              padding: "20px",
              border: "none",
              boxShadow: "none",
              borderRadius: "10px",
            }}
          />
        </CommonDialog>

        {/* User Profile Details */}
        <CommonDialog
          title="Your Profile"
          trigger={
            <MobileMenuButton title="Profile">
              <ProfilePicture
                user={user}
                shadow={false}
                style={{
                  width: "28px",
                  height: "28px",
                  margin: "0",
                  display: "inline-flex",
                }}
              />
              Profile
            </MobileMenuButton>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "15px",
              borderBottom: "1px solid #eee",
              paddingBottom: "15px",
            }}
          >
            <ProfilePicture user={user} />
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#333",
                marginBottom: "2px",
                marginTop: "10px",
              }}
            >
              {user.fullname}
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>{user.email}</div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <span
                style={{ fontSize: "14px", fontWeight: "600", color: "#888" }}
              >
                Grade
              </span>
              <div style={{ display: "flex", alignItems: "center" }}>
                {isEditingGrade ? (
                  <>
                    <GradeSelect
                      value={tempGrade}
                      onChange={(e) => setTempGrade(e.target.value)}
                      disabled={isSavingGrade}
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </GradeSelect>
                    <EditButton
                      onClick={handleSaveGrade}
                      disabled={isSavingGrade}
                    >
                      {isSavingGrade ? (
                        <LoadingSpinner />
                      ) : (
                        <IoMdCheckmark style={{ color: "#4caf50" }} />
                      )}
                    </EditButton>
                    <EditButton
                      onClick={() => {
                        setIsEditingGrade(false);
                        setTempGrade(user.grade);
                      }}
                      disabled={isSavingGrade}
                    >
                      <IoMdClose style={{ color: "#f44336" }} />
                    </EditButton>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#e91e63",
                      }}
                    >
                      {user.grade}
                    </span>
                    <EditButton onClick={() => setIsEditingGrade(true)}>
                      <IoMdCreate />
                    </EditButton>
                  </>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <span
                style={{ fontSize: "14px", fontWeight: "600", color: "#888" }}
              >
                Carrots
              </span>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#e91e63",
                }}
              >
                {user.carrots?.count ?? user.carrots ?? 0}
              </span>
            </div>
          </div>
        </CommonDialog>

        <MobileMenuButton
          onClick={() => {
            setIsMobileMenuOpen(false);
            logout();
          }}
        >
          <NavIcon>
            <path d="M19,1H5A2.94,2.94,0,0,0,2,4V20a2.94,2.94,0,0,0,3,3H19a2.94,2.94,0,0,0,3-3V4A2.94,2.94,0,0,0,19,1ZM12,17V13H4V11h8V7l5,5Z" />
          </NavIcon>
          Logout
        </MobileMenuButton>
        <CommonDialog
          open={!!selectedNotification}
          onOpenChange={(open) => !open && setSelectedNotification(null)}
          title={selectedNotification?.title}
        >
          <div style={{ padding: "10px 0" }}>
            <SlateRenderer slate={selectedNotification?.content} />
          </div>
        </CommonDialog>
      </MobileMenuOverlay>

      <Profile>
        <Navbar.Wrapper>
          <Tooltip text="Home" style={{ height: "100%" }}>
            <Navbar.Button onClick={() => navigate("/dashboard")}>
              <NavIcon>
                <path d="M22,5.724V2c0-.552-.447-1-1-1s-1,.448-1,1v2.366L14.797,.855c-1.699-1.146-3.895-1.146-5.594,0L2.203,5.579c-1.379,.931-2.203,2.48-2.203,4.145v9.276c0,2.757,2.243,5,5,5h2c.553,0,1-.448,1-1V14c0-.551,.448-1,1-1h6c.552,0,1,.449,1,1v9c0,.552,.447,1,1,1h2c2.757,0,5-2.243,5-5V9.724c0-1.581-.744-3.058-2-4Z" />
              </NavIcon>
            </Navbar.Button>
          </Tooltip>
          <Tooltip text="Analytics" style={{ height: "100%" }}>
            <Navbar.Button onClick={() => navigate("/analytics")}>
              <NavIcon>
                <path d="M22.5,21H5.5A2.5,2.5,0,0,1,3,18.5V1.5a1.5,1.5,0,0,0-3,0v17A5.506,5.506,0,0,0,5.5,24h17a1.5,1.5,0,0,0,0-3Z" />
                <path d="M22.5,3.976H19.414a1,1,0,0,0-.707,1.707l.733.732h0L15.853,10a.5.5,0,0,1-.708,0l-.17-.17a3.583,3.583,0,0,0-4.95,0l-4.1,4.1a1.5,1.5,0,1,0,2.121,2.121l4.1-4.1a.5.5,0,0,1,.708,0l.17.17a3.585,3.585,0,0,0,4.95,0l3.586-3.585h0l.732.733A1,1,0,0,0,24,8.562V5.476A1.5,1.5,0,0,0,22.5,3.976Z" />
              </NavIcon>
            </Navbar.Button>
          </Tooltip>
          <Tooltip text="Report Issue" style={{ height: "100%" }}>
            <Navbar.Button onClick={() => navigate("/report-issue")}>
              <NavIcon>
                <path
                  d="M19,7H16.19c-.45-.78-1.07-1.45-1.82-1.96L16,3.41,14.59,2,12.42,4.17c-.42-.11-.85-.17-1.32-.17s-.9,0-1.32,.17L7.61,2,6.2,3.41l1.62,1.63C7.07,5.55,6.45,6.22,6,7H3.19v2h1.91c-.05,.33-.09,.66-.09,1v1H3v2h2v1c0,.34,.04,.67,.09,1H3v2h1.91c1.04,1.79,2.97,3,5.19,3s4.15-1.21,5.19-3h1.91v-2h-1.91c.05-.33,.09-.66,.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1h1.91v-2Zm-7,8h-4v-2h4v2Zm0-4h-4v-2h4v2Z"
                  transform="scale(1.3) translate(-1, -1)"
                />
              </NavIcon>
            </Navbar.Button>
          </Tooltip>

          <PopoverWrapper>
            <Popover.Root>
              <Popover.Trigger asChild>
                <Tooltip text="Notification" style={{ height: "100%" }}>
                  <Navbar.Button onClick={handleNotificationClick}>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <NavIcon>
                        <path d="M4.068,18H19.724a3,3,0,0,0,2.821-4.021L19.693,6.094A8.323,8.323,0,0,0,11.675,0h0A8.321,8.321,0,0,0,3.552,6.516l-2.35,7.6A3,3,0,0,0,4.068,18Z" />
                        <path d="M7.1,20a5,5,0,0,0,9.8,0Z" />
                      </NavIcon>
                      {hasUnread && (
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            width: "10px",
                            height: "10px",
                            backgroundColor: "#ff5722",
                            borderRadius: "50%",
                            border: "2px solid white",
                          }}
                        />
                      )}
                    </div>
                  </Navbar.Button>
                </Tooltip>
              </Popover.Trigger>
              <Popover.Portal>
                <ProfilePopover
                  data-side="bottom"
                  sideOffset={5}
                  style={{ width: "350px", padding: "0" }}
                >
                  <div
                    className="Header"
                    style={{
                      padding: "15px",
                      flexDirection: "row",
                      justifyContent: "center",
                      marginBottom: "0",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.2rem",
                        fontWeight: "700",
                        color: "#333",
                      }}
                    >
                      Notifications
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    {loadingNotifications ? (
                      <div style={{ padding: "15px" }}>
                        {[1, 2, 3].map((i) => (
                          <div key={i} style={{ marginBottom: "15px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                              }}
                            >
                              <SkeletonRect $width="60%" $height="16px" />
                              <SkeletonRect $width="20%" $height="12px" />
                            </div>
                            <SkeletonRect
                              $width="100%"
                              $height="14px"
                              $mb="4px"
                            />
                            <SkeletonRect $width="80%" $height="14px" />
                          </div>
                        ))}
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notif, index) => {
                        const isLegacy = typeof notif.content === "string";
                        const previewText = isLegacy
                          ? notif.content.replace(/<[^>]*>/g, " ")
                          : extractTextFromSlate(notif.content);

                        return (
                          <NotificationItem
                            key={notif._id || notif.id || index}
                            onClick={() => setSelectedNotification(notif)}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              <NotificationTitle>
                                {notif.title}
                              </NotificationTitle>
                              <NotificationDate>
                                {new Date(notif.createdAt).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" },
                                )}
                              </NotificationDate>
                            </div>
                            <NotificationPreview>
                              {previewText}
                            </NotificationPreview>
                          </NotificationItem>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          padding: "40px 20px",
                          textAlign: "center",
                          color: "#888",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <NavIcon
                          width="40"
                          height="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: "#ddd" }}
                        >
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </NavIcon>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                          No new notifications
                        </p>
                      </div>
                    )}
                  </div>
                  <Popover.Arrow className="Arrow" />
                </ProfilePopover>
              </Popover.Portal>
            </Popover.Root>
          </PopoverWrapper>

          <CommonDialog
            open={!!selectedNotification}
            onOpenChange={(open) => !open && setSelectedNotification(null)}
            title={selectedNotification?.title}
          >
            <div style={{ padding: "10px 0" }}>
              <SlateRenderer slate={selectedNotification?.content} />
            </div>
          </CommonDialog>

          <Tooltip text="Logout" style={{ height: "100%" }}>
            <Navbar.Button onClick={logout}>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="m15.889 16.011c-.817-.099-1.57.488-1.668 1.311-.117.979-.253 1.74-.36 2.263-.483.095-1.137.204-1.86.288v-14.354c.78.119 1.458.28 1.935.413.081.416.181 1 .272 1.751.098.826.865 1.41 1.672 1.306.822-.101 1.407-.85 1.307-1.672-.233-1.893-.51-2.873-.54-2.978-.133-.455-.474-.821-.918-.986.018.009-1.903-.691-3.728-.847v-.444c0-.521-.401-.956-.921-.997-.519-.041-1.049-.065-1.579-.065-3.44 0-6.813 1-6.954 1.042-.329.099-.585.359-.677.69-.035.128-.869 3.201-.869 9.268s.824 9.619.859 9.768c.095.402.427.705.837.762.139.019 2.304.471 6.804.471 2.679 0 6.016-.664 5.976-.7.511-.131.915-.521 1.064-1.025.016-.053.386-1.312.659-3.596.099-.823-.488-1.569-1.311-1.668zm-8.889-4.011c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5zm15.8 1.1c-.768 1.024-1.676 1.933-2.701 2.701-.176.132-.387.2-.6.2-.536.01-1.011-.461-1-1v-1h-3c-.828 0-1.5-.671-1.5-1.5s.672-1.5 1.5-1.5h3v-1c0-.379.214-.725.553-.895s.744-.133 1.047.094c1.024.768 1.933 1.676 2.701 2.701.266.355.266.844 0 1.199z" />
              </svg>
            </Navbar.Button>
          </Tooltip>

          {/* Carrots history popover with graph */}
          <PopoverWrapper>
            <Popover.Root>
              <Popover.Trigger asChild>
                <Tooltip text="Carrots" style={{ height: "100%" }}>
                  <Candies style={{ cursor: "pointer" }}>
                    <Carrot size="20px" />
                    <Font>{user.carrots?.count ?? user.carrots ?? 0}</Font>
                  </Candies>
                </Tooltip>
              </Popover.Trigger>
              <Popover.Portal>
                <ProfilePopover
                  data-side="bottom"
                  sideOffset={5}
                  style={{ width: "350px", padding: 0 }}
                >
                  <ChartWidget
                    title="Carrots History"
                    subtitle="Your earnings over the last 7 days."
                    type="line"
                    height="220px"
                    data={{
                      labels: Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        return d.toLocaleDateString(undefined, {
                          weekday: "short",
                        });
                      }),
                      datasets: [
                        {
                          label: "Carrots Earned",
                          data: [
                            ...Array(7).fill(0),
                            ...(user.carrots?.history || []),
                          ].slice(-7),

                          borderColor: "#ff9800",
                          backgroundColor: "rgba(255, 152, 0, 0.2)",
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 } },
                        x: { grid: { display: false } },
                      },
                    }}
                    containerStyle={{
                      margin: 0,
                      padding: "20px",
                      border: "none",
                      boxShadow: "none",
                      borderRadius: "10px",
                    }}
                  />
                  <Popover.Arrow className="Arrow" />
                </ProfilePopover>
              </Popover.Portal>
            </Popover.Root>
          </PopoverWrapper>

          {/* User profile and settings popover */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <ProfilePicture user={user} />
            </Popover.Trigger>
            <Popover.Portal>
              <ProfilePopover data-side="bottom" sideOffset={5}>
                <div className="Header">
                  <ProfilePicture user={user} />
                  <div className="Name">{user.fullname}</div>
                  <div className="Email">{user.email}</div>
                </div>
                <div className="Details">
                  <div className="DetailRow">
                    <span className="Label">Grade</span>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {isEditingGrade ? (
                        <>
                          <GradeSelect
                            value={tempGrade}
                            onChange={(e) => setTempGrade(e.target.value)}
                            disabled={isSavingGrade}
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </GradeSelect>
                          <EditButton
                            onClick={handleSaveGrade}
                            disabled={isSavingGrade}
                          >
                            {isSavingGrade ? (
                              <LoadingSpinner />
                            ) : (
                              <IoMdCheckmark style={{ color: "#4caf50" }} />
                            )}
                          </EditButton>
                          <EditButton
                            onClick={() => {
                              setIsEditingGrade(false);
                              setTempGrade(user.grade);
                            }}
                            disabled={isSavingGrade}
                          >
                            <IoMdClose style={{ color: "#f44336" }} />
                          </EditButton>
                        </>
                      ) : (
                        <>
                          <span className="Value">{user.grade}</span>
                          <EditButton onClick={() => setIsEditingGrade(true)}>
                            <IoMdCreate />
                          </EditButton>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="DetailRow">
                    <span className="Label">Carrots</span>
                    <span className="Value">
                      {user.carrots?.count ?? user.carrots ?? 0}
                    </span>
                  </div>
                </div>
                <Popover.Arrow className="Arrow" />
              </ProfilePopover>
            </Popover.Portal>
          </Popover.Root>
        </Navbar.Wrapper>
      </Profile>
    </>
  );
}

import { memo } from "react";
export default memo(Nav);
