/**
 * @file validate.js
 * @description Form submission event utility enforcing browser-native constraint validation and error reporting.
 * @architecture Lightweight DOM helper used across form submit handlers to prevent default submission and display validation tooltips.
 * @agent_note Expects a standard React synthetic form event with currentTarget pointing to an HTMLFormElement.
 */

/**
 * FILE PURPOSE: Generic HTML5 form validation wrapper.
 * Provides a simple utility to check form validity and trigger native reporting.
 *
 * DEPENDENCIES:
 * - Native HTML5 Form Validation API
 *
 * EXPORTS:
 * - validate (default): Prevent default submission and check/report form validity.
 *
 * INTERCONNECT:
 * - Can be used by any component as a form onSubmit handler to ensure inputs meet constraints.
 */

/**
 * Prevents default event submission, checks native form validity constraints, and displays validation tooltips if invalid.
 *
 * @param {React.FormEvent<HTMLFormElement>} e - Form submission event.
 * @returns {void}
 */
export default function validate(e) {
  // Prevent the default browser form submission behavior
  e.preventDefault();

  const form = e.currentTarget;
  // Use the native checkValidity method to verify if all inputs satisfy their constraints
  if (!form.checkValidity()) {
    // If invalid, trigger the native browser tooltip to report errors to the user
    form.reportValidity();
    return;
  }
}
