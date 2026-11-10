/**
 * @file Nav.style.js
 * @description Comprehensive styles for navigation components, including the fixed navbar, profile picture, popovers, and mobile-specific menus.
 * @dependencies styled-components, radix-ui
 * @exports Navbar, ProfilePicture, PopoverWrapper, ProfilePopover, EditButton, GradeSelect, NotificationItem, NotificationTitle, NotificationDate, NotificationPreview, MobileNavToggle, MobileMenuOverlay, MobileMenuButton
 * @interconnections Integrates with Radix UI primitives to provide accessible and animated navigation interfaces across desktop and mobile devices.
 */

import { Avatar, Popover } from "radix-ui";
import styled, { keyframes } from "styled-components";

/**
 * Keyframe animations for navigation components.
 */
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

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

/**
 * Namespace for desktop navigation bar components.
 */
const Navbar = {};

/**
 * Fixed wrapper for the desktop navigation buttons.
 * Disappears on mobile screens (max-width: 768px) in favor of the mobile menu.
 */
Navbar.Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: -moz-fit-content;
  width: fit-content;
  height: 45px;
  padding: 0 10px;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 100px;

  @media (max-width: 768px) {
    display: none;
  }
`;

/**
 * Individual navigation button styling.
 * Supports a "chosen" (active) state with a pink-orange gradient.
 */
Navbar.Button = styled.div`
  display: flex;
  background: #fff;
  border: none;
  height: 45px;
  width: 45px;
  margin: auto 8px;
  border-radius: 50%;
  box-shadow:
    -3px -3px 7px -5px #8492dd26,
    3px 3px 8px -3px #da7c7424,
    6px 0 16px -4px #b5b5b52e;
  border: solid 1px #0000001a;
  transition: 400ms;

  &:hover {
    background: #eee;
  }

  &:focus {
    outline: none;
    border-color: #ff5722;
    box-shadow: 0 0 0 2px rgba(255, 87, 34, 0.2);
  }

  /* Styling for icons within navigation buttons */
  svg {
    fill: #fff;
    display: block;
    height: 100%;
    aspect-ratio: 1/1;
    margin: auto;
    fill: #00000096;
    padding: 14px;
  }

  > span {
    display: block;
    width: -moz-fit-content;
    width: fit-content;
    height: -moz-fit-content;
    height: fit-content;
    margin: auto;
  }

  /* Active/Chosen state styling */
  &.chosen {
    background: linear-gradient(45deg, #000000e8, #00000094);
    background: linear-gradient(90deg, #e91e63d1, #f44336c7, #ff5722bf);
  }
`;

/**
 * Namespace for profile-related visual components.
 */
const ProfilePicture = {};

/**
 * Styled wrapper for the profile avatar using Radix UI Avatar.Root.
 * Supports conditional shadows and filters based on the $shadow prop.
 */
ProfilePicture.Wrapper = styled(Avatar.Root)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  margin: 0;
  border-radius: 100%;

  /* Conditional logic for shadow and filter application */
  box-shadow: ${({ $shadow }) =>
    $shadow
      ? `-3px -3px 7px -5px #8492dd26, 3px 3px 8px -3px #da7c7424, 6px 0 16px -4px #b5b5b52e`
      : "none"};
  filter: ${({ $shadow }) =>
    $shadow
      ? `drop-shadow(rgba(244, 67, 54, 0.5) 0px 0px 20px) drop-shadow(rgba(255, 114, 0, 0.5) 0px 0px 100px)`
      : "none"};
`;

/**
 * Styled image for the profile avatar.
 */
ProfilePicture.Icon = styled(Avatar.Image)`
  width: 100%;
  height: 100%;
  background: none no-repeat no-repeat;
  background-size: cover;
  border-radius: 50%;
  padding: 2px;
`;

/**
 * Fallback component for the avatar when no image is available.
 * Displays initials on a pink-orange gradient background.
 */
ProfilePicture.Fallback = styled(Avatar.Fallback)`
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "quicksand", "Segoe UI", sans-serif;

  font-size: 18px;
  font-weight: 800;
  color: #fafafa;
  background: linear-gradient(90deg, #e91e63d1, #ff5722ed);
`;

/**
 * General-purpose wrapper for Popover content.
 * Manages shadows, animations, and child element positioning.
 */
const PopoverWrapper = styled.div`
  .PopoverContent {
    border-radius: 4px;
    padding: 20px;
    width: 260px;
    background-color: #fff;
    box-shadow:
      #0e121659 0 10px 38px -10px,
      #0e121633 0 10px 20px -15px;
    animation-duration: 0.4s;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform, opacity;
    z-index: 2100;

    &[data-state="open"][data-side="bottom"] {
      animation-name: ${slideUpAndFade};
    }
  }

  .PopoverContent:focus {
    box-shadow:
      #0e121659 0 10px 38px -10px,
      #0e121633 0 10px 20px -15px,
      0 0 0 2px #ff5722;
    outline: none;
  }

  .PopoverArrow {
    fill: #fff;
  }

  .PopoverClose {
    font-family: inherit;
    border-radius: 100%;
    height: 25px;
    width: 25px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #000;
    position: absolute;
    top: 5px;
    right: 5px;
  }
`;

/**
 * Specialized Popover content for displaying user profile details.
 * Features a header with an avatar, name, and email, followed by detail rows.
 */
const ProfilePopover = styled(Popover.Content)`
  outline: none;
  border-radius: 15px;
  padding: 20px;
  width: 280px;
  background-color: #fff;
  box-shadow:
    0 10px 38px -10px rgba(22, 23, 24, 0.35),
    0 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  font-family: var(--font-primary);
  z-index: 2100;

  @media (max-width: 768px) {
    max-width: calc(100vw - 40px) !important;
  }

  &[data-state="open"][data-side="bottom"] {
    animation-name: ${slideUpAndFade};
  }

  .Header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
  }

  /* Large avatar within the popover */
  .Avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(90deg, #e91e63d1, #ff5722ed);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    font-weight: bold;
    margin-bottom: 10px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .Name {
    font-size: 18px;
    font-weight: 700;
    color: #333;
    margin-bottom: 2px;
  }

  .Email {
    font-size: 14px;
    color: #666;
  }

  .Details {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .DetailRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }
  }

  .Label {
    font-size: 14px;
    font-weight: 600;
    color: #888;
  }

  .Value {
    font-size: 15px;
    font-weight: 700;
    color: #e91e63;
  }

  .Arrow {
    fill: white;
  }
`;

/**
 * Small icon button for editing profile fields (e.g., Grade level).
 */
export const EditButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  border-radius: 4px;
  transition: all 0.2s;
  margin-left: 5px;

  &:hover {
    background-color: #f0f0f0;
    color: #e91e63;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

/**
 * Dropdown selector for choosing educational grades within the profile popover.
 */
export const GradeSelect = styled.select`
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-family: inherit;
  font-size: 14px;
  color: #333;
  outline: none;
  background-color: white;
  cursor: pointer;

  &:focus {
    border-color: #e91e63;
  }
`;

/**
 * Loading spinner animation for grade saving and other async actions.
 */
export const LoadingSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid #ccc;
  border-top-color: #e91e63;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

/**
 * Individual entry in the notification list.
 */

const NotificationItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;

  &:hover {
    background: #f9f9f9;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #e91e63;
`;

const NotificationDate = styled.span`
  font-size: 0.7rem;
  color: #999;
  white-space: nowrap;
  margin-left: 10px;
`;

/**
 * Preview text for notifications with truncation and a fade-out gradient.
 */
const NotificationPreview = styled.div`
  font-size: 0.9rem;
  color: #555;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;

  /* Gradient fade-out to indicate text continues */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(to right, transparent, white);
    pointer-events: none;
  }
`;

// --- Mobile Menu Specific Styles ---

/**
 * Toggle button for the mobile navigation menu.
 * Only visible on mobile devices (max-width: 768px).
 */
export const MobileNavToggle = styled.button`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    top: 15px;
    right: 15px;
    z-index: 2000;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    background: white;
    border: none;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #333;
    font-size: 1.5rem;

    &:active {
      transform: scale(0.95);
    }

    &:focus-visible {
      outline: 2px solid #ff5722;
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(255, 87, 34, 0.2);
    }
  }
`;

/**
 * Full-screen overlay for the mobile navigation menu.
 * Features a backdrop blur and centers navigation buttons.
 */
export const MobileMenuOverlay = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(5px);
    z-index: 1999;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
    /* Visibility logic based on $isOpen prop */
    opacity: ${(props) => (props.$isOpen ? 1 : 0)};
    pointer-events: ${(props) => (props.$isOpen ? "all" : "none")};
    transition: opacity 0.3s ease;
  }
`;

/**
 * Large action button used within the mobile navigation overlay.
 */
export const MobileMenuButton = styled.button`
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  margin-bottom: 5px;
  width: 80%;
  border-radius: 12px;
  transition: all 0.2s;

  &:active {
    background: rgba(0, 0, 0, 0.05);
  }

  &:focus-visible {
    outline: 2px solid #ff5722;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(255, 87, 34, 0.2);
  }

  svg {
    width: 28px;
    height: 28px;
    color: #e91e63;
    display: inline-block;
  }
`;

export {
  Navbar,
  ProfilePicture,
  PopoverWrapper,
  ProfilePopover,
  NotificationItem,
  NotificationTitle,
  NotificationDate,
  NotificationPreview,
};
