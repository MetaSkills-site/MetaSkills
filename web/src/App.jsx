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

/**
 * App component: Main container for the application UI.
 * It provides the global toast notification context and a main container for routed content.
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
    </>
  );
}

export default App;
