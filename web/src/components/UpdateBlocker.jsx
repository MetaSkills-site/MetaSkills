/**
 * @file UpdateBlocker.jsx
 * @description An overlay component that forces an application update when a new Service Worker is available.
 * It prevents users from using outdated versions of the app, ensuring consistency and bug fixes.
 *
 * @dependencies
 * - react: For state management and effect hooks.
 * - styled-components: For full-screen overlay and animation styling.
 *
 * @exports UpdateBlocker (default)
 * @interconnections Communicates with the Service Worker to detect updates.
 */

import { useState, useEffect } from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #fff5f2 0%, #fff 100%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-primary);
  text-align: center;
  padding: 20px;
`;

const Icon = styled.div`
  font-size: 80px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;

  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0px);
    }
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 15px;
  font-weight: 800;
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: #666;
  max-width: 500px;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const UpdateButton = styled.button`
  padding: 12px 30px;
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 1rem;
  color: white;
  background: linear-gradient(90deg, #ff5722, #f4511e);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.3);
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const OfflineMessage = styled.div`
  margin-top: 20px;
  color: #d32f2f;
  font-weight: 600;
  font-size: 0.9rem;
  background: rgba(211, 47, 47, 0.1);
  padding: 10px 20px;
  border-radius: 8px;
`;

export default function UpdateBlocker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  /**
   * Listen for Service Worker update events and network status changes.
   */
  useEffect(() => {
    const handleUpdateFound = () => {
      setUpdateAvailable(true);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("sw-update-found", handleUpdateFound);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("sw-update-found", handleUpdateFound);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * Triggers the update process by instructing the Service Worker to update and then reloading the page.
   */
  const handleUpdate = () => {
    if (!isOffline) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then(function (registrations) {
            for (let registration of registrations) {
              registration.update();
            }
          });
      }
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <Overlay>
      <Icon>🚀</Icon>
      <Title>New Version Available</Title>
      <Message>
        A new version of MetaSkills is available with performance improvements
        and bug fixes. Please update to continue.
      </Message>

      <UpdateButton
        onClick={handleUpdate}
        disabled={isOffline}
        style={
          isOffline
            ? { opacity: 0.7, cursor: "not-allowed", transform: "none" }
            : {}
        }
      >
        {isOffline ? "Waiting for Connection..." : "Update Now"}
      </UpdateButton>

      {isOffline && (
        <OfflineMessage>
          You are currently offline. Please reconnect to update.
        </OfflineMessage>
      )}
    </Overlay>
  );
}
