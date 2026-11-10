/**
 * @file dbErrorHandler.js
 * @description Parses MongoDB and Mongoose errors into user-friendly messages.
 * @architecture Helper utility consumed by controllers to standardize database error responses.
 */
/**
 * @desc    Extracts a readable error message from a database error object
 * @param   {Object} error - The database error object
 * @returns {string} The parsed error message
 */
export default function getErrorMessage(error) {
  let message;
  if (error.code) {
    const code = error.code;
    if (code === 11000 || code === 11001) {
      message = getUniqueErrorMessage(error);
    } else {
      message = "Somethign went wrong";
    }
  } else {
    // if it has multiple validation errors (e.g., both username is too short and email is invalid), this loop will only assign the message of the last error
    for (let errName in error.errors) {
      if (error.errors[errName].message) {
        message = error.errors[errName].message;
      }
    }
  }
  return message;
}

/**
 * @desc    Extracts the field name from a unique constraint violation error
 * @param   {Object} error - The database error object
 * @returns {string} The formatted unique constraint error message
 */
function getUniqueErrorMessage(error) {
  let output;
  try {
    let fieldName = error.message.substring(
      error.message.lastIndexOf(".$") + 2,
      error.message.lastIndexOf("_1"),
    );
    output =
      fieldName.charAt(0).toUpperCase() +
      fieldName.slice(1) +
      " already exists";
  } catch (err) {
    console.error(err);
    output = "Unique field already exists";
  }
  return output;
}
