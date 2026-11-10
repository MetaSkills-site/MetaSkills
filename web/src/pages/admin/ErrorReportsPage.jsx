/**
 * @file ErrorReports.jsx
 * @description Admin dashboard for reviewing and resolving user-submitted error reports and feedback.
 *
 * Dependencies:
 * - @tanstack/react-query: Manages fetching, caching, and state synchronization for error reports.
 * - styled-components: For layout, card-based reporting UI, and status-based styling.
 * - adminService: API service for fetching and resolving (deleting) error reports.
 *
 * Exports:
 * - ErrorReports (default): The main functional component for the error reporting dashboard.
 *
 * Interconnections:
 * - Accessible from the Admin Dashboard.
 */

import { IconButton } from "../../components/admin/AdminStyles";
import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Flex } from "../../styles/Flex.style";
import { Font } from "../../styles/Font.style";
import {
  FaCheckCircle,
  FaDesktop,
  FaGlobe,
  FaInfoCircle,
  FaEye,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonRect } from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import CommonDialog from "../../components/common/CommonDialog";
import {
  Wrapper,
  PageContainer,
  Button,
  QuestionListContainer,
} from "../../components/admin/AdminStyles";
import AdminHeader from "../../components/admin/AdminHeader";
import { SearchContainer } from "../../components/admin/SearchAndFilter";
import {
  getErrorReports,
  deleteErrorReport,
  deleteAllErrorReports,
} from "../../services/adminService";

/**
 * Styled card for displaying a single error report's summary.
 */
const ReportCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  border-left: 5px solid #ff5722;
`;

/**
 * Chip for displaying environment and system metadata.
 */
const MetadataTag = styled.span`
  background: #f8fafc;
  color: #475569;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  border: 1px solid #e2e8f0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;

  svg {
    color: #94a3b8;
  }
`;

const TypeBadge = styled.span`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) => (props.$type === "manual" ? "#e3f2fd" : "#ffebee")};
  color: ${(props) => (props.$type === "manual" ? "#1976d2" : "#d32f2f")};
  border: 1px solid
    ${(props) => (props.$type === "manual" ? "#bbdefb" : "#ffcdd2")};
`;

const CategoryTag = styled(MetadataTag)`
  background: #f3e5f5;
  color: #7b1fa2;
  border-color: #e1bee7;
`;

const DetailText = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 5px;
  span {
    font-weight: 600;
  }
`;

/**
 * Highlighted box for user-provided description of the error.
 */
const UserDescBox = styled.div`
  background: #fff3e0;
  padding: 10px 15px;
  border-radius: 8px;
  margin-top: 15px;
  font-size: 14px;
  color: #e65100;
  border: 1px dashed #ffb74d;
  text-decoration: ${(props) => (props.$isResolving ? "line-through" : "none")};
  opacity: ${(props) => (props.$isResolving ? 0.7 : 1)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionHeaderFlex = styled(Flex)`
  gap: 12px;
  margin: 10px 0 20px auto;
  width: -moz-fit-content;
  width: fit-content;
`;

/**
 * Specialized button for bulk resolution of all reports.
 */
const ResolveAllButton = styled(Button)`
  font-size: 14px;
  padding: 8px 16px;
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
`;

const ReportContentFlex = styled(Flex)`
  justify-content: space-between;
  align-items: flex-start;
`;

/**
 * Wrapper for report details that fades and strikes through during the 'undo' countdown.
 */
const ReportDetailsFlex = styled(Flex)`
  pointer-events: ${(props) => (props.$isResolving ? "none" : "auto")};
  flex: 1;
  opacity: ${(props) => (props.$isResolving ? 0.4 : 1)};
  filter: ${(props) => (props.$isResolving ? "grayscale(100%)" : "none")};
  transition: all 0.3s ease;
`;

/**
 * Displays the sequence index of the report in the list.
 */
const IndexNumberDisplay = styled(Font)`
  display: block;
  border-right: solid 2px rgba(204, 204, 204, 0.23);
  padding-right: 5px;
  margin-right: 15px;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  min-width: 20px;
  margin-top: 5px;
`;

const MetadataContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
  text-decoration: ${(props) => (props.$isResolving ? "line-through" : "none")};
  opacity: ${(props) => (props.$isResolving ? 0.7 : 1)};
`;

/**
 * Cancel button shown during the resolution countdown.
 */
const CancelButton = styled(Button)`
  background: #f44336;
  color: white;
  border-color: #d32f2f;
  padding: 8px 16px;
  font-size: 13px;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
  min-width: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ReportActionsFlex = styled(Flex)`
  gap: 15px;
  padding-left: 20px;
  align-items: center;
`;

export default function ErrorReportsPage() {
  const queryClient = useQueryClient();

  // Resolution "Undo" logic state management.
  // Uses refs for timers to ensure consistency across re-renders.
  const [resolveAllOpen, setResolveAllOpen] = useState(false);
  const [resolvingIds, setResolvingIds] = useState(new Set());
  const [resolveCountdowns, setResolveCountdowns] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const resolveTimers = useRef({});
  const countdownIntervals = useRef({});

  // Cleanup logic: Ensure all active timers and intervals are cleared on component unmount.
  useEffect(() => {
    return () => clearAllPendingResolutions();
  }, []);

  /**
   * Helper to cancel all currently active resolution countdowns and timers.
   * Prevents race conditions when bulk actions are performed.
   */
  const clearAllPendingResolutions = () => {
    // Stop all pending resolution timeouts
    Object.keys(resolveTimers.current).forEach((reportId) => {
      if (resolveTimers.current[reportId]) {
        clearTimeout(resolveTimers.current[reportId]);
        delete resolveTimers.current[reportId];
      }
    });

    // Stop all countdown intervals
    Object.keys(countdownIntervals.current).forEach((reportId) => {
      if (countdownIntervals.current[reportId]) {
        clearInterval(countdownIntervals.current[reportId]);
        delete countdownIntervals.current[reportId];
      }
    });

    // Reset visual and internal tracking states
    setResolvingIds(new Set());
    setResolveCountdowns({});
  };

  // ── Queries ────────────────────────────────────────────────────────────────

  /**
   * Fetches the list of active error reports.
   */
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["errorReports"],
    queryFn: () => getErrorReports(),
  });

  const reports = Array.isArray(data?.data) ? data.data : [];

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Mutation to delete/resolve a single report.
   */
  const resolveReportMutation = useMutation({
    mutationFn: (reportId) => deleteErrorReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["errorReports"] });
      toast.success("Report marked as resolved");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to resolve report");
    },
  });

  /**
   * Mutation to clear all error reports.
   */
  const resolveAllMutation = useMutation({
    mutationFn: () => deleteAllErrorReports(),
    onMutate: () => {
      // Immediately halt any individual timer actions to prevent concurrent deletion attempts
      clearAllPendingResolutions();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["errorReports"] });
      toast.success("All reports marked as resolved");
      setResolveAllOpen(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to resolve all reports");
    },
  });

  // ── Countdown logic ───────────────────────────────────────────────────────

  /**
   * Starts a 5-second countdown before finalizing the resolution of a report.
   * This provides the admin with a safety window to cancel accidental clicks.
   */
  const initiateResolve = (reportId) => {
    setResolvingIds((prev) => new Set([...prev, reportId]));
    setResolveCountdowns((prev) => ({ ...prev, [reportId]: 5 }));

    // Update the visual countdown every second.
    countdownIntervals.current[reportId] = setInterval(() => {
      setResolveCountdowns((prev) => {
        const current = prev[reportId];
        if (current <= 1) {
          clearInterval(countdownIntervals.current[reportId]);
          return prev;
        }
        return { ...prev, [reportId]: current - 1 };
      });
    }, 1000);

    // Schedule the actual API call after the 5-second delay.
    resolveTimers.current[reportId] = setTimeout(() => {
      resolveReportMutation.mutate(reportId, {
        onSettled: () => {
          // Cleanup internal tracking state after mutation completes.
          setResolvingIds((prev) => {
            const s = new Set(prev);
            s.delete(reportId);
            return s;
          });
          setResolveCountdowns((prev) => {
            const d = { ...prev };
            delete d[reportId];
            return d;
          });
          delete resolveTimers.current[reportId];
          clearInterval(countdownIntervals.current[reportId]);
          delete countdownIntervals.current[reportId];
        },
      });
    }, 5000);
  };

  /**
   * Aborts a pending resolution and clears all associated timers.
   */
  const cancelResolve = (reportId) => {
    if (resolveTimers.current[reportId]) {
      clearTimeout(resolveTimers.current[reportId]);
      delete resolveTimers.current[reportId];
      clearInterval(countdownIntervals.current[reportId]);
      delete countdownIntervals.current[reportId];
      setResolvingIds((prev) => {
        const s = new Set(prev);
        s.delete(reportId);
        return s;
      });
      setResolveCountdowns((prev) => {
        const d = { ...prev };
        delete d[reportId];
        return d;
      });
      toast("Resolution canceled", { icon: "ℹ️" });
    }
  };

  /**
   * Opens the detailed view modal for a report.
   */
  const openDetails = (report) => {
    setSelectedReport(report);
    setIsDetailsOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Wrapper>
      <PageContainer>
        <AdminHeader title="Error Reports" backPath="/admin" />

        <SearchContainer
          style={{ marginBottom: "20px" }}
          count={reports.length}
          label="Detailed Reports"
        />

        <ActionHeaderFlex>
          <ResolveAllButton
            onClick={() => setResolveAllOpen(true)}
            disabled={reports.length === 0}
          >
            <FaCheckCircle /> Resolve All
          </ResolveAllButton>
        </ActionHeaderFlex>

        <QuestionListContainer>
          {isError ? (
            <div
              style={{
                padding: "20px",
                color: "#d32f2f",
                background: "#ffebee",
                borderRadius: "8px",
              }}
            >
              Failed to load error reports: {error?.message || "Unknown error"}
            </div>
          ) : isLoading ? (
            // Render loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <ReportCard key={i}>
                <Flex style={{ gap: "15px", alignItems: "center" }}>
                  <SkeletonRect $width="30px" $height="30px" />
                  <div style={{ flex: 1 }}>
                    <SkeletonRect $width="100%" $height="60px" />
                  </div>
                </Flex>
              </ReportCard>
            ))
          ) : reports.length > 0 ? (
            reports.map((report, index) => {
              const isResolving = resolvingIds.has(report._id);

              return (
                <ReportCard
                  key={report._id}
                  style={{
                    borderLeftColor: isResolving ? "#9e9e9e" : "#ff5722",
                    transition: "all 0.3s ease",
                  }}
                >
                  <ReportContentFlex>
                    <ReportDetailsFlex $isResolving={isResolving}>
                      <IndexNumberDisplay
                        $weight={700}
                        $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
                      >
                        {index + 1}
                      </IndexNumberDisplay>
                      <div style={{ flex: 1 }}>
                        <DetailText
                          style={{
                            textDecoration: isResolving
                              ? "line-through"
                              : "none",
                          }}
                        >
                          <span>Reported by:</span>{" "}
                          {report.user?.fullname ||
                            report.user?.name ||
                            "Unknown"}{" "}
                          ({report.user?.email || "No email"})
                        </DetailText>

                        <UserDescBox $isResolving={isResolving}>
                          <strong>User Comments: </strong>{" "}
                          {report.userDescription}
                        </UserDescBox>

                        <MetadataContainer $isResolving={isResolving}>
                          <TypeBadge $type={report.reportType || "manual"}>
                            {report.reportType === "automatic"
                              ? "System Crash"
                              : "User Report"}
                          </TypeBadge>
                          <CategoryTag>
                            {report.category
                              ?.replace(/_/g, " ")
                              .toUpperCase() || "OTHER"}
                          </CategoryTag>
                          <MetadataTag>
                            <FaDesktop /> {report.environment}
                          </MetadataTag>
                        </MetadataContainer>
                      </div>
                    </ReportDetailsFlex>
                    <ReportActionsFlex>
                      {!isResolving && (
                        <IconButton
                          onClick={() => openDetails(report)}
                          title="View Details"
                        >
                          <FaEye />
                        </IconButton>
                      )}
                      {isResolving ? (
                        <CancelButton onClick={() => cancelResolve(report._id)}>
                          ({resolveCountdowns[report._id] || 0}s) Cancel
                        </CancelButton>
                      ) : (
                        <IconButton
                          $success
                          onClick={() => initiateResolve(report._id)}
                          title="Mark as Resolved"
                          disabled={resolveAllMutation.isPending}
                        >
                          <FaCheckCircle />
                        </IconButton>
                      )}
                    </ReportActionsFlex>
                  </ReportContentFlex>
                </ReportCard>
              );
            })
          ) : (
            <EmptyState
              message="No pending error reports."
              icon={<FaCheckCircle />}
            />
          )}
        </QuestionListContainer>

        {/* Error Report Details Modal */}
        <CommonDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          title="Error Report Details"
          maxWidth="700px"
        >
          {selectedReport && (
            <div style={{ paddingBottom: "20px" }}>
              <div
                style={{
                  borderLeft: "5px solid #ff5722",
                  paddingLeft: "15px",
                  marginBottom: "20px",
                }}
              >
                <DetailText style={{ fontSize: "15px" }}>
                  <span>Reported by:</span>{" "}
                  {selectedReport.user?.fullname ||
                    selectedReport.user?.name ||
                    "Unknown"}{" "}
                  ({selectedReport.user?.email || "No email"})
                </DetailText>
                <DetailText style={{ fontSize: "14px", marginTop: "8px" }}>
                  <span>Type:</span>{" "}
                  <TypeBadge
                    $type={selectedReport.reportType || "manual"}
                    style={{ marginLeft: "5px" }}
                  >
                    {selectedReport.reportType === "automatic"
                      ? "System Crash"
                      : "User Report"}
                  </TypeBadge>
                </DetailText>
                <DetailText style={{ fontSize: "14px", marginTop: "8px" }}>
                  <span>Category:</span>{" "}
                  <CategoryTag style={{ marginLeft: "5px" }}>
                    {selectedReport.category
                      ?.replace(/_/g, " ")
                      .toUpperCase() || "OTHER"}
                  </CategoryTag>
                </DetailText>
                <DetailText style={{ fontSize: "14px", marginTop: "8px" }}>
                  <span>Environment:</span> {selectedReport.environment}
                </DetailText>
                <DetailText style={{ fontSize: "14px", marginTop: "5px" }}>
                  <span>Date:</span>{" "}
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </DetailText>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <Font $weight={600} style={{ marginBottom: "8px" }}>
                  System Metadata
                </Font>
                {selectedReport.systemMetadata ? (
                  <MetadataContainer>
                    <MetadataTag>
                      <FaDesktop /> Window:{" "}
                      {selectedReport.systemMetadata?.windowSize || "N/A"}
                    </MetadataTag>
                    <MetadataTag>
                      <FaGlobe /> Locale:{" "}
                      {selectedReport.systemMetadata?.language || "Unknown"} (
                      {selectedReport.systemMetadata?.timeZone || "N/A"})
                    </MetadataTag>
                    <MetadataTag>
                      <FaInfoCircle />{" "}
                      {selectedReport.systemMetadata?.userAgent ||
                        "No user agent info"}
                    </MetadataTag>
                  </MetadataContainer>
                ) : (
                  <DetailText>No system metadata available.</DetailText>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <Font $weight={600} style={{ marginBottom: "8px" }}>
                  User Comments
                </Font>
                <div
                  style={{
                    background: "#fff3e0",
                    padding: "15px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: "#e65100",
                    border: "1px dashed #ffb74d",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedReport.userDescription || "No comments provided."}
                </div>
              </div>

              {selectedReport.screenshotUrl && (
                <div>
                  <Font $weight={600} style={{ marginBottom: "8px" }}>
                    Attached Screenshot
                  </Font>
                  <img
                    src={selectedReport.screenshotUrl}
                    alt="Error Screenshot"
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      marginTop: "10px",
                    }}
                  />
                  <Button
                    style={{ marginTop: "15px", width: "100%" }}
                    onClick={() =>
                      window.open(
                        selectedReport.screenshotUrl,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    Open Screenshot in New Tab
                  </Button>
                </div>
              )}
            </div>
          )}
        </CommonDialog>

        {/* Resolve All Confirmation Modal */}
        <CommonDialog
          open={resolveAllOpen}
          onOpenChange={setResolveAllOpen}
          title="Resolve All Reports"
          description="Are you sure you want to resolve and permanently delete ALL error reports? This cannot be undone."
          confirmLabel="Resolve All"
          cancelLabel="Cancel"
          onConfirm={() => resolveAllMutation.mutate()}
          onCancel={() => setResolveAllOpen(false)}
          confirmLoading={resolveAllMutation.isPending}
        ></CommonDialog>
      </PageContainer>
    </Wrapper>
  );
}
