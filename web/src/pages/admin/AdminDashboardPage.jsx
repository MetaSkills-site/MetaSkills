/**
 * @file Dashboard.jsx
 * @description Central command center for administrators. Provides high-level access
 * to content management, user analytics, error reporting, session monitoring,
 * and automated Google Drive backups.
 *
 * @dependencies
 * - @tanstack/react-query: For managing server state, specifically for backups and error status.
 * - radix-ui/DropdownMenu: For the structured administrative profile menu.
 * - react-router-dom: For navigating between administrative sub-modules.
 * - adminService: Backend service for backup management and system status checks.
 * - framer-motion: (Indirectly via styled components) for UI animations.
 *
 * @exports
 * - Dashboard (default): The main landing page for authenticated administrators.
 *
 * @interconnections
 * - Serves as the primary entry point for all admin-related routes.
 * - Synchronizes with Google Drive API via backend proxy for system backups.
 * - Monitors 'error-reports' status to provide visual notifications (IndicatorDot).
 */

import { DropdownMenu } from "radix-ui";
import {
  DashboardContainer,
  DashboardOptions,
  WelcomeText,
  ActionItem,
  IconWrapper,
  Label,
  Divider,
  AnimatedProfileWrapper,
  StyledDropdownContent,
  StyledDropdownItem,
  StyledDropdownSeparator,
  FileManagerContainer,
  FileList,
  FileItem,
  FileInfo,
  FileDetails,
  FileName,
  FileMeta,
  FileActions,
  ActionIcon,
  ButtonBar,
  CodePreviewContainer,
  CodeBlock,
  StyledSpinner,
} from "../../styles/Dashboard.style";
import CommonDialog from "../../components/common/CommonDialog";
import {
  DialogButtonGroup,
  DialogButton,
} from "../../components/admin/AdminStyles";
import {
  FaCog,
  FaTrash,
  FaSignOutAlt,
  FaTerminal,
  FaGoogleDrive,
  FaExclamationTriangle,
  FaNetworkWired,
  FaBug,
  FaSortNumericDown,
  FaFileImport,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import {
  getErrorPendingStatus,
  getBackupFiles,
  triggerBackup,
  deleteBackupFile,
  getBackupFileContent,
  clearAllBackups,
} from "../../services/adminService";

import RunScripts from "../../components/admin/RunScripts";
import useKeyboardShortcut from "../../hooks/event-hooks/useKeyboardShortcut";
import { SkeletonRect, SkeletonText } from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import styled from "styled-components";
import { useAdminAuth } from "../../components/admin/AdminAuthProvider";

/**
 * Visual indicator for pending tasks (e.g., unread error reports).
 */
const IndicatorDot = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background-color: var(--status-error, #f44336);
  border-radius: 50%;
  border: 2px solid #fff;
`;

const DropdownProfileContainer = styled.div`
  padding: 8px 12px;
`;

const DropdownProfileName = styled.div`
  font-weight: 700;
  font-size: 15px;
  color: var(--text-primary, #333);
`;

const DropdownProfileEmail = styled.div`
  font-size: 12px;
  color: var(--text-muted, #888);
`;

const DialogHeaderWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${(props) => props.$fontSize || "inherit"};
`;

const SkeletonListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SkeletonActionItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
`;

const EmptyStateWrapper = styled.div`
  padding: 20px 0;
  min-height: 200px;
`;

const DriveIconWrapper = styled.div`
  padding: 8px;
  background: var(--badge-bg-blue, #e8f0fe);
  border-radius: 8px;
  color: var(--badge-text-blue, #1967d2);
`;

const CodePreviewSkeletonContainer = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 300px;
`;

/**
 * Individual action tile for the dashboard grid.
 */
const ActionButton = ({ icon, text, link, primary, hasIndicator }) => (
  <ActionItem>
    <Link to={link}>
      <IconWrapper $primary={primary} style={{ position: "relative" }}>
        {icon}
        {hasIndicator && <IndicatorDot />}
      </IconWrapper>
      <Label>{text}</Label>
    </Link>
  </ActionItem>
);

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { adminUser: admin } = useAdminAuth() || {};

  // UI and Modal control states
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [runScriptsOpen, setRunScriptsOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);

  // Backup file management states
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [clearingDrive, setClearingDrive] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clearDriveConfirmOpen, setClearDriveConfirmOpen] = useState(false);

  // Large file viewer state (supports progressive rendering for JSON backups)
  const [viewCodeOpen, setViewCodeOpen] = useState(false);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [, setFileContent] = useState("");
  const [viewingFile, setViewingFile] = useState(null);

  /**
   * Progressive rendering logic for the file viewer.
   * Prevents browser crashes when viewing multi-megabyte JSON backups by
   * loading content in virtualized chunks.
   */
  const [contentLines, setContentLines] = useState([]);
  const [displayedLines, setDisplayedLines] = useState([]);
  const [nextChunkIndex, setNextChunkIndex] = useState(0);
  const CHUNK_SIZE = 100;

  // Suppress unused warning — still needed for backup flow state
  const [, setBackupResult] = useState(null);

  const queryClient = useQueryClient();

  // Attach global shortcut for adding a question
  useKeyboardShortcut({
    key: "+",
    onTrigger: () => navigate("addQuestions"),
    ignoreFormElements: true,
  });

  /**
   * Periodically checks if there are new error reports from users.
   * Data is considered stale after 30 seconds.
   */
  const { data: errorStatusData, isLoading: statusLoading } = useQuery({
    queryKey: ["errorPendingStatus"],
    queryFn: () => getErrorPendingStatus(admin?.token),
    enabled: !!admin?.token,
    staleTime: 0, // Force fresh fetch each time component is mounted
  });
  const errorReportsAvailable = errorStatusData?.errorReportsAvailable || false;

  // Display skeleton during initial data fetch
  const isDashboardLoading = statusLoading && !errorStatusData;

  /**
   * Fetches the list of backup files stored in the linked Google Drive.
   * Only active when the backup manager dialog is open.
   */
  const { data: driveFilesData, isFetching: fetchingDriveFiles } = useQuery({
    queryKey: ["backupFiles"],
    queryFn: () => getBackupFiles(),
    enabled: backupDialogOpen,
    staleTime: 0, // Force fresh fetch on dialog open
  });
  const driveFiles = driveFilesData?.files || [];

  /**
   * Redirects to the login page.
   */
  const handleLogout = () => {
    navigate("/admin/login");
    toast.success("Logged out successfully");
  };

  /**
   * Triggers a manual database backup to Google Drive.
   */
  const handleBackup = async () => {
    if (backupLoading) return;
    setBackupLoading(true);
    try {
      await triggerBackup();
      toast.success("Backup successful!");
      queryClient.invalidateQueries({ queryKey: ["backupFiles"] });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Backup failed");
    } finally {
      setBackupLoading(false);
    }
  };

  /**
   * Deletes a specific file from the Google Drive backup folder.
   */
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    setDeletingFileId(fileToDelete.id);
    setDeleteConfirmOpen(false);
    try {
      await deleteBackupFile(admin?.token, fileToDelete.id);
      toast.success("File deleted");
      queryClient.invalidateQueries({ queryKey: ["backupFiles"] });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete file");
    } finally {
      setDeletingFileId(null);
      setFileToDelete(null);
    }
  };

  /**
   * Fetches and prepares file content for the viewer.
   * Handles JSON formatting and initializes the chunked rendering state.
   */
  const handleViewFile = async (file) => {
    setViewingFile(file);
    setViewCodeOpen(true);
    setFileContentLoading(true);
    setFileContent("");
    setContentLines([]);
    setDisplayedLines([]);
    setNextChunkIndex(0);

    try {
      const data = await getBackupFileContent(admin?.token, file.id);

      let rawContent = "";
      if (typeof data.content === "object") {
        rawContent = JSON.stringify(data.content, null, 2);
      } else {
        rawContent = data.content;
      }

      setFileContent(rawContent);
      const allLines = rawContent.split("\n");
      setContentLines(allLines);

      // Load first chunk immediately
      setDisplayedLines(allLines.slice(0, CHUNK_SIZE));
      setNextChunkIndex(CHUNK_SIZE);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load file content");
      setFileContent("Error loading content.");
      setDisplayedLines(["Error loading content."]);
    } finally {
      setFileContentLoading(false);
    }
  };

  /**
   * Infinite scroll handler for the code viewer.
   * Loads the next 'CHUNK_SIZE' lines when the user reaches the bottom.
   */
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (nextChunkIndex < contentLines.length) {
        const nextSlice = contentLines.slice(
          nextChunkIndex,
          nextChunkIndex + CHUNK_SIZE,
        );
        setDisplayedLines((prev) => [...prev, ...nextSlice]);
        setNextChunkIndex((prev) => prev + CHUNK_SIZE);
      }
    }
  };

  /**
   * Purges all files from the associated Google Drive backup directory.
   */
  const handleClearDrive = async () => {
    setClearingDrive(true);
    setClearDriveConfirmOpen(false);
    try {
      await clearAllBackups(admin?.token);
      toast.success("All files deleted");
      queryClient.invalidateQueries({ queryKey: ["backupFiles"] });
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear drive");
    } finally {
      setClearingDrive(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStringKey) => {
    return new Date(dateStringKey).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Triggers the removal of questions marked for deletion in the database.
   */
  const confirmEmptyTrash = async () => {
    try {
      const { emptyTrash } = await import("../../services/quizService");
      await emptyTrash(admin?.token);
      toast.success("Trash emptied successfully");
      setEmptyTrashOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to empty trash");
    }
  };

  // Render skeletons during the initial loading phase
  if (isDashboardLoading) {
    return (
      <>
        <Helmet>
          <title>Admin | MetaSkills</title>
        </Helmet>
        <DashboardContainer>
          <SkeletonText $width="200px" $height="28px" $mb="8px" />
          <DashboardOptions>
            {Array.from({ length: 9 }).map((_, i) => (
              <ActionItem key={i}>
                <SkeletonActionItem>
                  <SkeletonRect $width="48px" $height="48px" $radius="14px" />
                  <SkeletonText $width="64px" $height="12px" />
                </SkeletonActionItem>
              </ActionItem>
            ))}
          </DashboardOptions>
        </DashboardContainer>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin | MetaSkills</title>
      </Helmet>
      <DashboardContainer>
        <WelcomeText>Welcome, {admin?.name || "Admin"}</WelcomeText>

        {/* Main Administrative Action Grid */}
        <DashboardOptions>
          <ActionButton
            primary
            link="addQuestions"
            text="Add question"
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            }
          />

          <ActionButton
            link="view-content"
            text="Content management"
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z" />
              </svg>
            }
          />

          <ActionButton
            link="analytics"
            text="Open analytics"
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
            }
          />

          <ActionButton
            link="error-reports"
            text="Error Reports"
            icon={<FaBug size={24} />}
            hasIndicator={errorReportsAvailable}
          />

          <ActionButton
            link="sequence-manager"
            text="Manage Sequence"
            icon={<FaSortNumericDown size={24} />}
          />

          <ActionButton
            link="/admin/active-sessions"
            text="Active Sessions"
            icon={<FaNetworkWired size={24} />}
          />

          <ActionButton
            link="viewUsers"
            text="View users"
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            }
          />

          <ActionButton
            link="trash"
            text="Trash"
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            }
          />

          <ActionButton
            link="notifications"
            text="Manage notifications"
            icon={
              <svg viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>
            }
          />

          <ActionButton
            link="manage-marathon"
            text="Manage Marathon"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "#ff7b51" }}
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            }
          />

          <ActionButton
            link="bulk-import"
            text="Bulk Import"
            icon={<FaFileImport size={24} />}
          />

          <Divider />

          {/* Profile Dropdown for system settings, backups, and logout */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <AnimatedProfileWrapper></AnimatedProfileWrapper>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                asChild
                sideOffset={5}
                side="right"
                align="center"
              >
                <StyledDropdownContent>
                  <DropdownProfileContainer>
                    <DropdownProfileName>
                      {admin?.name || "Admin"}
                    </DropdownProfileName>
                    <DropdownProfileEmail>{admin?.email}</DropdownProfileEmail>
                  </DropdownProfileContainer>

                  <StyledDropdownSeparator />

                  <DropdownMenu.Item asChild>
                    <StyledDropdownItem
                      onClick={() => toast.success("Settings coming soon")}
                    >
                      <FaCog size={18} />
                      Settings
                    </StyledDropdownItem>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item asChild>
                    <StyledDropdownItem
                      onClick={() => {
                        setBackupDialogOpen(true);
                        setBackupResult(null);
                      }}
                    >
                      <FaGoogleDrive size={18} />
                      Backup to Drive
                    </StyledDropdownItem>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item asChild>
                    <StyledDropdownItem onClick={() => setEmptyTrashOpen(true)}>
                      <FaTrash size={18} />
                      Clean trash
                    </StyledDropdownItem>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    asChild
                    onSelect={() => setRunScriptsOpen(true)}
                  >
                    <StyledDropdownItem>
                      <FaTerminal size={18} />
                      Run scripts
                    </StyledDropdownItem>
                  </DropdownMenu.Item>
                  <StyledDropdownSeparator />
                  <DropdownMenu.Item asChild>
                    <StyledDropdownItem
                      className="logout"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt size={18} />
                      Logout
                    </StyledDropdownItem>
                  </DropdownMenu.Item>
                  <DropdownMenu.Arrow className="Arrow" />
                </StyledDropdownContent>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </DashboardOptions>

        {/* Modal: Permanent deletion of trashed items */}
        <CommonDialog
          open={emptyTrashOpen}
          onOpenChange={setEmptyTrashOpen}
          title="Empty Trash"
          description="Are you sure you want to permanently delete all questions in the trash? This action cannot be undone."
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setEmptyTrashOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton type="button" $danger onClick={confirmEmptyTrash}>
                Empty Trash
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>

        {/* Modal: Google Drive Backup Management */}
        <CommonDialog
          open={backupDialogOpen}
          onOpenChange={setBackupDialogOpen}
          maxWidth="600px"
          title={
            <DialogHeaderWithIcon>
              <FaGoogleDrive color="#ff5722" />
              Google Drive Backup Manager
            </DialogHeaderWithIcon>
          }
          footer={
            <DialogButtonGroup
              style={{ justifyContent: "center", marginTop: "10px" }}
            >
              <DialogButton onClick={() => setBackupDialogOpen(false)}>
                Close
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          <FileManagerContainer>
            {fetchingDriveFiles ? (
              <SkeletonListContainer>
                <SkeletonRect $height="60px" />
                <SkeletonRect $height="60px" />
                <SkeletonRect $height="60px" />
              </SkeletonListContainer>
            ) : driveFiles.length === 0 ? (
              <EmptyStateWrapper>
                <EmptyState
                  message="No backup files found."
                  icon={<FaGoogleDrive size={48} />}
                />
              </EmptyStateWrapper>
            ) : (
              <FileList>
                {driveFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleViewFile(file)}
                  >
                    <FileInfo>
                      <DriveIconWrapper>
                        <FaGoogleDrive size={20} />
                      </DriveIconWrapper>
                      <FileDetails>
                        <FileName title={file.name}>{file.name}</FileName>
                        <FileMeta>
                          {formatSize(file.size)} •{" "}
                          {formatDate(file.createdTime)}
                        </FileMeta>
                      </FileDetails>
                    </FileInfo>
                    <FileActions>
                      {deletingFileId === file.id ? (
                        <StyledSpinner color="#888" />
                      ) : (
                        <ActionIcon
                          $danger
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileToDelete(file);
                            setDeleteConfirmOpen(true);
                          }}
                          disabled={clearingDrive || deletingFileId}
                        >
                          <FaTrash size={14} />
                        </ActionIcon>
                      )}
                    </FileActions>
                  </FileItem>
                ))}
              </FileList>
            )}

            <ButtonBar>
              {driveFiles.length > 0 ? (
                <DialogButton
                  type="button"
                  $danger
                  disabled={clearingDrive || deletingFileId !== null}
                  onClick={() => setClearDriveConfirmOpen(true)}
                >
                  {clearingDrive ? "Clearing..." : "Clear All"}
                </DialogButton>
              ) : (
                <div />
              )}

              <DialogButton
                type="button"
                disabled={backupLoading || clearingDrive}
                onClick={handleBackup}
                style={{ background: "#1967d2", color: "white" }}
              >
                {backupLoading ? (
                  <>
                    <StyledSpinner style={{ marginRight: "5px" }} /> Backing
                    Up...
                  </>
                ) : (
                  <>
                    <FaGoogleDrive style={{ marginRight: "5px" }} /> Backup Now
                  </>
                )}
              </DialogButton>
            </ButtonBar>
          </FileManagerContainer>
        </CommonDialog>

        {/* Modal: Confirm Deletion of single backup file */}
        <CommonDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          maxWidth="400px"
          title={
            <>
              <FaExclamationTriangle
                color="#ff9800"
                style={{ marginRight: "10px" }}
              />{" "}
              Confirm Deletion
            </>
          }
          description={
            <>
              Are you sure you want to delete{" "}
              <strong>{fileToDelete?.name}</strong> from Google Drive?
            </>
          }
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton $danger onClick={handleDeleteFile}>
                Delete
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>

        {/* Modal: Confirm Clear All backups */}
        <CommonDialog
          open={clearDriveConfirmOpen}
          onOpenChange={setClearDriveConfirmOpen}
          maxWidth="400px"
          title={
            <>
              <FaExclamationTriangle
                color="#ff9800"
                style={{ marginRight: "10px" }}
              />{" "}
              Confirm Clear All
            </>
          }
          description={
            <>
              Are you sure you want to delete <strong>ALL</strong> backup files
              from Google Drive? This cannot be undone.
            </>
          }
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setClearDriveConfirmOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton $danger onClick={handleClearDrive}>
                Clear All
              </DialogButton>
            </DialogButtonGroup>
          }
        ></CommonDialog>

        {/* Modal: Code/JSON Viewer for backup inspection */}
        <CommonDialog
          open={viewCodeOpen}
          onOpenChange={setViewCodeOpen}
          maxWidth="800px"
          title={
            <DialogHeaderWithIcon $fontSize="18px">
              <FaGoogleDrive color="#1967d2" />
              {viewingFile?.name}
            </DialogHeaderWithIcon>
          }
          footer={
            <DialogButtonGroup>
              <DialogButton onClick={() => setViewCodeOpen(false)}>
                Close
              </DialogButton>
            </DialogButtonGroup>
          }
        >
          <CodePreviewContainer>
            {fileContentLoading ? (
              <CodePreviewSkeletonContainer>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonText
                    key={i}
                    $width={`${Math.random() * 40 + 40}%`}
                    $height="14px"
                  />
                ))}
              </CodePreviewSkeletonContainer>
            ) : (
              <CodeBlock onScroll={handleScroll}>
                {displayedLines.join("\n")}
              </CodeBlock>
            )}
          </CodePreviewContainer>
        </CommonDialog>

        {/* System maintenance tool: Run Scripts */}
        <RunScripts
          admin={admin}
          open={runScriptsOpen}
          onOpenChange={setRunScriptsOpen}
        />
      </DashboardContainer>
    </>
  );
}
