import NodeClam from "clamscan"; // Import the NodeClam wrapper library that talks to the ClamAV antivirus engine.
import { existsSync } from "fs"; // Import file system check

let clamscan = null; // Hold a reference to the initialized ClamAV scanner instance; starts as null before initialization.

/**
 * Get ClamAV path based on OS and installation
 */
const getClamAVPath = () => {
    const possiblePaths = [
        'C:\\Program Files\\ClamAV\\clamscan.exe',
        'C:\\Program Files (x86)\\ClamAV\\clamscan.exe',
        'C:\\ClamAV\\clamscan.exe',
        'clamscan', // Try system PATH last (WSL clamscan)
        '/usr/bin/clamscan', // Linux/Mac
        '/usr/local/bin/clamscan', // Mac brew
    ];
    
    for (const path of possiblePaths) {
        if (path !== 'clamscan' && existsSync(path)) {
            return path;
        }
    }
    
    return 'clamscan'; // Fallback to system PATH
};

/**
 * Get ClamAV database path
 */
const getClamAVDbPath = () => {
    const possiblePaths = [
        '/var/lib/clamav', // Linux default (WSL)
        '/usr/local/var/db/clamav', // Mac brew
        'C:\\Program Files\\ClamAV\\database',
        'C:\\Program Files (x86)\\ClamAV\\database',
        'C:\\ClamAV\\database'
    ];
    
    for (const path of possiblePaths) {
        if (existsSync(path)) {
            return path;
        }
    }
    
    return null; // Let ClamAV use default
};

/**
 * Initialize clamscan
 */
export const initClamscan = async () => { // Export an async function responsible for creating and configuring the ClamAV scanner.
    try {
        const clamAVPath = getClamAVPath();
        const clamAVDbPath = getClamAVDbPath();
        
        console.log(`🔍 Trying ClamAV path: ${clamAVPath}`);
        if (clamAVDbPath) {
            console.log(`📁 Using database path: ${clamAVDbPath}`);
        }
        
        clamscan = await new NodeClam().init({
            removeInfected: false, // Don't remove infected files, just report them
            quarantineInfected: false, // Don't quarantine, just report
            scanLog: null, // Don't write to log file
            debugMode: false, // Disable debug mode
            clamscan: {
                path: clamAVPath, // Dynamic path detection (Windows clamscan.exe)
                db: clamAVDbPath, // Dynamic database path
                scanArchives: true, // Enable archive scanning
                active: true // Enable scanning
            },
            clamdscan: {
                socket: false, // Disable socket for Windows
                host: false, // Disable host for Windows
                port: false, // Disable port for Windows
                timeout: 60000, // 60 second timeout
                localFallback: true, // Fall back to local clamscan if daemon fails
                active: false // Disable clamdscan for Windows - use clamscan only
            }
        });
        console.log("✅ ClamAV scanner initialized and ready for virus scanning"); // Log success so we know virus scanning is active.
    } catch (error) {
        console.warn("⚠️ ClamAV not available - virus scanning disabled:", error.message); // If initialization fails, log a warning but do not crash the app.
        console.info("💡 To enable virus scanning:");
        console.info("   - Windows: Ensure ClamAV is installed at C:\\Program Files\\ClamAV");
        console.info("   - Update database: Run 'freshclam.exe' from ClamAV directory");
    }
};

/**
 * Scan file for viruses
 * @param {string} filePath - Path to file to scan
 * @returns {boolean} - True if file is safe
 */
export const scanFile = async (filePath) => { // Export an async helper that scans a single file by path.
    if (!clamscan) { // If initClamscan was never called or initialization failed, clamscan will still be null.
        console.log("🔍 Virus scanning skipped - ClamAV not available"); // Warn that no antivirus scanning is being performed.
        return true; // Treat the file as safe so uploads continue, even though no real scan was done.
    }

    try {
        console.log(`🔍 Scanning file for viruses: ${filePath}`); // Log which file is being scanned
        const { isInfected, viruses } = await clamscan.scanFile(filePath); // Ask ClamAV to scan the file; destructure the infection flag and virus list.
        if (isInfected) { // If the scanner reports the file is infected, reject it.
            console.error(`🚨 File infected with: ${viruses.join(', ')}`); // Log which viruses were found
            throw new Error(`File contains virus: ${viruses.join(', ')}`); // Throw an error so callers can abort processing for this file.
        }
        console.log(`✅ Virus scan passed: ${filePath}`); // Log successful scan
        console.log(`🔒 Virus scan completed successfully - File is safe: ${filePath}`); // Add completion message
        return true; // If the file is not infected, return true to indicate it is safe.
    } catch (error) {
        console.error("❌ File scan error:", error.message); // Log any error that occurred during scanning for debugging.
        throw error; // Re-throw the error so calling code (e.g., upload service) can decide how to handle it.
    }
};
