import styled from "styled-components";
import CommonDialog from "../../common/CommonDialog";
import { DialogButtonGroup, DialogButton } from "../AdminStyles";
import PassageEditor from "../PassageEditor";
import CreatePassage from "../CreatePassage";
import SlateRenderer from "../../SlateRenderer";
import AIGenerationBar from "../../common/AIGenerationBar";

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

const PassageModals = ({
  user,
  viewModalOpen,
  setViewModalOpen,
  selectedPassage,
  createModalOpen,
  setCreateModalOpen,
  editModalOpen,
  setEditModalOpen,
  deleteModalOpen,
  setDeleteModalOpen,
  bulkModalOpen,
  setBulkModalOpen,
  bulkText,
  setBulkText,
  // Handlers
  onUpdate,
  onCreate,
  onBulkCreate,
  onDelete,
  onUpdateLocal, // to update selectedPassage locally in parent
}) => {
  return (
    <>
      {/* View Modal */}
      <CommonDialog
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        title={selectedPassage?.title}
        maxWidth="800px"
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setViewModalOpen(false)}>
              Close
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        <div style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>
          <SlateRenderer slate={selectedPassage?.text} />
        </div>
      </CommonDialog>

      {/* Create Modal */}
      <CommonDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Create New Passage"
        maxWidth="900px"
      >
        <div>
          <CreatePassage
            onClose={() => setCreateModalOpen(false)}
            onCreate={onCreate}
          />
        </div>
      </CommonDialog>

      {/* Edit Modal */}
      <CommonDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Passage"
        maxWidth="900px"
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setEditModalOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton $primary onClick={() => onUpdate(selectedPassage)}>
              Save Changes
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        {selectedPassage && (
          <div style={{ flex: 1, paddingRight: "10px" }}>
            <PassageEditor
              userToken={user?.token}
              initialData={selectedPassage}
              onUpdate={onUpdateLocal}
            />
          </div>
        )}
      </CommonDialog>

      {/* Bulk Sentences Modal */}
      <CommonDialog
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        title="Add Sentences"
        maxWidth="600px"
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setBulkModalOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton $primary onClick={onBulkCreate}>
              Add Sentences
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        <p style={{ marginBottom: "10px", color: "#666" }}>
          Paste sentences below, separated by new lines.
        </p>
        <TextArea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          style={{
            height: "300px",
          }}
          placeholder="The quick brown fox jumps over the lazy dog.&#10;She sells seashells by the seashore."
        />
        <AIGenerationBar
          userToken={user?.token}
          mode="count"
          apiMode="sentences"
          label="Generate Sentences:"
          defaultValue={10}
          onComplete={(fullText) =>
            setBulkText((prev) => prev + (prev ? "\n\n" : "") + fullText)
          }
          buttonText="Generate with AI"
        />
      </CommonDialog>

      {/* Delete Confirmation */}
      <CommonDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Confirm Delete"
        description="Are you sure you want to delete this item? This action cannot be undone."
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

export default PassageModals;
