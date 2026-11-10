/**
 * ModulesQuestionsViewPage.jsx
 *
 * PURPOSE:
 * A primary navigation hub for content management in the admin section. It provides
 * quick access to module management, question browsing, and context attachment management.
 *
 * DEPENDENCIES:
 * - react-icons: For visual identifiers on dashboard cards.
 * - styled-components: For page layout and container styling.
 * - AdminHeader: Shared header for admin pages.
 * - DashboardCard: Reusable card component for navigation links.
 *
 * EXPORTS:
 * - ModulesQuestionsViewPage (default): The landing page component.
 *
 * INTERCONNECTIONS:
 * - Links to:
 *   - /admin/modules: Module management.
 *   - /admin/all-questions: Global question database.
 *   - /admin/context-attachments: Shared context management.
 */

import styled from "styled-components";
import { FaLayerGroup, FaListUl } from "react-icons/fa";
import AdminHeader from "../../components/admin/AdminHeader";
import { PageContainer, Wrapper } from "../../components/admin/AdminStyles";
import DashboardCard from "../../components/DashboardCard";

/**
 * Container
 * A centered, flex-wrapped container that holds navigation cards.
 */
const Container = styled.div`
  display: flex;
  gap: 30px;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  flex-wrap: wrap;
`;

export default function ModulesQuestionsViewPage() {
  return (
    <Wrapper>
      <PageContainer>
        {/* Page header with back navigation to root admin page */}
        <AdminHeader title="Content Management" backPath="/admin" />

        <Container>
          {/* Card for Module Management */}
          <DashboardCard
            to="/admin/modules"
            icon={<FaLayerGroup />}
            title="View Modules"
            description="Manage learning modules, organize content, and structure the curriculum."
          />

          {/* Card for Question Database */}
          <DashboardCard
            to="/admin/all-questions"
            icon={<FaListUl />}
            title="View Questions"
            description="Browse all questions, filter by tags, and assign them to modules."
          />

          {/* Card for Context Attachments (Passages/Case Studies) */}
          <DashboardCard
            to="/admin/context-attachments"
            icon={<FaLayerGroup />}
            title="Context Attachments"
            description="View and manage context attachments."
          />
        </Container>
      </PageContainer>
    </Wrapper>
  );
}
