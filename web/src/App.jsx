/**
 * @file App.jsx
 * @description Root application component that serves as the primary layout wrapper for routing and global UI overlays.
 * @architecture Acts as the top-level route element in React Router hierarchy, hosting global notifications and consent banner while rendering nested routes via Outlet.
 * @agent_note Be mindful when adding global providers or UI elements here, as they will mount and persist across all routes.
 */

/**
 * PURPOSE: Root application component that serves as the primary layout wrapper.
 *
 * DEPENDENCIES:
 * - react-router-dom: Provides the Outlet component for rendering nested child routes.
 * - react-hot-toast: Provides the global notification system (Toaster).
 *
 * EXPORTS:
 * - App (default): The top-level component that wraps all application routes.
 *
 * INTERCONNECTIONS:
 * - Consumed by src/main.jsx to wrap the entire application within the router.
 * - Houses the Toaster for system-wide toast notifications.
 */

import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ConsentBanner from "./components/common/ConsentBanner";
import { SpeedInsights } from "@vercel/speed-insights/react";

/**
 * App component: Main container for the application UI.
 * It provides the global toast notification context and a main container for routed content.
 *
 * @component
 * @returns {JSX.Element} Root application element containing toaster, outlet, and consent banner.
 */
function App() {
  return (
    <>
      {/* Global toast notification configuration for the entire application */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-primary)",
            fontWeight: 600,
            fontSize: "14px",
          },
        }}
      />
      {/* The main content area where child routes are rendered via React Router's Outlet */}
      <main>
        <Outlet />
      </main>
      <ConsentBanner />
      <SpeedInsights />
    </>
  );
}

export default App;
