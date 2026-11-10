/**
 * @file AdminContextMenu.jsx
 * @description Styled context menu component using Radix UI primitives for admin interfaces.
 * Consistent with the Metaskills admin dashboard styling.
 */

import * as ContextMenu from "@radix-ui/react-context-menu";
import styled, { keyframes } from "styled-components";

const slideUpAndFade = keyframes`
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Content = styled(ContextMenu.Content)`
  min-width: 200px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  padding: 5px;
  box-shadow:
    0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  animation-name: ${slideUpAndFade};
  border: 1px solid rgba(255, 87, 34, 0.1);
  z-index: 1000;
`;

const Item = styled(ContextMenu.Item)`
  font-size: 14px;
  line-height: 1;
  color: #333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  height: 35px;
  padding: 0 10px;
  position: relative;
  user-select: none;
  outline: none;
  cursor: pointer;
  font-family: var(--font-primary);
  font-weight: 600;
  gap: 10px;

  &[data-disabled] {
    color: #ccc;
    pointer-events: none;
  }

  &[data-highlighted] {
    background: linear-gradient(45deg, #e91e63, #ff5722);
    color: white !important;
  }

  &[data-danger="true"] {
    color: #d32f2f;
  }

  svg {
    width: 16px;
    height: 16px;
    opacity: 0.8;
  }
`;

const Separator = styled(ContextMenu.Separator)`
  height: 1px;
  background-color: rgba(255, 87, 34, 0.1);
  margin: 5px;
`;

const Label = styled(ContextMenu.Label)`
  padding-left: 10px;
  font-size: 11px;
  line-height: 25px;
  color: #999;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const AdminContextMenu = ({ children, items = [], label }) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <Content sideOffset={5} alignOffset={5}>
          {label && <Label>{label}</Label>}
          {(items || []).map((item, index) => {
            if (item.type === "separator") {
              return <Separator key={`sep-${index}`} />;
            }
            return (
              <Item
                key={item.label}
                onSelect={(e) => {
                  if (typeof item.onClick === "function") {
                    item.onClick(e);
                  }
                }}
                disabled={item.disabled}
                data-danger={item.danger ? "true" : "false"}
              >
                {item.icon}
                {item.label}
              </Item>
            );
          })}
        </Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

export default AdminContextMenu;
