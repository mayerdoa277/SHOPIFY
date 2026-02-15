import fs from "fs/promises"; // Import the promise-based Node filesystem module for async file operations.
import path from "path"; // Import path utilities to safely build OS-specific file paths.
import crypto from "crypto"; // Import crypto to generate random bytes for unique filenames.

const TEMP_DIR = path.join(process.cwd(), "temp"); // Define the absolute path to a "temp" folder under the app's current working directory.

/**
 * Ensure temp directory exists
 */
export const ensureTempDir = async () => { // Export an async function that guarantees the temp directory exists.
    try {
        await fs.mkdir(TEMP_DIR, { recursive: true }); // Create the temp directory if it does not exist; "recursive" allows nested dirs.
    } catch (error) {
        console.error("Temp directory creation failed:", error); // Log any error encountered while creating the directory.
        throw new Error("Server storage initialization failed"); // Throw a generic error upwards, indicating server-side storage issues.
    }
};

/**
 * Generate unique file name
 * @param {string} prefix - File prefix (e.g., "music-image")
 * @param {string} originalName - Original file name
 * @returns {string} - Generated file name
 */
export const generateFileName = (prefix, originalName) => { // Export a function to build a unique filename from a prefix and original name.
    const ext = path.extname(originalName); // Extract the extension (e.g., ".jpg" or ".mp3") from the original filename.
    const uniqueId = crypto.randomBytes(8).toString("hex"); // Generate a random 8-byte hex string to help avoid filename collisions.
    return `${prefix}-${Date.now()}-${uniqueId}${ext}`; // Combine prefix, current timestamp, random ID, and extension into a single filename.
};

/**
 * Save file to temp directory
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - File name
 * @returns {string} - File path
 */
export const saveTempFile = async (buffer, fileName) => { // Export an async function that writes a buffer as a file into the temp directory.
    const filePath = path.join(TEMP_DIR, fileName); // Build the absolute path for the new file in the temp directory.
    await fs.writeFile(filePath, buffer); // Write the binary buffer to disk at the generated temp path.
    return filePath; // Return the path so callers know where the file is stored.
};

/**
 * Delete temp file
 * @param {string} filePath - File path to delete
 */
export const deleteTempFile = async (filePath) => { // Export an async function to remove a temporary file from disk.
    try {
        if (filePath && typeof filePath === "string") { // Guard against invalid or empty filePath values.
            await fs.unlink(filePath); // Attempt to delete the file from the filesystem.
        }
    } catch (err) {
        console.warn("Temp file delete failed:", err.message); // Log a warning if the delete fails, but do not throw so uploads can still succeed.
    }
};
