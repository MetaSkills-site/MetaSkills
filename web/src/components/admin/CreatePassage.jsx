/**
 * FILE: CreatePassage.jsx
 * PURPOSE: Administrative component for creating new reading passages for the English Marathon.
 * DEPENDENCIES:
 *   - useMutation: TanStack Query hook for handling the creation request.
 *   - createPassage: API service for persisting new passage data.
 *   - PassageEditor: Rich-text editor specialized for passage content.
 * EXPORTS: CreatePassage (Default export)
 * INTERCONNECTIONS: Integrated within the ViewPassages dashboard as a modal-based form.
 */

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { createPassage } from "../../services/passagesService";
import PassageEditor from "./PassageEditor";
import { DialogButtonGroup, DialogButton } from "./AdminStyles";

export default function CreatePassage({ onClose, onCreate }) {
  // Local state for tracking passage title and content
  const [passageData, setPassageData] = useState({ title: "", text: "" });

  // Retrieve admin user from local storage for authentication

  /**
   * TanStack Query mutation for creating a new passage.
   * Handles success notifications and triggers parent-level list refreshes.
   */
  const createMutation = useMutation({
    mutationFn: (vars) => createPassage(vars),
    onSuccess: (res) => {
      toast.success("Passage created successfully");
      if (onCreate) onCreate(res?.data || res); // Notify parent of successful creation
      if (onClose) onClose(); // Close the creation modal
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to create passage");
    },
  });

  /**
   * Validates form data and executes the creation mutation.
   */
  const handleCreate = () => {
    // Basic validation: ensure title and content are not empty
    if (!passageData.title || !passageData.text) {
      toast.error("Title and Content are required");
      return;
    }
    createMutation.mutate(passageData);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Rich-text passage editor component */}
      <PassageEditor
        initialData={{ title: "", text: "" }}
        onUpdate={(data) => setPassageData((prev) => ({ ...prev, ...data }))}
      />

      {/* Action buttons: Cancel and Create */}
      <DialogButtonGroup>
        <DialogButton onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </DialogButton>
        <DialogButton
          $primary
          onClick={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Creating..." : "Create Passage"}
        </DialogButton>
      </DialogButtonGroup>
    </div>
  );
}
