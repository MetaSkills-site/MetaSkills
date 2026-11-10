/**
 * @file ModuleContext.jsx
 * @description Manages the global state for educational modules and provides a custom hook for state access across components.
 *
 * DEPENDENCIES:
 * - react: createContext, useState, useContext
 *
 * EXPORTS:
 * - ModuleProvider: Wrapper component to provide module state (consumed by src/main.jsx for admin routes).
 * - useModule: Custom hook to access/update module state (consumed by components/admin/ViewQuestions.jsx, components/admin/ViewModules.jsx).
 *
 * INTERCONNECTIONS:
 * - Provided at the top level for admin-related routes to ensure consistent module data across different views.
 */

import { createContext, useState, useContext } from "react";

// Initialize the context for module state
const ModuleContext = createContext();

/**
 * ModuleProvider Component
 * Wraps children components and provides them with access to the module state.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to be wrapped.
 * @returns {JSX.Element} The provider component.
 */
export function ModuleProvider({ children }) {
  // State to store the list of modules
  const [module, setModule] = useState([]);

  return (
    <ModuleContext.Provider value={{ module, setModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

/**
 * useModule Hook
 * Custom hook to consume the ModuleContext.
 *
 * @returns {Object} The context value containing 'module' and 'setModule'.
 * @throws {Error} If used outside of a ModuleProvider.
 */
export function useModule() {
  const context = useContext(ModuleContext);
  // Ensure the hook is used within its provider to prevent undefined context errors
  if (!context) {
    throw new Error("useModule must be used inside a ModuleProvider");
  }
  return context;
}
