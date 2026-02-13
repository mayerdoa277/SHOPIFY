import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import app from "./src/app.js";
import connectDB from './src/db/db.js';
import uploadWorker from './src/workers/upload.worker.js';

connectDB();

// Start the upload worker to process background jobs
console.log('Starting upload worker...');
uploadWorker.on('ready', () => {
    console.log('Upload worker is ready and listening for jobs');
});

uploadWorker.on('error', (error) => {
    console.error('Upload worker error:', error);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});