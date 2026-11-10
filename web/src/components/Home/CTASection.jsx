/**
 * @file CTASection.jsx
 * @description The Call-To-Action (CTA) section of the Home page. It encourages users to
 * sign in and join the learning community, providing a secure Google Authentication entry point.
 *
 * @dependencies
 * - React: Basic component structure.
 * - HomeStyles: Styled components for theme-consistent sections and titles.
 * - GoogleAuth: The authentication component for user sign-in.
 *
 * @exports CTASection - The functional component for the final CTA on the landing page.
 *
 * @interconnections
 * - Integrates with the GoogleAuth service to handle user sessions.
 * - Placed before the footer to capture user interest after they've scrolled through features.
 */

import { Section, SectionTitle } from "./HomeStyles";
import GoogleAuth from "../GoogleAuth";

const CTASection = () => {
  return (
    <Section style={{ height: "100vh" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          padding: "0 20px",
          textAlign: "center",
        }}
      >
        {/* Main CTA Heading with highlighted span */}
        <SectionTitle style={{ marginBottom: "20px", fontSize: "3rem" }}>
          Ready to <span>Excel?</span>
        </SectionTitle>

        {/* Descriptive text outlining the benefits of joining */}
        <p
          style={{
            fontSize: "1.3rem",
            color: "#666",
            marginBottom: "50px",
            maxWidth: "650px",
            lineHeight: "1.6",
          }}
        >
          Join a community of learners mastering Math and English. Sign in with
          Google to track your progress, unlock achievements, and access
          customized learning paths securely.
        </p>

        {/* Scaled authentication button for visual emphasis */}
        <div style={{ transform: "scale(1.2)" }}>
          <GoogleAuth />
        </div>
      </div>
    </Section>
  );
};

export default CTASection;
