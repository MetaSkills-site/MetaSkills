/**
 * @file VocabItem.jsx
 * @description Individual vocabulary card component displaying word, definition, difficulty, and CRUD actions.
 * @architecture Granular memoized item card in the admin vocabulary management view layer.
 * @agent_note Wrapped with React.memo; memoize handler props in parent lists to preserve rendering efficiency.
 */

import { IconButton } from "../AdminStyles";
import React from "react";
import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";
import AdminItemCard from "../AdminItemCard";
import { DifficultyBadge } from "../../../utils/adminUtils";
import styled from "styled-components";

const VocabDefinition = styled.div`
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

/**
 * VocabItem component rendering a single vocabulary card.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.vocab - Vocabulary item data.
 * @param {string} props.vocab.word - Vocabulary term.
 * @param {string} props.vocab.definition - Term definition.
 * @param {number|string} [props.vocab.displayDifficulty] - Formatted difficulty rating.
 * @param {Function} props.onView - Callback for viewing vocabulary item.
 * @param {Function} props.onEdit - Callback for editing vocabulary item.
 * @param {Function} props.onDelete - Callback for deleting vocabulary item.
 * @param {React.Ref} [props.innerRef] - Ref passed to root element for scroll tracking.
 * @returns {JSX.Element} Rendered vocabulary item card.
 */
const VocabItem = React.memo(
  ({ vocab, onView, onEdit, onDelete, innerRef }) => {
    return (
      <div ref={innerRef} style={{ height: "100%" }}>
        <AdminItemCard
          direction="column"
          title={vocab.word}
          subtitle={
            <div>
              <DifficultyBadge difficulty={vocab.displayDifficulty} />
              <VocabDefinition>{vocab.definition}</VocabDefinition>
            </div>
          }
          actions={
            <>
              <IconButton onClick={() => onView(vocab)} title="View">
                <LuEye />
              </IconButton>
              <IconButton onClick={() => onEdit(vocab)} title="Edit">
                <LuPencil />
              </IconButton>
              <IconButton
                onClick={() => onDelete(vocab)}
                title="Delete"
                $danger
              >
                <LuTrash2 />
              </IconButton>
            </>
          }
          fullWidth
        />
      </div>
    );
  },
);

VocabItem.displayName = "VocabItem";

export default VocabItem;
