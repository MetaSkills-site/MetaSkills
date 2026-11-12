/**
 * @file ConsentBanner.jsx
 * @description Cookie consent banner prompting users for analytics and tracking agreement with local storage persistence.
 * @architecture Root-level floating notification layer displayed conditionally based on local storage consent status.
 * @agent_note Checks and writes to "metaskills-cookie-consent" key in localStorage; ensure safe fallback when storage is unavailable.
 */

import { useState, useEffect } from "react";
import styled from "styled-components";

const ConsentBannerWrapper = styled.div`
  .cookie-consent-container {
    position: fixed !important;
    bottom: var(--space-xl) !important;
    right: var(--space-xl) !important;
    background-color: var(--bg-card) !important;
    color: var(--text-main) !important;
    box-shadow: var(--shadow-lg) !important;
    border-radius: var(--keycap-border-radius) !important;
    padding: var(--space-md) var(--space-lg) !important;
    z-index: 9999 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: var(--space-md) !important;
    max-width: 350px !important;
    border: 1px solid var(--keycap-border) !important;
    align-items: flex-start !important;
    font-family: var(--font-primary) !important;
  }

  .cookie-consent-content {
    flex: 1 !important;
    margin: 0 !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
  }

  .cookie-consent-buttons {
    display: flex !important;
    gap: var(--space-sm) !important;
    width: 100% !important;
    justify-content: flex-end !important;
  }

  .cookie-consent-btn {
    background-color: var(--color-primary) !important;
    color: var(--text-inverse) !important;
    border: none !important;
    padding: var(--space-sm) var(--space-md) !important;
    border-radius: calc(var(--keycap-border-radius) / 2) !important;
    font-family: var(--font-primary) !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: background-color 0.2s ease !important;
    font-size: 14px !important;
  }

  .cookie-consent-btn:hover {
    background-color: var(--color-primary-dark) !important;
  }

  .cookie-consent-decline-btn {
    background-color: transparent !important;
    color: var(--text-muted) !important;
    border: 1px solid var(--keycap-border) !important;
  }

  .cookie-consent-decline-btn:hover {
    background-color: var(--bg-muted) !important;
    color: var(--text-main) !important;
  }
`;

/**
 * ConsentBanner component prompting user for cookie consent.
 *
 * @component
 * @returns {JSX.Element|null} Fixed cookie consent notification banner or null if already consented.
 */
const ConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("metaskills-cookie-consent");
      if (!consent) {
        setIsVisible(true);
      }
    } catch (e) {
      console.warn("localStorage is blocked or unavailable.", e);
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("metaskills-cookie-consent", "true");
    } catch (e) {
      console.warn("Could not save to localStorage.", e);
    } finally {
      setIsVisible(false);
    }
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("metaskills-cookie-consent", "false");
    } catch (e) {
      console.warn("Could not save to localStorage.", e);
    } finally {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <ConsentBannerWrapper>
      <div className="cookie-consent-container">
        <div className="cookie-consent-content">
          We use cookies to improve your experience and analyze usage.
        </div>
        <div className="cookie-consent-buttons">
          <button
            className="cookie-consent-btn cookie-consent-decline-btn"
            onClick={handleDecline}
          >
            Decline
          </button>
          <button className="cookie-consent-btn" onClick={handleAccept}>
            Accept
          </button>
        </div>
      </div>
    </ConsentBannerWrapper>
  );
};

export default ConsentBanner;
