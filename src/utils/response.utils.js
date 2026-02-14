/**
 * Standardized error response utility for consistent API responses
 */

/**
 * Create a standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details (optional)
 */
export const sendErrorResponse = (res, statusCode, message, details = null) => {
    const errorResponse = {
        success: false,
        message,
    };

    if (details) {
        errorResponse.details = details;
    }

    return res.status(statusCode).json(errorResponse);
};

/**
 * Create a standardized success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data (optional)
 */
export const sendSuccessResponse = (res, statusCode, message, data = null) => {
    const successResponse = {
        success: true,
        message,
    };

    if (data !== null) {
        successResponse.data = data;
    }

    return res.status(statusCode).json(successResponse);
};

/**
 * Handle common server errors with appropriate status codes
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
export const handleError = (res, error, context = "Server operation") => {
    console.error(`Error in ${context}:`, error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
        const message = Object.values(error.errors).map(err => err.message).join(', ');
        return sendErrorResponse(res, 400, "Validation failed", { validationErrors: message });
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return sendErrorResponse(res, 409, `${field} already exists`);
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return sendErrorResponse(res, 401, "Invalid token");
    }

    if (error.name === 'TokenExpiredError') {
        return sendErrorResponse(res, 401, "Token expired");
    }

    // Default server error
    return sendErrorResponse(res, 500, "Internal server error");
};
