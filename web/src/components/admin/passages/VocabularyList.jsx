/**
 * @file VocabularyList.jsx
 * @description Responsive grid view for vocabulary entries with search feedback and infinite scrolling.
 * @architecture Admin presentation layer component organizing VocabItem instances within a ResponsiveGrid layout.
 * @agent_note Connects lastElementRef to the final VocabItem to trigger infinite scroll pagination.
 */

import styled from "styled-components";
import { FaSpellCheck } from "react-icons/fa6";
import { SkeletonRect } from "../AdminDashboardView";
import EmptyState from "../../EmptyState";
import VocabItem from "./VocabItem";
import { ResponsiveGrid } from "../../../styles/Flex.style";

const GridContainer = styled(ResponsiveGrid)`
  margin-top: 30px;
`;

/**
 * VocabularyList component displaying a grid of vocabulary cards.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.vocabulary - List of vocabulary objects.
 * @param {boolean} props.loading - Loading state flag.
 * @param {string} [props.searchQuery] - Query string used to filter list.
 * @param {Function} props.onView - View action handler.
 * @param {Function} props.onEdit - Edit action handler.
 * @param {Function} props.onDelete - Delete action handler.
 * @param {React.Ref} [props.lastElementRef] - Observer ref for the last item in the list.
 * @returns {JSX.Element} Grid of vocabulary items, skeleton loaders, or empty state.
 */
const VocabularyList = ({
  vocabulary,
  loading,
  searchQuery,
  onView,
  onEdit,
  onDelete,
  lastElementRef,
}) => {
  if (loading && vocabulary.length === 0) {
    return (
      <GridContainer>
        {[1, 2, 3].map((i) => (
          <SkeletonRect key={i} $height="200px" />
        ))}
      </GridContainer>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <EmptyState
        message={
          searchQuery ? "No matching vocabulary found" : "No vocabulary found"
        }
        icon={<FaSpellCheck />}
      />
    );
  }

  return (
    <GridContainer>
      {vocabulary.map((vocab, index) => (
        <VocabItem
          key={vocab._id}
          vocab={vocab}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          innerRef={vocabulary.length === index + 1 ? lastElementRef : null}
        />
      ))}
      {loading && (
        <>
          <SkeletonRect $height="200px" />
          <SkeletonRect $height="200px" />
          <SkeletonRect $height="200px" />
        </>
      )}
    </GridContainer>
  );
};

export default VocabularyList;
