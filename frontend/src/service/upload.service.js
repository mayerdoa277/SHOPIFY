import { toFile } from "@imagekit/nodejs"; // Import helper that wraps a Buffer so it can be used with ImageKit's upload API.
import imagekit from "../config/imagekit.config.js"; // Import the preconfigured ImageKit client that knows how to talk to ImageKit's API.
import { ensureTempDir, generateFileName, saveTempFile } from "../utils/file.utils.js"; // Import utilities for managing a temp directory and temporary files.
import { scanFile, initClamscan } from "../utils/virus-scan.utils.js"; // Import a function that uses ClamAV to scan files for viruses.

initClamscan(); // Initialize the ClamAV scanner before any file uploads.



/**
 * Upload file to ImageKit with virus scanning and temp backup
 * ImageKit requires file as ReadStream, File, or toFile(Buffer) - raw Buffer is not accepted.
 * @param {object} params - Upload parameters
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.originalName - Original file name
 * @param {string} params.folder - ImageKit folder path
 * @param {string} params.prefix - File name prefix
 * @returns {object} - Upload result with ImageKit URL and temp path
 */
export const uploadToImageKit = async ({
    buffer, // Raw file content in memory that should be uploaded.
    originalName, // Original name of the uploaded file (used to help generate a unique filename).
    folder, // Target folder path in ImageKit where the file should be stored.
    prefix, // Prefix used when generating a unique filename (e.g., "music-image" or "music").
}) => {
    if (!buffer || !Buffer.isBuffer(buffer)) throw new Error("File buffer missing or invalid"); // Validate that we actually received a valid Buffer to upload.

    await ensureTempDir(); // Make sure the temp directory exists before we try to write a file into it.

    const fileName = generateFileName(prefix, originalName); // Build a unique filename using a prefix, timestamp, and random ID.

    try {
        // Save to temp first so we have a physical file on disk for scanning and disaster recovery.
        const tempPath = await saveTempFile(buffer, fileName); // Write the buffer to disk in the temp directory and capture its path.
        console.log(`✅ Temp file saved: ${tempPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`); // Log where the temp file is and its size in MB.

        // Scan for viruses using ClamAV; throws if the file is infected.
        await scanFile(tempPath); // Protect the system and ImageKit from malicious content by scanning the temp file.
        console.log(`✅ Virus scan passed: ${tempPath}`); // Log that the virus scan passed.

        console.log("✅ Uploading to ImageKit"); // Log that the upload is starting.

        // ImageKit expects ReadStream, File, or toFile(Buffer) - not raw Buffer
        const fileForUpload = await toFile(buffer, fileName); // Convert the Buffer into a File-like object compatible with ImageKit's SDK.

        // Upload to ImageKit
        const uploadResponse = await imagekit.files.upload({
            file: fileForUpload, // File-like object created from the buffer.
            fileName, // Unique filename that will be stored in ImageKit.
            folder, // Destination folder in ImageKit's storage.
        }); // Perform the actual upload and await ImageKit's response.

        return {
            ...uploadResponse, // Spread the original upload response fields (e.g., url, size, etc.).
            tempPath, // Include the temp file path so callers can later delete it.
        }; // Return both ImageKit data and temp file information to the caller.
    } catch (error) { // If anything fails (writing file, scanning, or uploading), handle the error here.
        console.error("Upload failed:", error); // Log the full error details for debugging on the server.
        throw new Error(`File upload failed: ${error.message}`); // Re-throw a simplified error message for upstream handlers.
    }
};

/**
 * Upload music image
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original file name
 * @returns {object} - Upload result
 */
export const uploadMusicImage = (buffer, originalName) => // Convenience wrapper for uploading a cover image to a dedicated folder.
    uploadToImageKit({
        buffer, // Pass the raw image buffer through to the generic upload helper.
        originalName, // Pass the original filename for naming and logs.
        folder: "/music-images", // Store music images under the /music-images folder in ImageKit.
        prefix: "music-image", // Use a "music-image" prefix when generating the unique filename.
    });

/**
 * Upload music file
 * @param {Buffer} buffer - Music buffer
 * @param {string} originalName - Original file name
 * @returns {object} - Upload result
 */
export const uploadMusicFile = (buffer, originalName) => // Convenience wrapper for uploading the audio file to its own folder.
    uploadToImageKit({
        buffer, // Pass the raw music buffer through to the generic upload helper.
        originalName, // Pass the original filename to help build a unique name.
        folder: "/music-files", // Store music audio files under the /music-files folder in ImageKit.
        prefix: "music", // Use a "music" prefix when generating the unique filename.
    });
