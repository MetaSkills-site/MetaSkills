/**
 * @file MarathonEnglishPage.jsx
 * @description Navigation sub-menu for English marathon modes including Grammar, Vocabulary, and Reading Comprehension activities.
 * @architecture Mounted at `/marathon/english`, renders navigation cards with AdminHeader, and launches modal overlay menus for vocabulary exercises.
 * @agent_note Manages local state for vocabulary overlay sub-menu toggling while routing to individual marathon exercise paths.
 */

import styled from "styled-components";
import { FaBook, FaScroll } from "react-icons/fa";
import { IoLibrary } from "react-icons/io5";
import { useState } from "react";
import DashboardCard from "../components/DashboardCard";
import AdminHeader from "../components/admin/AdminHeader";
import VocabularyMarathonMenu from "../components/Marathon/VocabularyMarathonMenu";

// --- Styled Components ---

const Background = styled.div`
  background: #fafafa;
  min-height: 100vh;
  padding: 40px;
  display: flex;
  flex-direction: column;
`;

/**
 * Container: Vertically centered stack for the navigation cards.
 */
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

/**
 * English marathon portal page component providing access to grammar, vocabulary, and reading comprehension modes.
 * @component
 * @returns {JSX.Element}
 */
function MarathonEnglishPage() {
  const [isVocabMenuOpen, setIsVocabMenuOpen] = useState(false);

  return (
    <Background>
      {/* Page Header with navigation back to Subject Selection */}
      <TitleHeader>
        <AdminHeader title="English Marathon" backPath="/marathon" />
      </TitleHeader>

      {/* Navigation Options */}
      <Container>
        {/* Grammar Mode: Mechanics and rules */}
        <DashboardCard
          variant="horizontal"
          to="/marathon/english/grammar"
          icon={<IoLibrary />}
          title="Grammar Marathon"
          description="Focus on mechanics: Tenses, Plurals, Negatives, and more."
        />

        {/* Vocabulary Mode: Triggers a secondary menu for sub-types (Synonyms, Sentence Practice, etc.) */}
        <DashboardCard
          variant="horizontal"
          to="#"
          onClick={(e) => {
            e.preventDefault();
            setIsVocabMenuOpen(true);
          }}
          icon={<FaBook />}
          title="Vocabulary Marathon"
          description="Expand your lexicon with synonym challenges, word games, and sentence practice."
        />

        {/* History Mode: Passage-based reading comprehension */}
        <DashboardCard
          variant="horizontal"
          to="/marathon/english/history"
          icon={<FaScroll />}
          title="History Marathon"
          description="Read interesting passages and fill in the missing details."
        />
      </Container>

      {/* Vocabulary Sub-Menu Overlay */}
      <VocabularyMarathonMenu
        isOpen={isVocabMenuOpen}
        onClose={() => setIsVocabMenuOpen(false)}
      />
    </Background>
  );
}

export default MarathonEnglishPage;
