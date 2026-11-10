/**
 * @file googledriveupload.js
 * @description Provides utilities for interacting with Google Drive API.
 * @architecture Acts as a service layer for uploading, listing, and deleting backup files on Google Drive.
 */
import { google } from "googleapis";
import fs from "fs";

let driveClient;
const FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.DRIVE_FOLDER_URL;

/**
 * @desc    Initializes and returns a Google Drive API client using OAuth2.
 * @returns {Object|null} Google Drive client instance, or null if initialization fails.
 */
const getDriveClient = () => {
  // Return existing client if already initialized
  if (driveClient) return driveClient;

  try {
    // 1. Load the 3 new OAuth variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      if (process.env.NODE_ENV !== "test") {
        console.warn(
          "❌ Missing Google OAuth Env Variables (CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN).",
        );
      }
      return null;
    }

    // 2. Initialize OAuth2 Client (The "User" method)
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground", // Redirect URI
    );

    // 3. Set the "Forever Ticket"
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // 4. Create the Drive instance
    driveClient = google.drive({ version: "v3", auth: oauth2Client });
    return driveClient;
  } catch (error) {
    console.error("Failed to initialize Google OAuth:", error.message);
    return null;
  }
};

/**
 * @desc    Uploads a file to Google Drive.
 * @param   {string} fileName - Name of the file to save as.
 * @param   {string} filePath - Local path to the file to upload.
 * @param   {string} mimeType - MIME type of the file.
 * @param   {string} [folderId=FOLDER_ID] - ID of the Drive folder to upload to.
 * @returns {Promise<string>} ID of the uploaded file on Google Drive.
 */
async function uploadBackup(
  fileName,
  filePath,
  mimeType,
  folderId = FOLDER_ID,
) {
  try {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error("Drive client not initialized");
    }

    const fileMetadata = {
      name: fileName,
      // Parents must be an array
      parents: folderId ? [folderId] : [],
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata, // Note: Use 'requestBody' for v3, 'resource' is old
      media: media,
      fields: "id",
    });

    console.log(`✅ Backup Uploaded! File ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error("❌ Upload Failed:", error.message);
    throw error;
  }
}

// Export as uploadBackupToDrive to match existing controller usage
export const uploadBackupToDrive = uploadBackup;

/**
 * @desc    Lists files inside the specified Google Drive folder.
 * @param   {string} [folderId=FOLDER_ID] - ID of the Drive folder to list files from.
 * @returns {Promise<Array>} Array of file objects from Google Drive.
 */
export const listDriveFiles = async (folderId = FOLDER_ID) => {
  try {
    const drive = getDriveClient();
    if (!drive) throw new Error("Drive client not initialized");

    // According to user request:
    const response = await drive.files.list({
      // Filter: Only files inside the folder, and not in the trash
      q: `'${folderId}' in parents and trashed = false`,

      // Fields: Only get what you need (saves bandwidth)
      fields: "files(id, name, createdTime, size)",

      // Order: Newest files first
      orderBy: "createdTime desc",

      // Limit: Max files to fetch (default is 100, max is 1000)
      pageSize: 100,
    });

    return response.data.files;
  } catch (error) {
    console.error("❌ List Files Failed:", error.message);
    throw error;
  }
};

/**
 * @desc    Deletes a specific file from Google Drive.
 * @param   {string} fileId - ID of the file to delete.
 * @returns {Promise<boolean>} True if deletion was successful.
 */
export const deleteDriveFile = async (fileId) => {
  try {
    const drive = getDriveClient();
    if (!drive) throw new Error("Drive client not initialized");

    await drive.files.delete({
      fileId: fileId,
    });

    console.log(`✅ File Deleted! ID: ${fileId}`);
    return true;
  } catch (error) {
    console.error("❌ Delete File Failed:", error.message);
    throw error;
  }
};

/**
 * @desc    Deletes all files inside the specified Google Drive folder.
 * @param   {string} [folderId=FOLDER_ID] - ID of the Drive folder to empty.
 * @returns {Promise<number>} Number of files deleted.
 */
export const emptyDriveFolder = async (folderId = FOLDER_ID) => {
  try {
    // 1. List all files first
    const files = await listDriveFiles(folderId);

    if (!files || files.length === 0) {
      return 0; // Nothing to delete
    }

    console.log(`🗑️ Deleting ${files.length} files from Drive...`);

    // 2. Delete each file (sequentially to be safe, or Promise.all for speed)
    // Using Promise.all for speed since it's "empty trash" equivalent
    const deletePromises = files.map((file) => deleteDriveFile(file.id));
    await Promise.all(deletePromises);

    console.log(`✅ All ${files.length} files deleted.`);
    return files.length;
  } catch (error) {
    console.error("❌ Empty Drive Failed:", error.message);
    throw error;
  }
};

/**
 * @desc    Gets the text content of a specific file from Google Drive.
 * @param   {string} fileId - ID of the file to read.
 * @returns {Promise<string>} Text content of the file.
 */
export const getDriveFileContent = async (fileId) => {
  try {
    const drive = getDriveClient();
    if (!drive) throw new Error("Drive client not initialized");

    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      { responseType: "text" },
    );

    return response.data;
  } catch (error) {
    console.error("❌ Get File Content Failed:", error.message);
    throw error;
  }
};
