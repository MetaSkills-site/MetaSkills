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
