/**
 * @file MarathonManagementPage.jsx
 * @description A dashboard-style component providing navigation to different Marathon management modules (English, Math, etc.).
 *
 * Dependencies:
 * - styled-components: For custom CSS layouts.
 * - react-icons/fa: Icons for English and Math modules.
 * - ./AdminHeader: Shared header component for admin pages.
 * - ./AdminStyles: Common styled components for admin layouts.
 * - ../DashboardCard: Component for rendering clickable navigation cards.
 *
 * Exports:
 * - MarathonManagementPage (default): The main management entry point for Marathon settings.
 *
 * Interconnections:
 * - Accessible from the main Admin dashboard.
 * - Links to specific sub-management tools like 'View Passages'.
 */

import styled from "styled-components";
import { FaBook, FaCalculator } from "react-icons/fa";
import AdminHeader from "../../components/admin/AdminHeader";
import { PageContainer, Wrapper } from "../../components/admin/AdminStyles";
import DashboardCard from "../../components/DashboardCard";

/**
 * Styled layout for centering and wrapping marathon management options.
 */
const Container = styled.div`
  display: flex;
  gap: 30px;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  flex-wrap: wrap;
`;

export default function MarathonManagementPage() {
  return (
    <Wrapper>
      <PageContainer>
        {/* Render the header with a back button leading to the root admin page. */}
        <AdminHeader title="Manage Marathon" backPath="/admin" />

        <Container>
          {/* Navigation card for English marathon management (Passages). */}
          <DashboardCard
            to="/admin/view-passages"
            icon={<FaBook />}
            title="English"
            description="Manage books and reading materials for the English marathon."
            style={{ textDecoration: "none" }}
          />

          {/* Placeholder navigation card for Math marathon management (Currently Disabled). */}
          <DashboardCard
            to="#"
            icon={<FaCalculator />}
            title="Math"
            description="Manage math problems and resources."
            aria-disabled="true"
            tabIndex={-1}
            style={{
              textDecoration: "none",
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
        </Container>
      </PageContainer>
    </Wrapper>
  );
}
