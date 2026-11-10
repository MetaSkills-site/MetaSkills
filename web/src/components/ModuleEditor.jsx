/**
 * @file ModuleEditor.jsx
 * @description Provides components for managing quiz modules and saving questions within the admin interface.
 * It includes `AddModule` for creating and updating modules, and the default export `ModuleEditor` for saving questions to selected modules.
 *
 * @dependencies
 * - react: For state management and context.
 * - react-router-dom: For navigation after saving.
 * - styled-components: For layout and styling.
 * - axios: For backend API communication.
 * - react-hot-toast: For transaction feedback.
 * - EditorContext: To access and manage question/option state.
 * - various admin/common components: For UI construction (dialogs, inputs, selectors).
 *
 * @exports AddModule (named), ModuleEditor (default)
 * @interconnections Part of the admin module. Interacts with `ModuleSelector`, `SkillInput`, `TagInput`, and `CommonDialog`.
 */

import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import adminApiClient from "../services/adminApi";
import toast from "react-hot-toast";

import EditorContext from "../context/EditorContext";
import {
  FormField,
  FormLabel,
  FormInput,
  DialogButtonGroup,
  DialogButton,
} from "./admin/AdminStyles";
import { sanitizeQuestionOptions } from "../utils/questionValidation";
import CommonDialog from "./common/CommonDialog";
import SelectInput from "./common/SelectInput";
import TagInput from "./common/TagInput";
import SkillInput from "./common/SkillInput";
import GradeSelector from "./common/GradeSelector";
import ModuleSelector from "./admin/ModuleSelector";
import { useAdminAuth } from "./admin/AdminAuthProvider";

// Styled Components

const SaveButton = styled.button`
  display: block;
  width: -moz-fit-content;
  width: fit-content;
  padding: 10px 20px;
  font-family: inherit;
  background: linear-gradient(90deg, rgb(232, 74, 22), rgb(231, 74, 26));
  color: rgba(255, 255, 255, 0.75);
  border: 2px solid #ff572273;
  border-radius: 12px;
  font-weight: 900;
  font-size: 14px;
  margin: 18px auto 8px auto;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.31),
    0 4px 16px rgba(255, 86, 34, 0.3);
  cursor: pointer;
  transition: background 260ms;
  &:hover {
    background: linear-gradient(180deg, rgb(255, 64, 0), rgb(255, 86, 34));
    color: #ffffff;
  }
`;

/**
 * AddModule Component
 * Provides a dialog for creating a new quiz module or editing an existing one.
 */
export function AddModule({
  dialogOpen,
  setDialogOpen,
  loading,
  setLoading,
  children,
  onSuccess,
  moduleToEdit = null,
}) {
  const { authenticated, loading: authLoading } = useAdminAuth() || {};
  const [newModuleForm, setNewModuleForm] = useState({
    name: "",
    subject: "english",
    grades: [],
    isComplete: false,
  });

  // Effect to populate the form if we are in edit mode
  useEffect(() => {
    if (moduleToEdit) {
      setNewModuleForm({
        name: moduleToEdit.name || "",
        subject: moduleToEdit.subject || "english",
        grades: moduleToEdit.grades || [],
        isComplete: moduleToEdit.isComplete || false,
      });
    } else {
      setNewModuleForm({
        name: "",
        subject: "english",
        grades: [],
        isComplete: false,
      });
    }
  }, [moduleToEdit, dialogOpen]);

  // Effect to reset the form when the dialog closes
  useEffect(() => {
    if (!dialogOpen && !moduleToEdit) {
      setNewModuleForm({
        name: "",
        subject: "english",
        grades: [],
        isComplete: false,
      });
    }
  }, [dialogOpen, moduleToEdit]);

  if (authLoading) return null;

  if (!authenticated) {
    return <div>Unauthorized: Please log in to manage modules.</div>;
  }

  /**
   * Handles the submission of the module form.
   * Creates a new module or updates an existing one via the backend API.
   *
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authenticated) {
      toast.error("Authentication failed. Please log in.");
      return;
    }
    if (!newModuleForm.name.trim()) {
      toast.error("Module name is required");
      return;
    }
    setLoading(true);

    const isEdit = !!moduleToEdit;

    const payload = isEdit
      ? { ...newModuleForm, id: moduleToEdit._id }
      : newModuleForm;

    toast.promise(
      new Promise((resolve, reject) => {
        adminApiClient({
          method: isEdit ? "put" : "post",
          url: isEdit ? "/api/quiz/modules/update" : "/api/quiz/modules",
          data: payload,
        })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      }),
      {
        loading: isEdit ? "Updating module..." : "Creating module...",
        success: () => {
          setLoading(false);
          setDialogOpen(false);
          if (onSuccess) onSuccess();
          return isEdit
            ? "Module updated successfully"
            : "Module created successfully";
        },
        error: (error) => {
          setLoading(false);
          return (
            error.response?.data?.message ||
            error.message ||
            `Failed to ${isEdit ? "update" : "create"} module`
          );
        },
      },
    );
  };

  const subjectOptions = [
    { value: "english", label: "English" },
    { value: "maths", label: "Maths" },
  ];

  return (
    <CommonDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      trigger={
        children || <SaveButton type="button">Create a new module</SaveButton>
      }
      title={moduleToEdit ? "Edit Module" : "Create a new module"}
      description={
        moduleToEdit
          ? "Update the details of this module."
          : "Enter the details below to create a new module for storing your questions."
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField>
          <FormLabel htmlFor="module-name">Module Name</FormLabel>
          <FormInput
            id="module-name"
            type="text"
            placeholder="e.g., Untitled module"
            value={newModuleForm.name}
            onChange={(e) =>
              setNewModuleForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            required
          />
        </FormField>
        <FormField>
          <FormLabel>Subject</FormLabel>
          <SelectInput
            value={newModuleForm.subject}
            onValueChange={(value) =>
              setNewModuleForm((prev) => ({ ...prev, subject: value }))
            }
            options={subjectOptions}
            placeholder="Select subject..."
          />
        </FormField>
        <GradeSelector
          grades={newModuleForm.grades}
          setGrades={(grades) =>
            setNewModuleForm((prev) => ({ ...prev, grades }))
          }
        />
        <FormField
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: "10px",
            marginTop: "15px",
            display: "flex",
          }}
        >
          <input
            type="checkbox"
            id="isComplete"
            checked={newModuleForm.isComplete}
            onChange={(e) =>
              setNewModuleForm((prev) => ({
                ...prev,
                isComplete: e.target.checked,
              }))
            }
            style={{
              width: "20px",
              height: "20px",
              accentColor: "#ff5722",
              cursor: "pointer",
            }}
          />
          <FormLabel
            htmlFor="isComplete"
            style={{ margin: 0, cursor: "pointer", userSelect: "none" }}
          >
            Mark as Completed
          </FormLabel>
        </FormField>

        <DialogButtonGroup>
          <DialogButton
            type="button"
            onClick={() => setDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </DialogButton>
          <DialogButton type="submit" $primary disabled={loading}>
            {loading
              ? moduleToEdit
                ? "Updating..."
                : "Creating..."
              : moduleToEdit
                ? "Update Module"
                : "Create Module"}
          </DialogButton>
        </DialogButtonGroup>
      </form>
    </CommonDialog>
  );
}

/**
 * EditModule Component (Default Export)
 * Provides the interface for an admin to select modules and save a question being edited.
 */
export default function ModuleEditor({
  onSave,
  saveButtonText,
  multiSelect = true,
  disabled = false,
}) {
  const navigate = useNavigate();
  const { authenticated, loading: authLoading } = useAdminAuth() || {};

  const [loading, setLoading] = useState(false);
  const editorContext = useContext(EditorContext);

  // Destructure safely in case EditorContext is partially populated or used differently
  const {
    question = {},
    options = {},
    explanation = {},
    questionId = null,
    tags = [],
    setTags = () => {},
    skills = [],
    setSkills = () => {},
    contextAttachmentId = null,
  } = editorContext || {};

  const [selectedModules, setSelectedModules] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refetchCounter, setRefetchCounter] = useState(0);

  /**
   * Gathers all question data from context and saves it to the selected modules.
   * Handles both creating new questions and updating existing ones.
   */
  const handleSaveQuestion = () => {
    if (loading) return;
    if (!authenticated) {
      toast.error("Authentication failed. Please log in.");
      navigate("/auth");
      return;
    }
    if (selectedModules.length === 0) {
      toast.error("Please select at least one module.");
      return;
    }

    if (onSave) {
      // If external onSave is provided, delegate saving logic
      onSave(selectedModules, { tags, skills });
      return;
    }

    const method = questionId ? "put" : "post";
    const url = questionId
      ? `/api/quiz/questions/update`
      : `/api/quiz/questions`;

    // Ensure options are clean and correct for the selected answer type
    const sanitizedOptions = sanitizeQuestionOptions(
      question?.answerType || options?.type || "MCQ",
      options,
    );

    let sanitizedOptionIndex = null;
    if (sanitizedOptions.type === "MCQ") {
      sanitizedOptionIndex = options.mcq?.correct;
    }

    // Extract slate JSON from question/explanation objects
    const questionSlate = Array.isArray(question)
      ? question
      : question?.slate || [];
    const explanationSlate = Array.isArray(explanation)
      ? explanation
      : explanation?.slate || [];

    const payload = {
      id: questionId,
      question: { slate: questionSlate },
      answerType: options.type,
      options: sanitizedOptions,
      explanation: { slate: explanationSlate },
      modules: selectedModules,
      optionIndex: sanitizedOptionIndex,
      tags: tags,
      skills: skills,
      contextAttachmentId: contextAttachmentId,
    };

    setLoading(true);

    toast.promise(
      new Promise((resolve, reject) => {
        adminApiClient({
          method: method,
          url: url, // already defined dynamically above
          data: payload,
        })
          .then((res) => resolve(res))
          .catch((err) => reject(err))
          .finally(() => setLoading(false));
      }),

      {
        loading: () => "Saving question...",
        success: () => {
          navigate("/admin");
          return "Saved successfully";
        },
        error: (error) =>
          error.response?.data?.message ||
          error.message ||
          "Failed to save question",
      },
    );
  };

  /**
   * Toggles a module's selection state.
   *
   * @param {string} id - The ID of the module to toggle.
   */
  const toggleModule = (id) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter((m) => m !== id));
    } else {
      setSelectedModules(multiSelect ? [...selectedModules, id] : [id]);
    }
  };

  if (authLoading) return null;

  if (!authenticated) {
    return <div>Unauthorized: Please log in to manage modules.</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20, color: "#333", fontSize: "16px" }}>
        Select the module(s) to save to
      </h2>

      {/* Inputs for adding metadata like skills and tags to the question */}
      <SkillInput skills={skills} setSkills={setSkills} />
      <TagInput tags={tags} setTags={setTags} />

      {/* Module selection interface */}
      <ModuleSelector
        selectedModules={selectedModules}
        multiSelect={multiSelect}
        onToggleModule={toggleModule}
        refetchCounter={refetchCounter}
      />

      {selectedModules.length > 0 ? (
        <SaveButton onClick={handleSaveQuestion} disabled={loading || disabled}>
          {loading ? "Saving..." : saveButtonText || "Save Question"}
        </SaveButton>
      ) : (
        <AddModule
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          loading={loading}
          setLoading={setLoading}
          onSuccess={() => {
            // Re-fetch by incrementing the counter instead of duplicating API calls locally
            setRefetchCounter((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
