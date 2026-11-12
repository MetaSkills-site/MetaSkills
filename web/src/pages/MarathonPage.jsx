/**
 * @file MarathonPage.jsx
 * @description Subject selection portal for marathon practice sessions, routing users to English or Math tracks.
 * @architecture Mounted at `/marathon`, renders DashboardCard components inside a styled container with AdminHeader navigation.
 * @agent_note Serves as the primary branching hub for the marathon practice system, pointing to `/marathon/english` and `/marathon/math`.
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

/**
 * Subject selection page component routing students into specialized marathon practice tracks.
 * @component
 * @returns {JSX.Element}
 */
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
