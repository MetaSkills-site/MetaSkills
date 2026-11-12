/**
 * @file ModulesQuestionsViewPage.jsx
 * @description Administrative navigation hub for content management including learning modules, question catalogs, and context attachments.
 * @architecture Mounted within the admin routing tree, rendering DashboardCard links with AdminHeader navigation.
 * @agent_note Serves as a portal linking to `/admin/modules`, `/admin/all-questions`, and `/admin/context-attachments`.
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

/**
 * Admin content management landing page component routing administrators to modules, questions, and context attachments.
 * @component
 * @returns {JSX.Element}
 */
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
