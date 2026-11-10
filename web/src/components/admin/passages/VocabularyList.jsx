import styled from "styled-components";
import { FaSpellCheck } from "react-icons/fa6";
import { SkeletonRect } from "../AdminDashboardView";
import EmptyState from "../../EmptyState";
import VocabItem from "./VocabItem";
import { ResponsiveGrid } from "../../../styles/Flex.style";

const GridContainer = styled(ResponsiveGrid)`
  margin-top: 30px;
`;

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
