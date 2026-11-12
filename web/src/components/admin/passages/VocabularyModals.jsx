/**
 * @file VocabularyModals.jsx
 * @description Modal dialogs collection for inspecting, editing, bulk-creating, and deleting vocabulary terms.
 * @architecture Admin dialog feature component coordinating Radix UI CommonDialog and AIGenerationBar for vocab workflows.
 * @agent_note Bulk creation expects "word - definition" per line; verify formatting regex if changing prompts.
 */

import styled from "styled-components";
import CommonDialog from "../../common/CommonDialog";
import {
  DialogButtonGroup,
  DialogButton,
  FormField,
  FormLabel,
} from "../AdminStyles";

import AIGenerationBar from "../../common/AIGenerationBar";

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #ff5722;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ff5722;
  }
`;

/**
 * VocabularyModals component rendering dialogs for vocabulary management.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} [props.user] - Admin user session object.
 * @param {boolean} props.viewModalOpen - View modal visibility state.
 * @param {Function} props.setViewModalOpen - View modal visibility updater.
 * @param {Object} [props.selectedVocab] - Currently selected vocabulary item.
 * @param {boolean} props.editModalOpen - Edit modal visibility state.
 * @param {Function} props.setEditModalOpen - Edit modal visibility updater.
 * @param {Object} [props.editVocabForm] - Form data for vocabulary editing.
 * @param {Function} props.setEditVocabForm - Edit form data updater.
 * @param {boolean} props.deleteModalOpen - Delete modal visibility state.
 * @param {Function} props.setDeleteModalOpen - Delete modal visibility updater.
 * @param {boolean} props.bulkModalOpen - Bulk creation modal visibility state.
 * @param {Function} props.setBulkModalOpen - Bulk creation modal visibility updater.
 * @param {string} props.bulkText - Text input for bulk vocabulary entry.
 * @param {Function} props.setBulkText - Bulk text input updater.
 * @param {Function} props.onUpdate - Callback invoked to save vocabulary updates.
 * @param {Function} props.onDelete - Callback invoked to delete vocabulary item.
 * @param {Function} props.onBulkCreate - Callback invoked to create bulk vocabulary.
 * @returns {JSX.Element} Modal dialogs for vocabulary operations.
 */
const VocabularyModals = ({
  user,
  viewModalOpen,
  setViewModalOpen,
  selectedVocab,
  editModalOpen,
  setEditModalOpen,
  editVocabForm,
  setEditVocabForm,
  deleteModalOpen,
  setDeleteModalOpen,
  bulkModalOpen,
  setBulkModalOpen,
  bulkText,
  setBulkText,
  // Handlers
  onUpdate,
  onDelete,
  onBulkCreate,
}) => {
  return (
    <>
      {/* View Vocab */}
      <CommonDialog
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        title="View Vocabulary"
        maxWidth="600px"
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setViewModalOpen(false)}>
              Close
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        {selectedVocab && (
          <div>
            <FormField>
              <FormLabel>Word</FormLabel>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {selectedVocab.word}
              </div>
            </FormField>
            <FormField>
              <FormLabel>Definition</FormLabel>
              <div
                style={{
                  fontSize: "16px",
                  color: "#666",
                  lineHeight: "1.6",
                }}
              >
                {selectedVocab.definition}
              </div>
            </FormField>
          </div>
        )}
      </CommonDialog>

      {/* Edit Vocab */}
      <CommonDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Vocabulary"
        maxWidth="600px"
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setEditModalOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton $primary onClick={onUpdate}>
              Save Changes
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        {editVocabForm && (
          <>
            <FormField>
              <FormLabel>Word</FormLabel>
              <Input
                value={editVocabForm.word}
                onChange={(e) =>
                  setEditVocabForm((prev) => ({
                    ...prev,
                    word: e.target.value,
                  }))
                }
                placeholder="Enter word"
              />
            </FormField>
            <FormField>
              <FormLabel>Definition</FormLabel>
              <TextArea
                value={editVocabForm.definition}
                onChange={(e) =>
                  setEditVocabForm((prev) => ({
                    ...prev,
                    definition: e.target.value,
                  }))
                }
                placeholder="Enter definition"
                style={{ height: "150px" }}
              />
            </FormField>
          </>
        )}
      </CommonDialog>

      {/* Bulk Vocabulary */}
      <CommonDialog
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        title="Add Vocabulary"
        maxWidth="700px"
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setBulkModalOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton $primary onClick={onBulkCreate}>
              Add Vocabulary
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        <p style={{ marginBottom: "10px", color: "#666" }}>
          Enter vocabulary in the format: <strong>word - definition</strong>{" "}
          (one per line)
        </p>
        <TextArea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          style={{ height: "300px" }}
          placeholder="serendipity - the occurrence of events by chance in a happy or beneficial way&#10;ephemeral - lasting for a very short time"
        />

        <AIGenerationBar
          userToken={user?.token}
          mode="count"
          apiMode="vocab"
          label="Generate Words:"
          defaultValue={50}
          onComplete={(fullText) =>
            setBulkText((prev) => prev + (prev ? "\n\n" : "") + fullText)
          }
          buttonText="Generate with AI"
        />
      </CommonDialog>

      {/* Delete Vocab Confirmation */}
      <CommonDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Confirm Delete"
        description="Are you sure you want to delete this vocabulary item? This action cannot be undone."
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton
              style={{ background: "#d32f2f", color: "white" }}
              onClick={onDelete}
            >
              Delete
            </DialogButton>
          </DialogButtonGroup>
        }
      ></CommonDialog>
    </>
  );
};

export default VocabularyModals;
