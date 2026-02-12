import NodeClam from "clamscan"; // Import the NodeClam wrapper library that talks to the ClamAV antivirus engine.

let clamscan = null; // Hold a reference to the initialized ClamAV scanner instance; starts as null before initialization.

/**
 * Initialize clamscan
 */
export const initClamscan = async () => { // Export an async function responsible for creating and configuring the ClamAV scanner.
    try {
        clamscan = await new NodeClam().init(); // Construct a new NodeClam instance and run its async init to connect to ClamAV.
        console.log("ClamAV scanner initialized"); // Log success so we know virus scanning is active.
    } catch (error) {
        console.warn("ClamAV initialization failed:", error.message); // If initialization fails, log a warning but do not crash the app.
    }
};

/**
 * Scan file for viruses
 * @param {string} filePath - Path to file to scan
 * @returns {boolean} - True if file is safe
 */
export const scanFile = async (filePath) => { // Export an async helper that scans a single file by path.
    if (!clamscan) { // If initClamscan was never called or initialization failed, clamscan will still be null.
        console.warn("ClamAV not initialized, skipping scan"); // Warn that no antivirus scanning is being performed.
        return true; // Treat the file as safe so uploads continue, even though no real scan was done.
    }

    try {
        const { isInfected } = await clamscan.scanFile(filePath); // Ask ClamAV to scan the file; destructure the infection flag.
        if (isInfected) { // If the scanner reports the file is infected, reject it.
            throw new Error("File contains virus or malware"); // Throw an error so callers can abort processing for this file.
        }
        return true; // If the file is not infected, return true to indicate it is safe.
    } catch (error) {
        console.error("File scan error:", error.message); // Log any error that occurred during scanning for debugging.
        throw error; // Re-throw the error so calling code (e.g., upload service) can decide how to handle it.
    }
};
