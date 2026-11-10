/**
 * @file genToken.js
 * @description Generates JSON Web Tokens (JWT) for authentication.
 * @architecture Used by auth controllers to issue tokens during login or registration.
 */
import jwt from "jsonwebtoken";

/**
 * @desc    Generates a JWT token for a given payload.
 * @param   {Object} payload - The data to embed in the token.
 * @returns {string} The generated JWT token.
 */
export default function generateToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in .env or process.env");
  }
  const token = jwt.sign(payload, secret, {
    expiresIn: "30d",
    algorithm: "HS256",
  });
  return token;
}
