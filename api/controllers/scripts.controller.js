/**
 * @file scripts.controller.js
 * @description Controller for executing admin maintenance scripts.
 * @architecture Interfaces with the scripts registry to run background tasks via child_process.
 */
import { exec } from "child_process";
import { SCRIPTS_REGISTRY } from "../config/scripts.registry.js";
import expressAsyncHandler from "express-async-handler";

/**
 * @desc    Run a maintenance script
 * @route   POST /api/admin/scripts/run
 * @access  Private (Admin)
 */
const runScript = expressAsyncHandler(async (req, res) => {
  const { scriptKey } = req.body;

  if (!scriptKey || !SCRIPTS_REGISTRY[scriptKey]) {
    res.status(400);
    throw new Error(`Invalid script key: ${scriptKey}`);
  }

  const scriptDef = SCRIPTS_REGISTRY[scriptKey];
  console.log(
    `[ScriptRunner] Executing: ${scriptDef.name} (${scriptDef.path})`,
  );

  // Execute the script using node
  exec(`node "${scriptDef.path}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[ScriptRunner] Error: ${error.message}`);
      // We return 200 even on script failure so frontend shows the output logs
      // unless it's a critical execution error
      return res.json({
        success: false,
        message: "Script executed with errors",
        output: stdout + "\n" + stderr,
        error: error.message,
      });
    }

    console.log(`[ScriptRunner] Success`);
    res.json({
      success: true,
      message: "Script executed successfully",
      output: stdout || stderr || "No output returned.",
    });
  });
});

/**
 * @desc    Get list of available scripts
 * @route   GET /api/admin/scripts
 * @access  Private (Admin)
 */
const getScripts = expressAsyncHandler(async (req, res) => {
  // Transform registry to array for frontend
  const scripts = Object.keys(SCRIPTS_REGISTRY).map((key) => ({
    key,
    name: SCRIPTS_REGISTRY[key].name,
    description: SCRIPTS_REGISTRY[key].description,
  }));

  res.json({
    success: true,
    data: scripts,
  });
});

export default {
  runScript,
  getScripts,
};
