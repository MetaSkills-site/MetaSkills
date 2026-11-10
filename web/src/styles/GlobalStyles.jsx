/**
 * @file GlobalStyles.jsx
 * @description Global styling for the entire application, including CSS variables (theme), font face declarations, and base element resets.
 * @dependencies styled-components
 * @exports GlobalStyle
 * @interconnections Injected at the application root to provide consistent branding and base styles across all components.
 */

import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  :root {
    /* Base Color Palette - Used for primary branding and UI elements */
    --color-primary: #ff5722;
    --color-primary-light: #ff8a50;
    --color-primary-dark: #c41c00;
    --color-secondary: #e91e63;
    --color-secondary-light: #ff6090;
    --color-secondary-dark: #b0003a;
    --color-accent: #ff9800;

    /* Typography Fonts */
    --font-primary: 'quicksand', sans-serif;
    --font-display: 'Made', sans-serif;
    --font-script: 'Dancing Script', cursive;
    --font-handwritten: 'Handlee', cursive;

    /* Surface & Background Colors - Defines the layer hierarchy */
    --bg-main: #ffffff;
    --bg-card: #ffffff;
    --bg-elevated: #f8f9fa;
    --bg-muted: #f0f0f0;

    /* Typography Colors - High and low contrast text variants */
    --text-main: #333333;
    --text-muted: #666666;
    --text-inverse: #ffffff;

    /* Status & Feedback Colors - Semantic colors for user alerts */
    --status-success: #4caf50;
    --status-warning: #ff9800;
    --status-error: #f44336;

    /* Spacing Scale - Consistent margin and padding increments */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-xxl: 64px;

    /* Shared Elevation Shadows */
    --shadow-lg: 0 10px 20px rgba(0,0,0,0.15);

    /* MathLive Virtual Keyboard Customization - Sleek & Branded overrides for the math input system */
    --keyboard-zindex: 4000;
    --keyboard-accent-color: #ff5722; 
    --keyboard-background: #ffffff;
    --keyboard-toolbar-background: #ffffff;
    --keyboard-toolbar-background-hover: #f8f9fa;
    --keyboard-toolbar-text: #555;
    
    --keycap-background: #fff;
    --keycap-background-hover: #fcfcfc;
    --keycap-text: #444;
    --keycap-primary-background: #ff5722;
    --keycap-primary-text: #ffffff;
    
    --keycap-border-radius: 12px;
    --keycap-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
    --keycap-border: 1px solid #ebebeb;
    --keycap-border-bottom: 2px solid #e0e0e0;
    
    --keycap-gap: 10px;
    --keycap-font-family: var(--font-primary);
    --keycap-font-size: 18px;
    
    --keyboard-padding-horizontal: 16px;
    --keyboard-padding-top: 16px;
    --keyboard-padding-bottom: 16px;
  }

  /* Custom Font Face Declarations */

  @font-face {
    font-family: 'Made';
    src: url(/fonts/MADE.otf) format("opentype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'quicksand';
    src: url(/fonts/quicksand.woff2) format("woff2");
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Dancing Script';
    src: url(/fonts/dancingscript.woff2) format("woff2");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Handlee';
    src: url(/fonts/handlee.woff2) format("woff2");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'AsanaMath';
    src: url(/fonts/Asana-Math.woff) format("woff");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  /* Global Reset & Base Element Styling */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    outline: none;
    -webkit-tap-highlight-color: transparent; /* Removes blue tap highlight on mobile */
  }


  html,
  body {
    min-height: 100vh;
    margin: 0 !important;
    padding: 0 !important;
    font-family: 'quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    /* Complex multi-stop gradient for a soft, professional background texture */
    background: linear-gradient(
      45deg,
      #4caf5040,
      #fff,
      #fff,
      #3f7cb500,
      #fff,
      #b64bc80d,
      #fff,
      #fff,
      #ffe69a12,
      #fff,
      #fff,
      #fc6c6114,
      #fff,
      #5dbe6114,
      #ff764b24
    );
    -webkit-user-select: none;
    user-select: none; /* Disables text selection across the app for a native-feel */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* Backdrop blur effect applied to the body background */
  body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: blur(75px);
    -webkit-backdrop-filter: blur(75px);
    z-index: -1;
    pointer-events: none;
  }
  
  html {
    scroll-behavior: smooth;
    draggable: false;
    -webkit-user-drag: none;
    -moz-user-drag: none;
    -ms-user-drag: none;
  }

  main {
    min-height: 100vh;
    position: relative;
  }

  /* Global image settings to prevent dragging and selection */
  img {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    draggable: false;
    -webkit-user-drag: none;
    -moz-user-drag: none;
    -ms-user-drag: none;
    }
`;
