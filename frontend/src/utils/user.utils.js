/**
 * Utility functions for extracting user information from authenticated requests
 */

/**
 * Extract user ID from request object (supports different JWT token formats)
 * @param {Object} req - Express request object with authenticated user
 * @returns {string} - User ID as string
 * @throws {Error} - If no valid user ID found
 */
export const getUserId = (req) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const userId = req.user._id || req.user.id || req.user.userId;
    
    if (!userId) {
        throw new Error("User ID not found in token");
    }

    return userId.toString();
};

/**
 * Extract user role from request object
 * @param {Object} req - Express request object with authenticated user
 * @returns {string} - User role
 * @throws {Error} - If no valid user role found
 */
export const getUserRole = (req) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    if (!req.user.role) {
        throw new Error("User role not found in token");
    }

    return req.user.role;
};

/**
 * Extract user information (ID and role) from request object
 * @param {Object} req - Express request object with authenticated user
 * @returns {Object} - Object containing userId and userRole
 */
export const getUserInfo = (req) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    return { userId, userRole };
};
