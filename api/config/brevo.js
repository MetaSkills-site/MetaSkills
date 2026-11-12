/**
 * @file brevo.js
 * @description Initializes and configures the Brevo API client for sending transactional emails.
 * @architecture Provides a singleton email service instance to be consumed by the notification/email service.
 */
import Brevo from "@getbrevo/brevo";

/**
 * @constant {Object} brevo
 * @description Configured Brevo TransactionalEmailsApi instance.
 */
const brevo = new Brevo.TransactionalEmailsApi();
console.log("Initializing Brevo API...");
console.log("BREVO_API_KEY present:", !!process.env.BREVO_API_KEY);
if (!process.env.BREVO_API_KEY) {
  console.error(
    "CRITICAL: BREVO_API_KEY is missing from environment variables!",
  );
}

brevo.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY,
);

export default brevo;
