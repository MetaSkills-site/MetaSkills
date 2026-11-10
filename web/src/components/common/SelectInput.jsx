/**
 * @file SelectInput.jsx
 * @description A customizable dropdown select component built on Radix UI's Select primitive.
 * Provides a styled, accessible, and performant alternative to the native select element.
 * @dependencies @radix-ui/react-select, styled-components, react-icons/io, react-icons/io5, ../../styles/Form.styles
 * @exports SelectInput
 * @interconnections Used in forms and settings across the application for single-choice selection.
 */

import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { IoCheckmarkOutline } from "react-icons/io5";
import * as Select from "@radix-ui/react-select";
import styled, { keyframes } from "styled-components";
import { DropdownMenuShell } from "../../styles/Form.styles";

// Styled trigger button for the select dropdown
const SelectTriggerStyled = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 20px 25px;
  font-size: 13px;
  line-height: 1;
  width: ${(props) => props.$width || "fit-content"};
  height: 35px;
  outline: none;
  gap: 5px;
  color: #ff5722;
  font-weight: 900;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 4px 6px rgba(0, 0, 0, 0.05),
    1px 1px 30px -10px rgba(240, 135, 93, 0.22);
  outline: none;
  border: solid 2px #ff572273;
  background: linear-gradient(45deg, #ff98001a, #ffffff, #ffffff, #ff572214);
  margin: auto;
  transition: 400ms;
  &:hover {
    background: linear-gradient(
      45deg,
      #ff98001a,
      #ff98001a,
      #ff98001a,
      #ff572214
    );
  }
  &[data-placeholder] {
    color: #ff5722;
  }
`;

// Icon wrapper for the dropdown arrow
const SelectIconStyled = styled.span`
  color: #ff5722;
  margin-left: auto;
`;

// Animation for showing the dropdown content
const contentShow = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

// Animation for hiding the dropdown content
const contentHide = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-6px) scale(0.98); }
`;

// Styled container for the dropdown content
const SelectContentStyled = styled(DropdownMenuShell)`
  z-index: 9999; /* High z-index to ensure visibility over other overlays/modals */
  min-width: var(--radix-select-trigger-width);
  max-height: 300px;
  will-change: transform, opacity;
  animation: ${contentShow} 160ms cubic-bezier(0.16, 1, 0.3, 1);
  &[data-state="closed"] {
    animation: ${contentHide} 120ms cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

// Styled viewport for scrolling through options
const SelectViewportStyled = styled.div`
  padding: 5px;
  max-height: inherit;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  &scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  ::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }
`;

// Individual option item styling
const SelectItemStyled = styled.div`
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  color: #ff5722;
  border-radius: 8px;
  display: flex;
  justify-content: start;
  align-items: center;
  height: 36px;
  width: 100%;
  padding: 0 32px 0 12px; /* Extra right padding to accommodate the indicator */
  position: relative;
  user-select: none;
  outline: none;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
  &[data-highlighted] {
    background: rgba(228, 107, 74, 0.08);
  }
  &[data-state="checked"] {
    background: rgba(228, 107, 74, 0.12);
    color: #e64a19;
  }
`;

// Styling for the checkmark indicator on selected items
const SelectItemIndicatorStyled = styled.span`
  position: absolute;
  right: 10px;
  width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
`;

// Styled button for scrolling up/down through long lists of options
const SelectScrollButtonStyled = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 25px;
  background-color: white;
  color: #ff5722;
  cursor: default;
`;

/**
 * Reusable Radix-based Select Component.
 * @param {string} value - The current selected value (controlled).
 * @param {function} onValueChange - Callback triggered when a new option is selected.
 * @param {Array<{value: string, label: string}>} options - Array of objects representing the select options.
 * @param {string} placeholder - Text to display when no value is selected.
 * @param {string} width - Custom CSS width for the trigger element.
 */
export default function SelectInput({
  value,
  onValueChange,
  options = [],
  placeholder = "Select...",
  width = "100%",
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger asChild>
        <SelectTriggerStyled $width={width}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <SelectIconStyled>
              <IoIosArrowDown />
            </SelectIconStyled>
          </Select.Icon>
        </SelectTriggerStyled>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content align="center" position="popper" sideOffset={5} asChild>
          <SelectContentStyled>
            <Select.ScrollUpButton asChild>
              <SelectScrollButtonStyled>
                <IoIosArrowUp />
              </SelectScrollButtonStyled>
            </Select.ScrollUpButton>
            <Select.Viewport asChild>
              <SelectViewportStyled>
                <Select.Group>
                  {/* Iterate through options and render individual Select.Items */}
                  {options.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      asChild
                    >
                      <SelectItemStyled>
                        <Select.ItemText>{option.label}</Select.ItemText>
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
  );
}
