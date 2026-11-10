/**
 * @file email.controller.js
 * @description Handles email operations such as sending application error reports.
 * @architecture Controller layer that interfaces with the Brevo email service and AI service for intelligent error analysis.
 */
import brevo from "../config/brevo.js";
import expressAsyncHandler from "express-async-handler";
import { getPromptConfig } from "../config/aiPromptConfig.js";
import { aiService } from "../services/ai.service.js";

/**
 * @desc    Process and send an application error report, attempting AI analysis of the error before dispatch
 * @route   POST /api/email/error-report
 * @access  Public
 */
export const sendErrorReport = expressAsyncHandler(async (req, res) => {
  const { error, url, userAgent, platform, language } = req.body;

  let aiAnalysis = "";

  try {
    const errorDetails = `
      Message: ${error?.message}
      Stack: ${error?.stack}
      URL: ${url}
      User Agent: ${userAgent}
      Platform: ${platform}
      Language: ${language}
    `;

    const configStrings = getPromptConfig("error_analysis", { errorDetails });
    const modelsToTry = configStrings.models || [
      configStrings.model || "gemini-3-flash-preview",
    ];

    const { text: aiResponseText } = await aiService.generateWithFallback(
      modelsToTry,
      configStrings.prompt,
      configStrings.systemInstruction,
    );

    if (aiResponseText) {
      aiAnalysis = `
        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; color: #1976d2;">AI Error Analysis & Master Prompt</h3>
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; border: 1px solid #bbdefb; white-space: pre-wrap;">
          ${aiResponseText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </div>
      `;
    }
  } catch (aiErr) {
    console.error(
      "AI Error Analysis failed, proceeding with standard report:",
      aiErr,
    );

    // Attempt to extract a readable message from the error
    let aiErrorMessage = aiErr.message || String(aiErr);

    aiAnalysis = `
      <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; color: #d32f2f;">AI Error Analysis Failed</h3>
      <div style="background: #ffebee; padding: 15px; border-radius: 6px; border: 1px solid #ef9a9a;">
        <p style="color: #c62828; margin-top: 0;"><strong>Error requesting AI analysis:</strong></p>
        <pre style="background: #fff; padding: 10px; overflow-x: auto; border: 1px solid #ffcdd2; font-size: 13px; color: #b71c1c; white-space: pre-wrap;">${aiErrorMessage.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        <p style="color: #666; font-size: 12px; margin-bottom: 0; margin-top: 10px;"><em>The standard error report has still been captured and delivered successfully.</em></p>
      </div>
    `;
  }

  const payload = {
    sender: {
      name: "MetaSkills Error Reporter",
      email: "metaskillseducation@gmail.com",
    },
    to: [{ email: "metaskillseducation@gmail.com" }],
    subject: `Error Report: ${error?.message || "Unknown Error"}`,
    htmlContent: `
      <div style="font-family: monospace; background: #f5f5f5; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d32f2f;">Application Error Report</h2>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
        
        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Error Details</h3>
        <p><strong>Message:</strong> ${error?.message}</p>
        <p><strong>Stack:</strong></p>
        <pre style="background: #fff; padding: 10px; overflow-x: auto; border: 1px solid #ddd;">${error?.stack}</pre>
        
        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;">System Info</h3>
        <ul>
          <li><strong>User Agent:</strong> ${userAgent}</li>
          <li><strong>Platform:</strong> ${platform}</li>
          <li><strong>Language:</strong> ${language}</li>
        </ul>
        
        ${aiAnalysis}
      </div>
    `,
  };

  try {
    await brevo.sendTransacEmail(payload);
    res.json({ success: true, message: "Error report sent successfully" });
  } catch (err) {
    console.error("Failed to send error report:", err);
    res.status(500);
    throw new Error("Failed to send error report", { cause: err });
  }
});
