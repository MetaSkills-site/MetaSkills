/**
 * @file ModuleList.jsx
 * @description Displays a grid of learning modules for a specific subject.
 * It fetches the user's progress for each module and handles module locking/unlocking logic.
 *
 * @dependencies
 * - react: For context and effect hooks.
 * - react-router-dom: For handling subject parameters and navigation.
 * - styled-components: For layout and module card styling.
 * - @tanstack/react-query: For efficient data fetching and caching of module progress.
 * - SessionContext: To access the current user's grade and authentication token.
 * - toast: For displaying interaction feedback (e.g., when a module is locked).
 * - SkeletonLoader: Provides visual feedback during the loading state.
 * - SurfaceCard: A generic interactive card component.
 *
 * @exports ModuleList (default)
 * @interconnections Fetches module progress from `/api/quiz/modules/progress`.
 */

import { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { SessionContext } from "../context/SessionProvider";
import { Flex } from "../styles/Flex.style";
import { Font } from "../styles/Font.style";
import toast from "react-hot-toast";
import { HomeIcon } from "./admin/AdminStyles";
import { SkeletonRect } from "./SkeletonLoader";
import SurfaceCard from "./common/SurfaceCard";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";

const Container = styled.div`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const ModuleCard = styled(SurfaceCard)`
  /* Custom styling handled via props and SurfaceCard base */
`;

const ModuleTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
`;

const ModuleInfo = styled.div`
  color: #666;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatusBadge = styled.span`
  background: ${(props) => (props.completed ? "#e8f5e9" : "#fff3e0")};
  color: ${(props) => (props.completed ? "#2e7d32" : "#ef6c00")};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
`;

function ModuleList() {
  const { subject } = useParams();
  const { user } = useContext(SessionContext);
  const navigate = useNavigate();

  /**
   * useQuery hook to fetch module progress for the current user and subject.
   * Filters the results client-side based on the user's grade.
   */
  const {
    data: modules = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["modules-progress", user?.id, subject],
    enabled: !!user && !!subject,
    queryFn: async () => {
      const res = await apiClient.post(API_ENDPOINTS.getModulesProgress.url, {
        userId: user.id,
      });
      const json = res.data;
      if (!json.success)
        throw new Error(
          `API error: ${json.message || json.error || "Failed to load modules"}`,
        );

      // Filter modules to match the user's specific grade and the requested subject
      return json.data.filter(
        (m) => m.grades.includes(user.grade) && m.subject === subject,
      );
    },
  });

  // Display toast error if the API fetch fails
  useEffect(() => {
    if (error) toast.error("Failed to load modules");
  }, [error]);

  /**
   * Navigates to the module's questions page if unlocked.
   * @param {Object} module - The module data object.
   */
  const handleModuleClick = (module) => {
    if (module.status === "locked") {
      toast.error("Complete previous modules to unlock this one");
      return;
    }
    navigate(`/module/${module._id}`);
  };

  // Render loading skeletons while data is being fetched
  if (loading)
    return (
      <Container>
        <Flex
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <HomeIcon title="Go back" onClick={() => navigate("/")} />
          <div style={{ textAlign: "center", flex: 1, marginRight: "32px" }}>
            <Font
              $name="Made, segoe ui, sans serif"
              $size="32px"
              $weight="bold"
              $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
              style={{
                display: "block",
                width: "fit-content",
                margin: "0 auto",
              }}
            >
              {subject === "maths" ? "Math Modules" : "English Modules"}
            </Font>
          </div>
        </Flex>
        <ModuleGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "25px",
                boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
              }}
            >
              <SkeletonRect $height="24px" $width="70%" $mb="15px" />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <SkeletonRect $height="16px" $width="30%" />
                <SkeletonRect $height="20px" $width="25%" $radius="12px" />
              </div>
            </div>
          ))}
        </ModuleGrid>
      </Container>
    );

  return (
    <Container>
      <Flex
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <HomeIcon title="Go back" onClick={() => navigate("/")} />
        <div style={{ textAlign: "center", flex: 1, marginRight: "32px" }}>
          <Font
            $name="Made, segoe ui, sans serif"
            $size="32px"
            $weight="bold"
            $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
            style={{
              display: "block",
              width: "fit-content",
              margin: "0 auto",
            }}
          >
            {subject === "maths" ? "Math Modules" : "English Modules"}
          </Font>
        </div>
      </Flex>

      <ModuleGrid>
        {modules.map((module) => {
          const isLocked = module.status === "locked";
          const isCompleted = module.status === "completed";
          const isInProgress = module.status === "in_progress";

          return (
            <ModuleCard
              key={module._id}
              onClick={() => handleModuleClick(module)}
              style={{
                opacity: isLocked ? 0.7 : 1,
                cursor: isLocked ? "not-allowed" : "pointer",
              }}
              shadow="0 10px 20px rgba(0, 0, 0, 0.05)"
              hoverBorder="#f6602a6b"
              hoverShadow="0 15px 30px rgba(0, 0, 0, 0.1)"
              hoverLift="-5px"
              interactive={!isLocked}
            >
              <ModuleTitle>
                {module.name}
                {isLocked && <span style={{ float: "right" }}>🔒</span>}
              </ModuleTitle>
              <ModuleInfo>
                <span>{module.questionIds?.length || 0} Questions</span>
                {isCompleted && <StatusBadge completed>Completed</StatusBadge>}
                {isInProgress && <StatusBadge>In Progress</StatusBadge>}
                {isLocked && <StatusBadge>Locked</StatusBadge>}
                {module.status === "not_started" && (
                  <StatusBadge>Start</StatusBadge>
                )}
              </ModuleInfo>
            </ModuleCard>
          );
        })}
        {modules.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "40px",
              color: "#666",
            }}
          >
            No modules available for your grade yet.
          </div>
        )}
      </ModuleGrid>
    </Container>
  );
}

export default ModuleList;
