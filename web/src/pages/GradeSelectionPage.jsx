/**
 * @file GradeSelectionPage.jsx
 * @description A profile completion component where new users select their current academic grade.
 * This information is critical for tailoring the platform's content to the user's level.
 *
 * @dependencies
 * - react: For useState, useContext, and useEffect hooks.
 * - react-router-dom: For useNavigate.
 * - SessionContext: To manage and update the authenticated user's session.
 * - axios: For communicating with the profile completion API.
 * - react-hot-toast: For displaying success and error messages.
 * - Radix UI Select: For a high-quality, accessible selection interface.
 * - react-icons: For UI elements like arrows and checkmarks.
 * - FormStyles: Styled components for the selection UI.
 *
 * @exports GradeSelectionPage (default)
 * @interconnections Typically shown once after initial signup if the user's grade is not yet set.
 */

import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../context/SessionProvider";
import apiClient from "../services/api";
import { API_ENDPOINTS } from "../api/requestMap";
import toast from "react-hot-toast";
import { Select } from "radix-ui";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { IoCheckmarkOutline } from "react-icons/io5";
import {
  FormRoot,
  FormButton,
  SelectTriggerStyled,
  SelectIconStyled,
  SelectContentStyled,
  SelectViewportStyled,
  SelectItemStyled,
  SelectScrollButtonStyled,
  SelectItemIndicatorStyled,
} from "../styles/Form.styles";

export default function GradeSelectionPage() {
  const { user, login, logout } = useContext(SessionContext);
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guard: Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  /**
   * Handles the submission of the selected grade.
   * Sends the data to the backend API and updates the local user session.
   *
   * @param {Event} event - The form submission event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedGrade) {
      toast.error("Please select your grade");
      return;
    }

    setIsSubmitting(true);

    const toastId = toast.loading("Completing your profile...");

    try {
      // Update the user's grade in the database via the complete-profile endpoint
      const numericGrade = Number(selectedGrade);
      const response = await apiClient.put(API_ENDPOINTS.completeProfile.url, {
        grade: numericGrade,
      });

      toast.success(response.data.message || "Profile completed successfully", {
        id: toastId,
      });

      // Update the local session with the user's new data (including the grade)
      await login(response.data);
    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to complete profile. Please try again.",
        { id: toastId },
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
        maxWidth: "400px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#333",
            margin: "0 0 8px 0",
          }}
        >
          Complete Your Profile
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            margin: 0,
          }}
        >
          Please select your current grade to continue
        </p>
      </div>

      <FormRoot onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Select Your Grade
          </label>
          <Select.Root
            name="grade"
            required
            value={selectedGrade}
            onValueChange={setSelectedGrade}
          >
            <Select.Trigger asChild>
              <SelectTriggerStyled>
                <Select.Value placeholder="Select your class" />
                <Select.Icon asChild>
                  <SelectIconStyled>
                    <IoIosArrowDown />
                  </SelectIconStyled>
                </Select.Icon>
              </SelectTriggerStyled>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                align="center"
                position="popper"
                sideOffset={5}
                asChild
              >
                <SelectContentStyled>
                  <Select.ScrollUpButton asChild>
                    <SelectScrollButtonStyled>
                      <IoIosArrowUp />
                    </SelectScrollButtonStyled>
                  </Select.ScrollUpButton>
                  <Select.Viewport asChild>
                    <SelectViewportStyled>
                      <Select.Group>
                        {/* Iterate through grades 1 to 12 to create selection options */}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                          <Select.Item key={cls} value={String(cls)} asChild>
                            <SelectItemStyled>
                              <Select.ItemText>{`Class ${
                                [
                                  "I",
                                  "II",
                                  "III",
                                  "IV",
                                  "V",
                                  "VI",
                                  "VII",
                                  "VIII",
                                  "IX",
                                  "X",
                                  "XI",
                                  "XII",
                                ][cls - 1]
                              }`}</Select.ItemText>
                              <Select.ItemIndicator asChild>
                                <SelectItemIndicatorStyled>
                                  <IoCheckmarkOutline />
                                </SelectItemIndicatorStyled>
                              </Select.ItemIndicator>
                            </SelectItemStyled>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </SelectViewportStyled>
                  </Select.Viewport>
                  <Select.ScrollDownButton asChild>
                    <SelectScrollButtonStyled>
                      <IoIosArrowDown />
                    </SelectScrollButtonStyled>
                  </Select.ScrollDownButton>
                </SelectContentStyled>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <FormButton type="submit" disabled={isSubmitting || !selectedGrade}>
          {isSubmitting ? "Saving..." : "Complete Profile"}
        </FormButton>
      </FormRoot>

      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted, #666)",
            fontSize: "14px",
            cursor: "pointer",
            textDecoration: "underline",
            padding: "8px",
          }}
        >
          Wrong account? Log out
        </button>
      </div>
    </div>
  );
}
