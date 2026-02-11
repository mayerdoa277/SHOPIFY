import multer from "multer";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedMusicTypes = ["audio/mpeg", "audio/wav", "audio/mp3"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (
        allowedImageTypes.includes(file.mimetype) ||
        allowedMusicTypes.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for flexibility
    },
});

export default upload;
