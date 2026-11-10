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
