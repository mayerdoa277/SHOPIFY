import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const TEMP_DIR = path.join(process.cwd(), "temp");

/**
 * Ensure temp directory exists
 */
export const ensureTempDir = async () => {
    try {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
        console.error("Temp directory creation failed:", error);
        throw new Error("Server storage initialization failed");
    }
};

/**
 * Generate unique file name
 * @param {string} prefix - File prefix (e.g., "music-image")
 * @param {string} originalName - Original file name
 * @returns {string} - Generated file name
 */
export const generateFileName = (prefix, originalName) => {
    const ext = path.extname(originalName);
    const uniqueId = crypto.randomBytes(8).toString("hex");
    return `${prefix}-${Date.now()}-${uniqueId}${ext}`;
};

/**
 * Save file to temp directory
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - File name
 * @returns {string} - File path
 */
export const saveTempFile = async (buffer, fileName) => {
    const filePath = path.join(TEMP_DIR, fileName);
    await fs.writeFile(filePath, buffer);
    return filePath;
};

/**
 * Delete temp file
 * @param {string} filePath - File path to delete
 */
export const deleteTempFile = async (filePath) => {
    try {
        if (filePath && typeof filePath === "string") {
            await fs.unlink(filePath);
        }
    } catch (err) {
        console.warn("Temp file delete failed:", err.message);
    }
};

export default { ensureTempDir, generateFileName, saveTempFile, deleteTempFile };
