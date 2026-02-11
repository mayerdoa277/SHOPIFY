import { toFile } from "@imagekit/nodejs";
import imagekit from "../config/imagekit.config.js";
import { ensureTempDir, generateFileName, saveTempFile } from "../utils/file.utils.js";
import { scanFile } from "../utils/virus-scan.utils.js";

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
    buffer,
    originalName,
    folder,
    prefix,
}) => {
    if (!buffer || !Buffer.isBuffer(buffer)) throw new Error("File buffer missing or invalid");

    await ensureTempDir();

    const fileName = generateFileName(prefix, originalName);

    try {
        // Save to temp first
        const tempPath = await saveTempFile(buffer, fileName);
        console.log(`✅ Temp file saved: ${tempPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

        // Scan for viruses
        await scanFile(tempPath);

        // ImageKit expects ReadStream, File, or toFile(Buffer) - not raw Buffer
        const fileForUpload = await toFile(buffer, fileName);

        // Upload to ImageKit
        const uploadResponse = await imagekit.files.upload({
            file: fileForUpload,
            fileName,
            folder,
        });

        return {
            ...uploadResponse,
            tempPath,
        };
    } catch (error) {
        console.error("Upload failed:", error);
        throw new Error(`File upload failed: ${error.message}`);
    }
};

/**
 * Upload music image
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original file name
 * @returns {object} - Upload result
 */
export const uploadMusicImage = (buffer, originalName) =>
    uploadToImageKit({
        buffer,
        originalName,
        folder: "/music-images",
        prefix: "music-image",
    });

/**
 * Upload music file
 * @param {Buffer} buffer - Music buffer
 * @param {string} originalName - Original file name
 * @returns {object} - Upload result
 */
export const uploadMusicFile = (buffer, originalName) =>
    uploadToImageKit({
        buffer,
        originalName,
        folder: "/music-files",
        prefix: "music",
    });
