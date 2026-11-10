/**
 * @file RunScripts.jsx
 * @description Admin modal interface for executing server-side maintenance and utility scripts.
 *
 * Dependencies:
 * - @tanstack/react-query: Manages script list fetching and execution mutations.
 * - styled-components: Provides a terminal-like aesthetic for script results.
 * - react-icons: Icons for script execution and status.
 * - adminService: API service for interacting with the backend script registry.
 *
 * Exports:
 * - RunScripts (default): A modal component containing the script runner interface.
 *
 * Interconnections:
 * - Intended for use within the Admin Dashboard for developer-level system maintenance.
 */

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { FaPlay, FaSpinner } from "react-icons/fa";
import { IoTerminal } from "react-icons/io5";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import CommonDialog from "../common/CommonDialog";
import { DialogButtonGroup, DialogButton } from "./AdminStyles";
import { getScripts, runScript } from "../../services/adminService";

/**
 * Scrollable list container for available scripts.
 */
const ScriptList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 250px;
  flex: 1;
  min-height: 100px;
  padding-right: 5px;
  margin-top: 10px;
`;

/**
 * Individual script row with hover effects.
 */
const ScriptItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #eee;
  transition: all 0.2s;

  &:hover {
    background: #fff5f2;
    border-color: rgba(255, 87, 34, 0.3);
    transform: translateY(-1px);
  }
`;

const ScriptInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ScriptName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
`;

const ScriptDesc = styled.span`
  font-size: 13px;
  color: #7f8c8d;
`;

/**
 * Keyframes for the loading spinner.
 */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/**
 * Specialized button for triggering script execution with a loading state.
 */
const RunButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: ${(props) =>
    props.$isLoading ? "#e0e0e0" : "rgba(255, 87, 34, 0.1)"};
  color: ${(props) => (props.$isLoading ? "#757575" : "#ff5722")};
  cursor: ${(props) => (props.$isLoading ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  &:hover {
    background: ${(props) =>
      props.$isLoading ? "#e0e0e0" : "rgba(255, 87, 34, 0.2)"};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    animation: ${(props) => (props.$isLoading ? spin : "none")} 1s linear
      infinite;
    font-size: 14px;
    margin-left: ${(props) => (props.$isLoading ? "0" : "2px")};
  }
`;

/**
 * Styled block for displaying script output (stdout/stderr).
 */
const TerminalOutput = styled.pre`
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 250px;
  overflow-y: auto;
  margin-top: 15px;
  border: 1px solid #3e4451;
`;

const TerminalTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50c1;
  margin-top: 20px;
`;

const RunScripts = ({ open, onOpenChange }) => {
  // Track which specific script is currently executing to show the correct spinner.
  const [runningScript, setRunningScript] = useState(null);

  // ── Query ──────────────────────────────────────────────────────────────────

  /**
   * Fetches the list of scripts from the server when the modal is opened.
   * staleTime is set to 10 minutes as the registry changes infrequently.
   */
  const { data } = useQuery({
    queryKey: ["adminScripts"],
    queryFn: () => getScripts(),
    enabled: open,
    staleTime: 10 * 60_000,
  });

  const scripts = data?.data ?? [];

  // ── Mutation ──────────────────────────────────────────────────────────────

  /**
   * Handles the execution of a script and captures its terminal output.
   */
  const runScriptMutation = useMutation({
    mutationFn: (scriptKey) => runScript(scriptKey),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error("Script execution reported errors");
      }
    },
    onError: (err) => {
      console.error("Execution failed:", err);
      toast.error(err.response?.data?.message || "Execution failed");
    },
    onSettled: () => setRunningScript(null),
  });

  // Reset execution state and output when the modal is closed.
  useEffect(() => {
    if (!open) {
      runScriptMutation.reset();
      setRunningScript(null);
    }
  }, [open]);

  const handleRun = (scriptKey) => {
    setRunningScript(scriptKey);
    runScriptMutation.mutate(scriptKey);
  };

  // Consolidate terminal output from successful response, error response, or generic error string.
  const output =
    runScriptMutation.data?.output ??
    runScriptMutation.error?.response?.data?.output ??
    (runScriptMutation.isError ? String(runScriptMutation.error) : null);

  return (
    <CommonDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <>
          <IoTerminal
            size={24}
            style={{ marginRight: "10px", verticalAlign: "-4px" }}
          />
          System Maintenance
        </>
      }
      description="Run server-side maintenance scripts. These are intended for use by the developer only."
      footer={
        <DialogButtonGroup>
          <DialogButton onClick={() => onOpenChange(false)}>Close</DialogButton>
        </DialogButtonGroup>
      }
    >
      <ScriptList>
        {/* Render each script with its own run button. */}
        {scripts.map((script) => (
          <ScriptItem key={script.key}>
            <ScriptInfo>
              <ScriptName>{script.name}</ScriptName>
              <ScriptDesc>{script.description}</ScriptDesc>
            </ScriptInfo>
            <RunButton
              onClick={() => handleRun(script.key)}
              disabled={runScriptMutation.isPending}
              $isLoading={
                runningScript === script.key && runScriptMutation.isPending
              }
              title="Run Script"
            >
              {runningScript === script.key && runScriptMutation.isPending ? (
                <FaSpinner />
              ) : (
                <FaPlay />
              )}
            </RunButton>
          </ScriptItem>
        ))}
        {/* Fallback for empty script registry. */}
        {scripts.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
            No scripts available
          </div>
        )}
      </ScriptList>

      {/* Show the terminal output block only when output is available. */}
      {output && (
        <>
          <TerminalTitle>Terminal Output</TerminalTitle>
          <TerminalOutput>{output}</TerminalOutput>
        </>
      )}
    </CommonDialog>
  );
};

export default RunScripts;
