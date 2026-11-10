/**
 * @file AdminHeader.jsx
 * @description Reusable header component for the Admin dashboard. Provides a consistent
 * title layout and integrated back-navigation functionality with shortcut support.
 *
 * @dependencies
 * - react-router-dom: For programmatic navigation using useNavigate.
 * - styled-components: For layout and typography styling.
 * - AdminStyles: For the themed HomeIcon (back button) component.
 * - Flex, Font: Shared layout and typography primitives.
 *
 * @exports
 * - AdminHeader (default): The functional component for the page header.
 *
 * @interconnections
 * Utilized by virtually every admin page (Dashboard, ViewModules, UserHistory, etc.)
 * to maintain visual hierarchy and navigation consistency.
 */

import { useNavigate } from "react-router-dom";
import { Flex } from "../../styles/Flex.style";
import { Font } from "../../styles/Font.style";
import { HomeIcon } from "./AdminStyles.jsx";

import styled from "styled-components";

/**
 * Main container for the header, uses flexbox to align navigation and titles.
 */
const HeaderContainer = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const HeaderTitleFlex = styled(Flex)`
  align-items: center;
  gap: 10px;
`;

/**
 * Empty spacer element used to balance the flex layout,
 * ensuring the title remains centered relative to the back button.
 */
const Spacer = styled.div`
  width: 32px;
  height: 32px;
`;

const HeaderTitleText = styled(Font)`
  text-align: center;
  margin: 0;
  width: -moz-fit-content;
  width: fit-content;
`;

/**
 * AdminHeader Component
 * @param {string} title - The text to display as the page heading.
 * @param {string} backPath - (Optional) Specific route to navigate back to.
 * @param {function} onBack - (Optional) Custom callback function for the back action.
 * @param {object} style - (Optional) Inline styles for the container.
 * @param {boolean} disableShortcut - If true, disables the 'Backspace/Escape' shortcut for navigation.
 * @param {string} backText - (Optional) Descriptive text for the back button (e.g. "Back to Users").
 */
const AdminHeader = ({
  title,
  backPath,
  onBack,
  style,
  disableShortcut = false,
  backText,
}) => {
  const navigate = useNavigate();

  /**
   * Centralized back-navigation logic.
   * Order of precedence: Custom Callback > Defined Path > Browser History Back.
   */
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <HeaderContainer style={style}>
      {/* Back button with optional keyboard shortcut listener and flexible variant */}
      <HomeIcon
        enableShortcut={!disableShortcut}
        onClick={handleBack}
        text={backText}
        variant={backText ? "link" : "icon-circle"}
      />

      <HeaderTitleFlex>
        <HeaderTitleText
          $name="Made, segoe ui, sans serif"
          $size="25px"
          $gradient="linear-gradient(90deg, #E91E63, #ff4800)"
        >
          {title}
        </HeaderTitleText>
      </HeaderTitleFlex>

      {/* Visually balances the back button on the left */}
      <Spacer aria-hidden="true" />
    </HeaderContainer>
  );
};

export default AdminHeader;
