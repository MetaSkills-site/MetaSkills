/**
 * @file encryption.js
 * @description Provides AES-256 encryption and decryption utilities.
 * @architecture Used for securing sensitive data before database persistence or token generation.
 */
import crypto from "crypto";

// Use JWT_SECRET to derive a key, or use a specific ENCRYPTION_KEY if available.
// We'll use a simple hash of JWT_SECRET to ensure 32 bytes for AES-256
/**
 * @desc    Returns the encryption algorithm to use.
 * @returns {string} The algorithm name.
 */
const getAlgorithm = () => "aes-256-cbc";

/**
 * @desc    Derives an encryption key from the JWT_SECRET.
 * @returns {Buffer} A 32-byte key buffer.
 */
const getKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return crypto.createHash("sha256").update(secret).digest(); // Returns Buffer of 32 bytes
};

/**
 * @desc    Encrypts arbitrary data using AES-256-CBC.
 * @param   {any} data - The data to encrypt (will be JSON stringified).
 * @returns {string} The IV and encrypted data encoded in hex.
 */
export const encryptData = (data) => {
  const algorithm = getAlgorithm();
  const key = getKey();
  const iv = crypto.randomBytes(16); // Initialization vector

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + EncryptedData (hex encoded)
  return iv.toString("hex") + ":" + encrypted;
};

/**
 * @desc    Decrypts an encrypted string back to its original data.
 * @param   {string} encryptedString - The IV and encrypted string separated by a colon.
 * @returns {any} The parsed original data.
 */
export const decryptData = (encryptedString) => {
  const algorithm = getAlgorithm();
  const key = getKey();

  const parts = encryptedString.split(":");
  if (parts.length !== 2) throw new Error("Invalid encrypted format");

  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
};
