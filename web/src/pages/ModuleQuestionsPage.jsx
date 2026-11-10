/**
 * FILE PURPOSE: Administrative view for inspecting questions within a specific educational module.
 * Provides a read-only list of all question texts assigned to a module for review.
 *
 * DEPENDENCIES:
 * - SessionContext: Provides authentication headers for secure administrative API calls.
 * - useQuery: Handles parallel data fetching for module metadata and its associated question list.
 * - DOMPurify: Sanitizes HTML content from the database before rendering to prevent XSS.
 *
 * EXPORTS:
 * - ModuleQuestionsPage (default): Administrative question list view.
 *
 * INTERCONNECT:
 * - Accessed via the 'ViewQuestions' admin panel.
 * - Links back to the module management list on close.
 */

import { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { SessionContext } from "../context/SessionProvider";
import { Font } from "../styles/Font.style";
import { Flex } from "../styles/Flex.style";
import { HomeIcon } from "../components/admin/AdminStyles";
import SplashPage from "./SplashPage";
import DOMPurify from "dompurify";
import adminApiClient from "../services/adminApi";
import { API_ENDPOINTS } from "../api/requestMap";

// --- Styled Components ---

const Background = styled.div`
  background: #fafafa;
  min-height: 100vh;
  padding: 20px;
`;

const CardView = styled.div`
  width: 70%;
  margin: 0 auto;
`;

const QuestionCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const QuestionListContainer = styled.div`
  margin-top: 30px;
`;

function ModuleQuestionsPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(SessionContext);

  // --- Data Fetching Logic ---
  const {
    data,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["module-questions", moduleId],
    enabled: !!user && !!moduleId,
    queryFn: async () => {
      // Concurrently fetch module info and its child questions
      const [moduleRes, questionsRes] = await Promise.all([
        adminApiClient.get(API_ENDPOINTS.getModuleById.url({ moduleId })),
        adminApiClient.get(API_ENDPOINTS.getModuleQuestions.url({ moduleId })),
      ]);

      const moduleJson = moduleRes.data;
      const questionsJson = questionsRes.data;

      return {
        module: moduleJson.data,
        questions: questionsJson.data ?? [],
      };
    },
  });

  const module = data?.module ?? null;
  const questions = data?.questions ?? [];

  // --- UI States ---

  if (loading) {
    return <SplashPage />;
  }

  if (isError) {
    return (
      <Background>
        <CardView>
          <div
            role="alert"
            aria-live="assertive"
            style={{
              padding: "20px",
              color: "#d32f2f",
              background: "#ffebee",
              borderRadius: "10px",
            }}
          >
            Failed to load module data: {error?.message || "Unknown error"}
          </div>
        </CardView>
      </Background>
    );
  }

  return (
    <Background>
      <CardView>
        <Flex style={{ justifyContent: "space-between", alignItems: "center" }}>
          {/* Navigate back to the admin module management overview */}
          <HomeIcon
            title="Go back"
            onClick={() => navigate("/admin/viewQuestions")}
          />
          {module && (
            <Font
              $name="Made, segoe ui, sans serif"
              $size="25px"
              style={{
                textAlign: "center",
                margin: "0 auto",
                width: "fit-content",
              }}
              $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
            >
              {module.name}
            </Font>
          )}
        </Flex>

        {/* List Section: Renders all questions sanitized for safe display */}
        <QuestionListContainer>
          {questions.length > 0 ? (
            questions.map((question) => (
              <QuestionCard key={question._id}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(question.questionText),
                  }}
                />
              </QuestionCard>
            ))
          ) : (
            <p>No questions found for this module.</p>
          )}
        </QuestionListContainer>
      </CardView>
    </Background>
  );
}

export default ModuleQuestionsPage;
