/**
 * FILE PURPOSE: Dynamic topic selector for the Math MarathonPage.
 * Handles hierarchical navigation through math categories (e.g., Arithmetic -> Simple Arithmetic) and specific sum types.
 *
 * DEPENDENCIES:
 * - SessionContext: Provides user token for secure topic fetching.
 * - axios: Fetches hierarchical topic data based on the 'path' search param.
 * - DashboardCard: UI component for topic/category display.
 * - AdminHeader: Standardized header with back-navigation.
 *
 * EXPORTS:
 * - MathMarathonPage (default): Topic discovery and navigation page for Math.
 *
 * INTERCONNECT:
 * - Synchronizes with browser URL search parameters to manage navigation state ('?path=...').
 * - Implements 'Auto-start' logic: if a category contains only one specific question type, it redirects directly to the attempt page.
 * - Bridges the gap between subject selection and specific math problem attempts.
 */

import { useState, useEffect, useContext, useCallback } from "react";
import styled from "styled-components";
import { FaCalculator, FaPen } from "react-icons/fa";
import { IoCubeOutline } from "react-icons/io5";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";
import toast from "react-hot-toast";

import DashboardCard from "../components/DashboardCard";
import AdminHeader from "../components/admin/AdminHeader";
import { SessionContext } from "../context/SessionProvider";
import SplashPage from "./SplashPage";

// --- Styled Components ---

const Background = styled.div`
  background: #fafafa;
  min-height: 100vh;
  padding: 40px;
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
`;

const TitleHeader = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  margin-bottom: 20px;
`;

function MathMarathonPage() {
  const { user } = useContext(SessionContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // currentPath: Tracks the user's position in the math hierarchy (e.g., "Arithmetic,Algebra")
  const currentPath = searchParams.get("path");

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * fetchTopics: Retrieves sub-topics or leaf-node questions for the current path.
   */
  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      // Encode path to handle special characters in topic names
      const pathQuery = currentPath
        ? `?path=${encodeURIComponent(currentPath)}`
        : "";
      const res = await apiClient.get(
        `${API_ENDPOINTS.getMathTopics.url}${pathQuery}`,
      );

      if (res.data.success) {
        const fetchedTopics = res.data.data;
        setTopics(fetchedTopics);

        // AUTO-START LOGIC: If a category has exactly one item and it's a specific question type (isSum),
        // skip the menu and go straight to the question.
        if (
          fetchedTopics.length === 1 &&
          fetchedTopics[0].isSum &&
          fetchedTopics[0].id
        ) {
          // Use 'replace' to ensure the user can back-out of the question without getting stuck in a redirect loop.
          navigate(`/marathon/math/attempt/${fetchedTopics[0].id}`, {
            replace: true,
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load topics");
    } finally {
      setLoading(false);
    }
  }, [currentPath, user?.token, navigate]);

  // Trigger fetch whenever the URL 'path' parameter changes
  useEffect(() => {
    if (user) {
      fetchTopics();
    }
  }, [user, currentPath, fetchTopics]);

  /**
   * handleTopicClick: Manages navigation based on the topic type.
   */
  const handleTopicClick = useCallback(
    (topic) => {
      if (topic.type === "category" && !topic.isSum) {
        // Topic is a branch: Navigate deeper into the hierarchy by updating the URL 'path'
        setSearchParams({ path: topic.path });
      } else if (topic.isSum && topic.id) {
        // Topic is a leaf node: Navigate to the actual question attempt view
        navigate(`/marathon/math/attempt/${topic.id}`);
      } else {
        toast.error("No questions available in this category");
      }
    },
    [setSearchParams, navigate],
  );

  /**
   * handleBack: Manages upward navigation.
   * Leverages browser history (-1) to traverse the dynamic path stack.
   */
  const handleBack = useCallback(() => {
    if (!currentPath) {
      // At root: Return to subject selection
      navigate("/marathon");
      return;
    }
    // Deep in hierarchy: Step back using browser history stack
    navigate(-1);
  }, [currentPath, navigate]);

  // Loading state
  if (loading) return <SplashPage />;

  return (
    <Background>
      {/* Navigation Header with dynamic back button logic */}
      <TitleHeader>
        <AdminHeader
          title="Math Marathon"
          backPath="/marathon"
          customBack={handleBack}
        />
      </TitleHeader>

      {/* Topic List */}
      <Container>
        {topics.map((topic) => (
          <DashboardCard
            key={topic.id || topic.name}
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleTopicClick(topic);
            }}
            icon={
              topic.isSum ? (
                <FaPen />
              ) : topic.type === "category" ? (
                <IoCubeOutline />
              ) : (
                <FaCalculator />
              )
            }
            title={topic.name}
            description={
              topic.isSum
                ? "Practice this specific question type."
                : "Explore this topic"
            }
            variant="horizontal"
            style={
              topic.isSum
                ? { borderLeft: "5px solid #ff5722", paddingLeft: "25px" }
                : {}
            }
          />
        ))}

        {/* Empty State */}
        {topics.length === 0 && (
          <div style={{ textAlign: "center", color: "#666" }}>
            No topics found.
          </div>
        )}
      </Container>
    </Background>
  );
}

export default MathMarathonPage;
