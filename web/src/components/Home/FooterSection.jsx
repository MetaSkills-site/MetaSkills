/**
 * @file FooterSection.jsx
 * @description Renders the footer component for the Home page, including site logo, navigation links,
 * copyright information, and contact details.
 *
 * @dependencies
 * - React (useState): For managing image loading state.
 * - HomeStyles: Styled components for layout and theme (Section, FooterContent, etc.).
 * - SkeletonLoader (SkeletonCircle): For showing a placeholder while the logo loads.
 *
 * @exports FooterSection - The functional component for the footer.
 *
 * @interconnections
 * - This component is typically placed at the bottom of the Home page container.
 */

import { useState } from "react";
import {
  Section,
  FooterContent,
  FooterLeft,
  FooterRight,
  FooterLinks,
  FooterLink,
  Copyright,
  ContactItem,
  ContactTitle,
} from "./HomeStyles";
import { SkeletonCircle } from "../SkeletonLoader";

const FooterSection = () => {
  // State to track if the logo image has finished loading
  const [isFooterIconLoaded, setIsFooterIconLoaded] = useState(false);

  return (
    <Section
      style={{
        height: "100vh",
        background: "#f8f9fa",
        justifyContent: "center",
      }}
    >
      <FooterContent>
        {/* Left: Links & Copyright */}
        <FooterLeft>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {/* Show skeleton while icon is loading */}
            {!isFooterIconLoaded && <SkeletonCircle $size="40px" />}
            <img
              src="/transparent_icon.webp"
              alt="Logo"
              style={{
                width: "40px",
                display: isFooterIconLoaded ? "block" : "none",
              }}
              onLoad={() => setIsFooterIconLoaded(true)}
            />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                color: "#333",
              }}
            >
              MetaSkills
            </span>
          </div>
          <FooterLinks>
            <FooterLink href="/privacy-policy.html" target="_blank">
              Privacy Policy
            </FooterLink>
            <FooterLink href="/terms-of-service.html" target="_blank">
              Terms of Service
            </FooterLink>
          </FooterLinks>
          <Copyright>
            {/* Dynamically display the current year for copyright */}
            &copy; {new Date().getFullYear()} MetaSkills. All rights reserved.
          </Copyright>
        </FooterLeft>

        {/* Right: Contact */}
        <FooterRight>
          <ContactItem>
            <ContactTitle>For any queries</ContactTitle>
            <p>Reach out to us at:</p>
            <a href="mailto:metaskillseducation@gmail.com">
              metaskillseducation@gmail.com
            </a>
          </ContactItem>
          {/* Note: Additional contact sections for educators and developers are currently commented out */}
        </FooterRight>
      </FooterContent>
    </Section>
  );
};

export default FooterSection;
