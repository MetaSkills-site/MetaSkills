/**
 * @file ModuleActionDialogs.jsx
 * @description Reusable dialog components for editing and deleting modules.
 * Extracted from ViewQuestions.jsx to be shared across the admin interface.
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";

import CommonDialog from "../common/CommonDialog";
import SelectInput from "../common/SelectInput";
import GradeSelector from "../common/GradeSelector";
import { updateModule, deleteModuleCascade } from "../../services/quizService";
import {
  DialogButtonGroup,
  DialogButton,
  FormField,
  FormLabel,
} from "./AdminStyles.jsx";

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabelStyled = styled.label`
  display: block;
  font-weight: 700;
  color: var(--color-primary, #ff5722);
  margin-bottom: 8px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border: 2px solid rgba(255, 87, 34, 0.2);
  border-radius: 10px;
  outline: none;
`;

const CheckboxInput = styled.input`
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary, #ff5722);
  cursor: pointer;
`;

export const ModuleActionDialogs = ({
  module,
  editOpen,
  setEditOpen,
  deleteOpen,
  setDeleteOpen,
  onSuccess,
  setGlobalModule, // From useModule context if needed
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [moduleForm, setModuleForm] = useState({
    name: "",
    subject: "english",
    grades: [],
    isComplete: false,
  });

  useEffect(() => {
    if (module) {
      setModuleForm({
        name: module.name || "",
        subject: module.subject || "english",
        grades: module.grades || [],
        isComplete: module.isComplete || false,
      });
    }
  }, [module]);

  const updateModuleMutation = useMutation({
    mutationFn: (formData) => {
      if (!module?._id) throw new Error("Module ID is missing");
      return updateModule({ id: module._id, ...formData });
    },
    onSuccess: (res) => {
      if (setGlobalModule) setGlobalModule(res.data);
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      // Also invalidate the specific module questions if we are in that view
      queryClient.invalidateQueries({
        queryKey: ["moduleQuestions", module?._id],
      });

      toast.success("Module updated successfully");
      setEditOpen(false);
      if (onSuccess) onSuccess("edit", res.data);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update module"),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: () => {
      if (!module?._id) throw new Error("Module ID is missing");
      return deleteModuleCascade(module._id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module deleted successfully");
      setDeleteOpen(false);
      if (onSuccess) onSuccess("delete", module?._id);
      // If we are on the ViewQuestions page for this module, we should navigate away
      if (
        module?._id &&
        (pathname.includes(module._id) || pathname.includes("questions"))
      ) {
        navigate("/admin/modules");
      }
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete module"),
  });

  const handleUpdateModule = (e) => {
    e.preventDefault();
    if (!module) return;
    updateModuleMutation.mutate(moduleForm);
  };

  const handleDeleteModule = () => {
    if (!module) return;
    deleteModuleMutation.mutate();
  };

  const subjectOptions = [
    { value: "english", label: "English" },
    { value: "maths", label: "Maths" },
  ];

  const loading =
    updateModuleMutation.isPending || deleteModuleMutation.isPending;

  return (
    <>
      <CommonDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={`Edit Module: ${module?.name || ""}`}
      >
        <form onSubmit={handleUpdateModule}>
          <FormGroup>
            <FormLabelStyled>Module Name</FormLabelStyled>
            <FormInput
              type="text"
              value={moduleForm.name}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, name: e.target.value })
              }
              required
            />
          </FormGroup>
          <FormGroup>
            <FormLabelStyled>Subject</FormLabelStyled>
            <SelectInput
              value={moduleForm.subject}
              onValueChange={(value) =>
                setModuleForm({ ...moduleForm, subject: value })
              }
              options={subjectOptions}
              placeholder="Select subject..."
            />
          </FormGroup>
          <GradeSelector
            grades={moduleForm.grades}
            setGrades={(grades) =>
              setModuleForm((prev) => ({ ...prev, grades }))
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
            <CheckboxInput
              type="checkbox"
              id="isComplete"
              checked={moduleForm.isComplete}
              onChange={(e) =>
                setModuleForm((prev) => ({
                  ...prev,
                  isComplete: e.target.checked,
                }))
              }
            />
            <FormLabel
              htmlFor="isComplete"
              style={{ margin: 0, cursor: "pointer", userSelect: "none" }}
            >
              Mark as Completed
            </FormLabel>
          </FormField>
          <DialogButtonGroup>
            <DialogButton type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton type="submit" $primary disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </DialogButton>
          </DialogButtonGroup>
        </form>
      </CommonDialog>

      <CommonDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Module"
        description={
          <>
            Are you sure you want to delete the module{" "}
            <strong>{module?.name}</strong>? This action is{" "}
            <strong>irreversible</strong> and will delete all questions
            associated with this module.
          </>
        }
        footer={
          <DialogButtonGroup>
            <DialogButton type="button" onClick={() => setDeleteOpen(false)}>
              Cancel
            </DialogButton>
            <DialogButton
              type="button"
              $danger
              onClick={handleDeleteModule}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Module"}
            </DialogButton>
          </DialogButtonGroup>
        }
      />
    </>
  );
};

export default ModuleActionDialogs;
