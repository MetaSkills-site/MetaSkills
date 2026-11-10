/**
 * FILE PURPOSE: Subject selection portal for the MarathonPage feature.
 * Serves as the primary entry point where users choose between different subject-specific marathon paths (e.g., English, Math).
 *
 * DEPENDENCIES:
 * - DashboardCard: Navigation card component with icon, title, and description.
 * - AdminHeader: Standardized page header with a back-navigation button.
 * - react-icons: Provides subject-specific iconography (FaBook, FaCalculator).
 *
 * EXPORTS:
 * - MarathonPage (default): Subject selection view (consumed by src/main.jsx for routing).
 *
 * INTERCONNECT:
 * - Links to specialized marathon sub-pages like '/marathon/english' and '/marathon/math'.
 * - Provides a clear path back to the main user dashboard.
 */

import styled from "styled-components";
import { FaBook, FaCalculator } from "react-icons/fa";
import DashboardCard from "../components/DashboardCard";
import AdminHeader from "../components/admin/AdminHeader";

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
  gap: 30px;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  flex-wrap: wrap;
`;

const TitleHeader = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  margin-bottom: 20px;
`;

function MarathonPage() {
  return (
    <Background>
      {/* Navigation Header */}
      <TitleHeader>
        <AdminHeader title="Marathon" backPath="/dashboard" />
      </TitleHeader>

      {/* Subject Selection Grid */}
      <Container>
        {/* English Subject Path */}
        <DashboardCard
          to="/marathon/english"
          icon={<FaBook />}
          title="English"
          description="Master the language with engaging stories and challenges."
        />

        {/* Mathematics Subject Path */}
        <DashboardCard
          to="/marathon/math"
          icon={<FaCalculator />}
          title="Math"
          description="Solve problems and sharpen your analytical skills."
        />
      </Container>
    </Background>
  );
}

export default MarathonPage;
