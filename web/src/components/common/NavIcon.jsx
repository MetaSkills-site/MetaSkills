import styled from "styled-components";

/**
 * @file NavIcon.jsx
 * @description A reusable SVG wrapper for navigation icons to ensure consistent
 * viewBox, scaling, and alignment across the navbar.
 */

const StyledSvg = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
  /* Inherits fill/padding from parent (e.g., Navbar.Button) */
`;

const NavIcon = ({ children, viewBox = "0 0 24 24", ...props }) => {
  return (
    <StyledSvg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} {...props}>
      {children}
    </StyledSvg>
  );
};

export default NavIcon;
