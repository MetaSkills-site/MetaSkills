/**
 * @file Card.style.js
 * @description Base card component style used as a container for various UI elements throughout the application.
 * @dependencies styled-components
 * @exports Card
 * @interconnections Extended by other components like ModuleCard.style.js and used in dashboard layouts.
 */

import styled from "styled-components";

/**
 * Base Card component with consistent padding, border-radius, and complex box-shadows.
 * Provides a "glassmorphism" or elevated feel for UI containers.
 */
export const Card = styled.div`
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 40px;
  margin: 0;
  border-radius: 24px;
  /* 
   * Multi-layered shadow for depth and soft borders:
   * 1. Large soft shadow for elevation
   * 2. Inverse shadow for a "pressed" or "beveled" look
   * 3. Subtle outer shadow for separation
   * 4. 1px solid-like border using spread-less shadow
   */
  box-shadow:
    20px 20px 60px #ebd6cb5c,
    -20px -20px 60px #f3f3f3bf,
    #6666661a 0 10px 36px,
    #0000000f 0 0 0 1px;
  border: solid 1px #adadad33;
  background: #fffc; /* Semi-transparent background for glass effect */

  /* Responsive padding adjustment for smaller devices */
  @media (max-width: 768px) {
    padding: 25px;
  }
`;
