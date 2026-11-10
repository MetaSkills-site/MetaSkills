/**
 * @file CommonDialog.jsx
 * @description A flexible, reusable modal dialog component built on Radix UI's Dialog primitive.
 * Supports scrollable content, custom headers/footers, and specialized logic for MathLive keyboards.
 * @dependencies @radix-ui/react-dialog, styled-components, react-icons/io
 * @exports CommonDialog
 * @interconnections Used throughout the application for alerts, confirmations, and form-based modals.
 */

import * as Dialog from "@radix-ui/react-dialog";
import styled from "styled-components";
import { IoMdClose } from "react-icons/io";
import { DialogButton } from "../admin/AdminStyles";

// Semi-transparent overlay that covers the background
const Overlay = styled(Dialog.Overlay)`
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;
  z-index: 3000;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes overlayShow {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

// Main modal content container with centering and entry animations
const Content = styled(Dialog.Content)`
  background: #ffffff;
  border-radius: 16px;
  box-shadow:
    0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: ${(props) => props.$maxWidth || "500px"};
  max-height: 85vh;
  padding: 30px 0; /* Top/bottom padding for the modal */
  z-index: 3001;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:focus {
    outline: none;
  }

  @keyframes contentShow {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
`;

// Header section containing the title and optional description
const DialogHeader = styled.div`
  padding: 0 30px;
  flex-shrink: 0;
`;

// Middle section that allows for long content with a custom scrollbar
const ScrollableBody = styled.div`
  padding: 0 30px;
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* Ensures the flex container can shrink to enable scrolling */

  scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  &scrollbar-width: thin;
  scrollbar-color: rgba(160, 160, 160, 0.5) transparent;
  ::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #eee;
    border-radius: 10px;
  }
`;

const Title = styled(Dialog.Title)`
  margin: 0;
  font-weight: 800;
  font-size: 20px;
  color: #ff5722;
  margin-bottom: 8px;
`;

const Description = styled(Dialog.Description)`
  margin: 0 0 24px 0;
  font-size: 15px;
  color: #333;
  line-height: 1.6;
`;

// Stylish close button positioned in the top-right corner
const CloseButton = styled(Dialog.Close)`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 87, 34, 0.1);
  border: 1px solid rgba(255, 87, 34, 0.2);
  color: #ff5722;
  cursor: pointer;
  transition: all 200ms;
  z-index: 3002;
  &:hover {
    background: rgba(255, 87, 34, 0.2);
    transform: scale(1.05);
  }
`;

// Footer section for action buttons (e.g., Cancel, Confirm)
const FooterContainer = styled.div`
  padding: 0 30px;
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
`;

/**
 * CommonDialog component for rendering standardized modals.
 */
const CommonDialog = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  maxWidth,
  showCloseButton = true,
  className,
  overlayClassName,
  contentClassName,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmLoading,
  confirmDisabled,
  cancelDisabled,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {/* Optional trigger element to open the dialog */}
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Overlay className={overlayClassName} />
        <Content
          $maxWidth={maxWidth}
          className={contentClassName || className}
          // logic: Prevent the dialog from closing when interacting with MathLive virtual keyboards
          onPointerDownOutside={(e) => {
            const target = e.target;
            if (
              target.closest(".ML__keyboard") ||
              target.closest(".ML__virtual-keyboard-panel") ||
              target.closest("math-field")
            ) {
              e.preventDefault();
            }
          }}
          // logic: Prevent focus loss from closing/resetting state when MathLive keyboard is active
          onFocusOutside={(e) => {
            const target = e.target;
            if (
              target.closest(".ML__keyboard") ||
              target.closest(".ML__virtual-keyboard-panel") ||
              target.closest("math-field")
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}
          </DialogHeader>

          <ScrollableBody>{children}</ScrollableBody>

          {(footer || confirmLabel || cancelLabel) && (
            <FooterContainer>
              {cancelLabel && (
                <DialogButton
                  type="button"
                  onClick={onCancel || (() => onOpenChange?.(false))}
                  disabled={cancelDisabled || confirmLoading}
                >
                  {cancelLabel}
                </DialogButton>
              )}
              {confirmLabel && (
                <DialogButton
                  $primary
                  type="button"
                  onClick={onConfirm}
                  disabled={confirmDisabled || confirmLoading}
                >
                  {confirmLoading ? "Loading..." : confirmLabel}
                </DialogButton>
              )}
              {footer}
            </FooterContainer>
          )}

          {showCloseButton && (
            <CloseButton aria-label="Close">
              <IoMdClose />
            </CloseButton>
          )}
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CommonDialog;
