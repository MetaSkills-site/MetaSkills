/**
 * @file Editor.style.js
 * @description Styles for the Slate.js rich text editor, including the main container, toolbar, and editable field.
 * @dependencies slate-react, styled-components, ./Flex.style
 * @exports EditorMain, Toolbar, Field
 * @interconnections Used by the Editor component to provide a polished rich-text editing experience.
 */

import { Editable } from "slate-react";
import styled from "styled-components";
import { Flex } from "../../styles/Flex.style";

/**
 * Main container for the rich text editor.
 * Features a white background, rounded corners, and a subtle orange-tinted shadow.
 */
const EditorMain = styled(Flex)`
  background: #fff;
  border: solid 1px #eeeeee8f;
  border-radius: 15px;
  flex: 1;
  margin: 10px;
  /* Multi-layered shadow for a soft, elevated look */
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 4px 6px rgba(0, 0, 0, 0.05),
    1px 1px 30px -10px rgba(240, 135, 93, 0.22);
  max-width: 100%;
  height: 100%;
  box-sizing: border-box;
`;

/**
 * Toolbar section of the editor.
 * Contains formatting buttons and handles overflow for small screens.
 */
const Toolbar = styled(Flex)`
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.03);
  border-bottom: solid 1px #eee;
  background: #fff5f573;
  padding-block: 10px;
  overflow-x: auto; /* Allow horizontal scrolling for many toolbar items */
  scrollbar-width: none; /* Hide scrollbar in Firefox for cleaner look */
  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar in Chrome/Safari */
  }

  /* Styling for individual toolbar item wrappers */
  > div > span {
    margin: 2px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0; /* Prevent icons from shrinking */
    margin-inline: 5px;

    /* Styling for the interactive elements (buttons/icons) */
    > * {
      width: 20px;
      height: 20px;
      padding: 8px;
      box-sizing: content-box;
      fill: #e4633fff;
      stroke: #e4633fff;
      border-radius: inherit;
      transition: 400ms;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #bbbbbb40;
      }

      /* SVG icons inside the interactive elements */
      svg {
        width: 100%;
        height: 100%;
        padding: 0;
        display: block;
        fill: inherit;
        stroke: inherit;
      }
    }
  }
`;

/**
 * The primary editable area of the Slate editor.
 * Handles padding, focus states, and responsive media (images).
 */
const Field = styled(Editable)`
  flex: 1;
  min-height: 0;
  padding: 20px 30px;
  &:focus {
    outline: none;
  }
  > div {
    max-width: 100%;
    overflow-x: auto; /* Enable horizontal scrolling for wide content */

    /* Responsive image handling within the editor */
    > div > img {
      max-width: 100%;
      height: auto;
      max-height: 400px;
      object-fit: contain;
    }
  }
`;

export { EditorMain, Toolbar, Field };
