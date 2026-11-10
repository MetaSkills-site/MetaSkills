import { IconButton } from "../AdminStyles";
import styled from "styled-components";
import { LuTrash2, LuFileText } from "react-icons/lu";
import AdminItemCard from "../AdminItemCard";
import { SkeletonRect } from "../AdminDashboardView";
import EmptyState from "../../EmptyState";
import { ResponsiveGrid } from "../../../styles/Flex.style";
import { DifficultyBadge } from "../../../utils/adminUtils";

const GridContainer = styled(ResponsiveGrid)`
  margin-top: 30px;
`;

const SentencesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
`;

const MetaContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SentencesList = ({
  passages,
  loading,
  searchQuery,
  onDelete,
  lastElementRef,
}) => {
  if (loading && passages.length === 0) {
    return (
      <GridContainer>
        {[1, 2, 3].map((i) => (
          <SkeletonRect key={i} $height="200px" />
        ))}
      </GridContainer>
    );
  }

  if (passages.length === 0) {
    return (
      <EmptyState
        message={
          searchQuery ? "No matching sentences found" : "No sentences found"
        }
        icon={<LuFileText />}
      />
    );
  }

  return (
    <SentencesContainer>
      {passages.map((sentence, index) => (
        <div
          ref={passages.length === index + 1 ? lastElementRef : null}
          key={sentence._id}
        >
          <AdminItemCard
            title={sentence.text}
            meta={
              <MetaContainer>
                {sentence.displayDifficulty !== undefined && (
                  <DifficultyBadge difficulty={sentence.displayDifficulty} />
                )}
              </MetaContainer>
            }
            actions={
              <IconButton
                onClick={() => onDelete(sentence)}
                title="Delete"
                $danger
              >
                <LuTrash2 />
              </IconButton>
            }
          />
        </div>
      ))}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "10px",
            color: "var(--text-secondary, #666)",
          }}
        >
          Loading more...
        </div>
      )}
    </SentencesContainer>
  );
};

export default SentencesList;
