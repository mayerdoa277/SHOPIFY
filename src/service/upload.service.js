import imagekit from "../config/imagekit.config.js";
import { ensureTempDir, generateFileName, saveTempFile } from "../utils/file.utils.js";
import { scanFile } from "../utils/virus-scan.utils.js";

/**
 * Upload file to ImageKit with virus scanning and temp backup
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
    if (!buffer) throw new Error("File buffer missing");

    console.log("[uploadToImageKit] Start", {
        originalName,
        folder,
        prefix,
    });

    await ensureTempDir();
    console.log("[uploadToImageKit] Temp directory ensured");

    const fileName = generateFileName(prefix, originalName);
    console.log("[uploadToImageKit] Generated file name:", fileName);

    try {
        // Save to temp first
        const tempPath = await saveTempFile(buffer, fileName);
        console.log("[uploadToImageKit] Temp file saved at:", tempPath);

        // Scan for viruses
        console.log("[uploadToImageKit] Scanning file for viruses...");
        await scanFile(tempPath);
        console.log("[uploadToImageKit] Virus scan completed");

        // Upload to ImageKit
        console.log("[uploadToImageKit] Uploading to ImageKit...");
        const uploadResponse = await imagekit.files.upload({
            file: buffer,
            fileName,
            folder,
        });
        console.log("[uploadToImageKit] Upload to ImageKit success", {
            fileId: uploadResponse.fileId,
            url: uploadResponse.url,
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
