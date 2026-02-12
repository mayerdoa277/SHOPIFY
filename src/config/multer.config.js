import multer from "multer"; // Import Multer, a middleware for handling multipart/form-data (file uploads) in Express.

// Define the list of image MIME types that are allowed to be uploaded.
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]; // Only JPEG, PNG, and WebP images can be accepted.
// Define the list of music/audio MIME types that are allowed to be uploaded.
const allowedMusicTypes = ["audio/mpeg", "audio/wav", "audio/mp3"]; // Accept common audio MIME types such as MP3 and WAV.

// Configure Multer to store uploaded files in memory as Buffer objects instead of writing directly to disk.
const storage = multer.memoryStorage(); // This is suitable because we later write the buffer to our own temp directory.

// Custom file filter function to validate each uploaded file's MIME type before accepting it.
const fileFilter = (_, file, cb) => { // Multer calls this for every file; cb is the callback to accept or reject the file.
    if ( // Check if the file's MIME type is in one of the allowed lists.
        allowedImageTypes.includes(file.mimetype) || // Accept if it is a known image type.
        allowedMusicTypes.includes(file.mimetype) // Or accept if it is a known music type.
    ) {
        cb(null, true); // Indicate acceptance: no error (null) and "true" to accept the file.
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`), false); // Reject the file with an error if the MIME type is not allowed.
    }
};

// Create the Multer instance with the above storage and filter settings plus size limits.
export const upload = multer({
    storage, // Use in-memory storage so files are kept as Buffers on req.files.
    fileFilter, // Use the custom filter to allow only certain MIME types.
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for flexibility // Set a maximum allowed file size of 50 megabytes.
    },
});

// Export the same Multer instance as the default export for convenience imports.
export default upload;
