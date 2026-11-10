/**
 * @file Auth.styles.jsx
 * @description Styles for the authentication pages, including Login, Register, OTP, and Password Reset screens.
 * @dependencies styled-components, radix-ui, ./Shared.styles
 * @exports AuthPage, AuthContainer, AuthForm, OtpRoot, OtpInput, ResendButton, FormRoot, FormButton, ForgotPassLink, NavBack
 * @interconnections Imports base styles from Shared.styles.js to ensure consistency with the rest of the app's forms and buttons.
 */

import styled from "styled-components";
import {
  Form,
  unstable_OneTimePasswordField as OneTimePasswordField,
} from "radix-ui";
import {
  BaseInputStyles,
  PrimaryButtonStyles,
  GhostLinkContainerStyles,
  FormRoot as SharedFormRoot,
} from "./Shared.styles";

/**
 * Main layout wrapper for authentication pages.
 * Features a full-height vibrant gradient background.
 */
export const AuthPage = styled.div`
  background: linear-gradient(
    356deg,
    #ff9800c7,
    #ff5722bd,
    #f44336cc,
    #e91e63a6
  );
  background-repeat: no-repeat;
  display: flex;
  height: 100vh;
  /* Align content to the right (end) of the viewport */
  justify-content: flex-end;
`;

/**
 * Centered container for auth content (the white panel).
 * Provides a clean white background with backdrop blurring and massive shadow depth.
 */
export const AuthContainer = styled.div`
  height: 100vh;
  width: 45%;
  padding-inline: 5%;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  backdrop-filter: blur(10px);
  filter: none;
  /* Large white box-shadows used to create a soft, glowing separation from the background */
  box-shadow:
    -146px 100px 200px 100px #fff,
    -146px -100px 200px 100px #fff;
  align-content: center;
  align-items: center;

  /* Heading style (branding) within the container */
  & > span:nth-child(1) {
    font-family: var(--font-display);
    font-size: 55px;
    background: linear-gradient(90deg, #ff538d, #ff7b51);
    filter: drop-shadow(1px 1px 1px rgb(255 123 81 / 50%));
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    margin: 20px auto;
  }

  /* Subheading/description style below the main title */
  & > span:nth-child(2) {
    font-family: var(--font-primary);
    font-size: 16px;
    font-weight: bold;
    color: #0000008c;
  }
`;

/**
 * Styled wrapper for the authentication form inputs.
 * Includes soft pinkish shadows to differentiate from the container background.
 */
export const AuthForm = styled.div`
  width: 100%;
  padding: 40px 30px;
  box-shadow:
    #f8bbd085 0 25px 45px -4px,
    #f0f4c373 0 -25px 45px -4px;
  border: solid 1px #ddd;
  border-radius: 20px;
  margin: 20px;
  font-family: var(--font-primary);
`;

/**
 * Root component for One-Time Password (OTP) fields.
 * Manages the layout and spacing of individual OTP digit inputs.
 */
export const OtpRoot = styled(OneTimePasswordField.Root)`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
`;

/**
 * Individual input field for OTP digits.
 * Inherits base input styles with customized dimensions for single characters.
 */
export const OtpInput = styled(OneTimePasswordField.Input)`
  ${BaseInputStyles}
  width: 45px;
  height: 50px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
`;

/**
 * Styled text button for resending verification codes.
 * Features hover state transitions and icon alignment.
 */
export const ResendButton = styled.span`
  font-size: 15px;
  font-weight: 600;
  display: flex;
  width: -moz-fit-content;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 10px;
  color: #ff5722;
  transition: 500ms;
  cursor: pointer;

  &:hover {
    background: #b0533638;
  }

  /* Style for icons (e.g., refresh/send) within the resend button */
  & > svg {
    width: 15px;
    height: 15px;
    flex: 1;
    margin: auto 6px;
    fill: #ff5722d6;
  }
`;

/* Aliased shared form root to maintain consistent form behavior in auth context */
export const FormRoot = styled(SharedFormRoot)``;

/**
 * Specialized form submission button for auth screens.
 * Inherits primary button styles for brand consistency.
 */
export const FormButton = styled(Form.Submit)`
  ${PrimaryButtonStyles}
`;

/**
 * Link-style button for navigating to the password recovery screen.
 * Inherits ghost link styles from shared definitions.
 */
export const ForgotPassLink = styled.button`
  ${GhostLinkContainerStyles}
`;

/**
 * Styled navigation element for going back to previous screens (e.g., Back to Login).
 * Consistent with ResendButton styling for a cohesive feel.
 */
export const NavBack = styled.div`
  display: flex;
  width: -moz-fit-content;
  width: fit-content;
  height: -moz-fit-content;
  height: fit-content;
  padding: 6px 10px;
  margin-bottom: 20px;
  color: #ff5722;
  border-radius: 10px;
  transition: 500ms;
  cursor: pointer;

  &:hover {
    background: #b0533638;
  }

  & > svg {
    width: 12px;
    height: 12px;
    fill: #ff5722d6;
    display: block;
    margin: auto;
  }

  & > span {
    font-size: 14px;
    font-weight: 800;
    margin-left: 6px;
  }
`;
