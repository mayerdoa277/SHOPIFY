import NodeClam from "clamscan";

let clamscan = null;

/**
 * Initialize clamscan
 */
export const initClamscan = async () => {
    try {
        clamscan = await new NodeClam().init();
        console.log("ClamAV scanner initialized");
    } catch (error) {
        console.warn("ClamAV initialization failed:", error.message);
    }
};

/**
 * Scan file for viruses
 * @param {string} filePath - Path to file to scan
 * @returns {boolean} - True if file is safe
 */
export const scanFile = async (filePath) => {
    if (!clamscan) {
        console.warn("ClamAV not initialized, skipping scan");
        return true;
    }

    try {
        const { isInfected } = await clamscan.scanFile(filePath);
        if (isInfected) {
            throw new Error("File contains virus or malware");
        }
        return true;
    } catch (error) {
        console.error("File scan error:", error.message);
        throw error;
    }
};

export default { initClamscan, scanFile };
