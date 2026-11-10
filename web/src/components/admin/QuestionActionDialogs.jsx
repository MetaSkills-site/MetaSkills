/**
 * @file QuestionActionDialogs.jsx
 * @description Centralized dialog components for question actions (View, Edit, Info, Delete/Detach, Add to Module).
 * Consolidates logic from ViewQuestions.jsx and ViewAllQuestions.jsx.
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import styled from "styled-components";

import CommonDialog from "../common/CommonDialog";
import QuestionInfoModal from "./QuestionInfoModal";
import QuestionDisplayTabs from "./QuestionDisplayTabs";
import ModuleSelector from "./ModuleSelector";
import QuestionEditor from "../QuestionEditor";
import { SkeletonRect } from "../SkeletonLoader";
import {
  deleteQuestion,
  removeQuestionFromModule,
  addQuestionToModule,
} from "../../services/quizService";
import useQuestionFetch from "../../hooks/useQuestionFetch";
import { DialogButtonGroup, DialogButton } from "./AdminStyles.jsx";

const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
`;

export const QuestionActionDialogs = ({
  question, // The question object (at least { _id })
  viewOpen,
  setViewOpen,
  editOpen,
  setEditOpen,
  infoOpen,
  setInfoOpen,
  deleteOpen,
  setDeleteOpen,
  addToModuleOpen,
  setAddToModuleOpen,
  onSuccess,
  isDetach = false,
  moduleId = null, // Current module ID for detaching
}) => {
  const queryClient = useQueryClient();
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [addingToModule, setAddingToModule] = useState(false);

  const {
    questionData: fullQuestionData,
    loading: fetchingQuestion,
    fetchQuestion,
  } = useQuestionFetch();

  // Fetch full question data when View, Edit, or Add to Module modal opens
  useEffect(() => {
    if ((viewOpen || editOpen || addToModuleOpen) && question?._id) {
      fetchQuestion(question._id);
    }
  }, [viewOpen, editOpen, addToModuleOpen, question?._id, fetchQuestion]);

  // Sync selected modules when fullQuestionData is available and Add to Module modal is open
  useEffect(() => {
    if (addToModuleOpen && fullQuestionData) {
      setSelectedModuleIds(
        (fullQuestionData.modules || []).map((m) => (m._id || m).toString()),
      );
    }
  }, [addToModuleOpen, fullQuestionData]);

  // Mutation for adding/syncing modules
  const addToModuleMutation = useMutation({
    mutationFn: () => addQuestionToModule(selectedModuleIds, question._id),
    onSuccess: () => {
      toast.success("Question modules synced successfully");
      setAddToModuleOpen(false);
      if (onSuccess) onSuccess("addToModule", question._id);
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
      queryClient.invalidateQueries({ queryKey: ["moduleQuestions"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to sync question modules",
      );
    },
    onSettled: () => {
      setAddingToModule(false);
    },
  });

  const handleAddToModule = () => {
    if (!question) return;
    setAddingToModule(true);
    addToModuleMutation.mutate();
  };

  // Mutation for deleting or detaching
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (isDetach && moduleId) {
        return removeQuestionFromModule(moduleId, question._id);
      } else {
        return deleteQuestion(question._id);
      }
    },
    onSuccess: () => {
      toast.success(
        isDetach
          ? "Question detached successfully"
          : "Question deleted successfully",
      );
      setDeleteOpen(false);
      if (onSuccess) onSuccess(isDetach ? "detach" : "delete", question._id);
      queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
      queryClient.invalidateQueries({ queryKey: ["moduleQuestions"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isDetach ? "detach" : "delete"} question`,
      );
    },
  });

  const handleDelete = () => {
    if (!question) return;
    deleteMutation.mutate();
  };

  return (
    <>
      {/* Info Modal */}
      <QuestionInfoModal
        questionId={question?._id}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />

      {/* View Modal */}
      <CommonDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="View Question"
        maxWidth="700px"
        footer={
          <DialogButtonGroup>
            <DialogButton type="button" onClick={() => setViewOpen(false)}>
              Close
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        {fetchingQuestion ? (
          <SkeletonContainer>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRect key={i} $height="48px" $borderRadius="10px" />
            ))}
          </SkeletonContainer>
        ) : fullQuestionData ? (
          <QuestionDisplayTabs question={fullQuestionData} />
        ) : null}
      </CommonDialog>

      {/* Edit Modal */}
      <CommonDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        maxWidth="900px"
        title="Edit Question"
      >
        {fetchingQuestion ? (
          <SkeletonContainer>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRect key={i} $height="48px" $borderRadius="10px" />
            ))}
          </SkeletonContainer>
        ) : fullQuestionData ? (
          <QuestionEditor
            questionData={fullQuestionData}
            onClose={() => setEditOpen(false)}
            onSaveSuccess={() => {
              if (onSuccess) onSuccess("edit", question._id);
              queryClient.invalidateQueries({ queryKey: ["allQuestions"] });
              queryClient.invalidateQueries({ queryKey: ["moduleQuestions"] });
              setEditOpen(false);
            }}
          />
        ) : null}
      </CommonDialog>

      {/* Delete/Detach Modal */}
      <CommonDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={isDetach ? "Detach Question" : "Delete Question"}
        description={
          isDetach
            ? "Are you sure you want to detach this question from the module? This action will NOT delete the question from the database."
            : "Are you sure you want to delete this question? This action cannot be undone."
        }
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setDeleteOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton
              $danger
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? isDetach
                  ? "Detaching..."
                  : "Deleting..."
                : isDetach
                  ? "Detach"
                  : "Delete"}
            </DialogButton>
          </DialogButtonGroup>
        }
      />

      {/* Add to Module Modal */}
      <CommonDialog
        open={addToModuleOpen}
        onOpenChange={setAddToModuleOpen}
        title="Add to Module"
        footer={
          <DialogButtonGroup>
            <DialogButton onClick={() => setAddToModuleOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton
              $primary
              onClick={handleAddToModule}
              disabled={addingToModule}
            >
              {addingToModule ? "Syncing..." : "Save Selection"}
            </DialogButton>
          </DialogButtonGroup>
        }
      >
        <ModuleSelector
          selectedModules={selectedModuleIds}
          onToggleModule={(id) => {
            const idStr = typeof id === "string" ? id : String(id);
            if (selectedModuleIds.includes(idStr)) {
              setSelectedModuleIds(
                selectedModuleIds.filter((m) => m !== idStr),
              );
            } else {
              setSelectedModuleIds([...selectedModuleIds, idStr]);
            }
          }}
          multiSelect={true}
        />
      </CommonDialog>
    </>
  );
};

export default QuestionActionDialogs;
