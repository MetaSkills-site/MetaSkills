/**
 * @file PassagesList.jsx
 * @description Responsive list display for reading passages featuring difficulty badges, creation dates, and action controls.
 * @architecture Admin presentation component rendering cards inside a ResponsiveGrid with infinite scroll intersection ref support.
 * @agent_note The lastElementRef must be attached to the final item in the array to drive infinite pagination.
 */

import { IconButton } from "../AdminStyles";
import styled from "styled-components";
import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";
import { FaBook } from "react-icons/fa6";
import AdminItemCard from "../AdminItemCard";
import { SkeletonRect } from "../AdminDashboardView";
import EmptyState from "../../EmptyState";
import { ResponsiveGrid } from "../../../styles/Flex.style";
import { DifficultyBadge } from "../../../utils/adminUtils";

const GridContainer = styled(ResponsiveGrid)`
  margin-top: 30px;
`;

const MetaContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AddedDate = styled.span`
  font-size: 12px;
  color: var(--text-muted, #888);
`;

/**
 * PassagesList component displaying grid of passage cards with actions.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.passages - Array of passage objects.
 * @param {boolean} props.loading - Loading state flag.
 * @param {string} [props.searchQuery] - Active search query for empty state feedback.
 * @param {Function} props.onView - Callback when clicking view passage.
 * @param {Function} props.onEdit - Callback when clicking edit passage.
 * @param {Function} props.onDelete - Callback when clicking delete passage.
 * @param {React.Ref} [props.lastElementRef] - Intersection observer ref for infinite scrolling.
 * @returns {JSX.Element} Grid list of passage cards or loading/empty state.
 */
const PassagesList = ({
  passages,
  loading,
  searchQuery,
  onView,
  onEdit,
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
          searchQuery ? "No matching passages found" : "No passages found"
        }
        icon={<FaBook />}
      />
    );
  }

  return (
    <GridContainer>
      {passages.map((passage, index) => (
        <div
          ref={passages.length === index + 1 ? lastElementRef : null}
          key={passage._id}
          style={{ height: "100%" }}
        >
          <AdminItemCard
            direction="column"
            title={passage.title}
            meta={
              <MetaContainer>
                <AddedDate>
                  Added: {new Date(passage.createdAt).toLocaleDateString()}
                </AddedDate>
                {passage.displayDifficulty !== undefined && (
                  <DifficultyBadge difficulty={passage.displayDifficulty} />
                )}
              </MetaContainer>
            }
            actions={
              <>
                <IconButton
                  onClick={() => onView(passage)}
                  title="View Content"
                >
                  <LuEye />
                </IconButton>
                <IconButton onClick={() => onEdit(passage)} title="Edit">
                  <LuPencil />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(passage)}
                  title="Delete"
                  $danger
                >
                  <LuTrash2 />
                </IconButton>
              </>
            }
            fullWidth
            style={{ height: "100%", justifyContent: "space-between" }}
          />
        </div>
      ))}
      {loading && <SkeletonRect $height="200px" />}
    </GridContainer>
  );
};

export default PassagesList;
