import jwt from "jsonwebtoken"; // Import the jsonwebtoken library used to verify and decode JWT access tokens.

// Middleware that allows users with role "user" or "admin" to access certain routes.
const userAuth = (req, res, next) => { // Express middleware signature: receives request, response, and next callback.
    try { // Wrap logic in try/catch to handle missing/invalid tokens gracefully.
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Look for the JWT either in cookies or in the Authorization header.
        if (!token) { // If no token is present, immediately block access.
            return res
                .status(401) // HTTP 401 Unauthorized.
                .json({
                    success: false, // Indicate that the authentication check failed.
                    message: "Unauthorized", // Generic message for unauthorized access.
                });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the token using the application's secret key.

        if (decoded.role !== "user" && decoded.role !== "admin") { // Allow both "user" and "admin" roles.
            return res
                .status(401) // Still treat this as unauthorized.
                .json({
                    success: false, // Indicate that role-based authorization failed.
                    message: "Unauthorized", // Same generic message for consistency.
                });
        }

        req.user = decoded; // Attach the decoded token payload (including id and role) to req.user for downstream handlers.
        next(); // Call next() to pass control to the next middleware or route handler.
    } catch (error) { // Handle any errors thrown during token verification or decoding.
        return res
            .status(401) // Respond with unauthorized when token verification fails.
            .json({
                success: false, // Indicate that the authorization was not successful.
                message: "Unauthorized", // Generic message for failed auth.
            });
    }
};

// Middleware that allows users with role "artist" or "admin" to access certain routes.
const artistAuth = (req, res, next) => { // Similar structure to userAuth but checks for "artist" role.
    try { // Wrap in try/catch to handle missing or invalid tokens.
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Extract token from cookies or Authorization header.
        if (!token) { // If no token is present, block access.
            return res
                .status(401) // HTTP 401 Unauthorized.
                .json({
                    success: false, // Indicate that the authentication check failed.
                    message: "Unauthorized", // Generic message for unauthorized access.
                });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the JWT using the configured secret.
        if (decoded.role !== "artist" && decoded.role !== "admin") { // Allow both "artist" and "admin" roles.
            return res
                .status(401) // Unauthorized for users without artist role.
                .json({
                    success: false, // Indicate role-based authorization failed.
                    message: "Unauthorized", // Generic unauthorized message.
                });
        }

        req.user = decoded; // Attach the decoded token payload (including id and role) to req.user for downstream handlers.
        next(); // Call next() to allow the request to proceed to the next middleware or route handler.
    } catch (error) { // Catch errors thrown during token verification or decoding.
        return res
            .status(401) // Respond with unauthorized when token verification fails.
            .json({
                success: false, // Indicate that the authorization was not successful.
                message: "Unauthorized", // Generic message for failed auth.
            });
    }
};

// Middleware that allows any authenticated user (user, artist, or admin) to access certain routes.
const authenticateUser = (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized",
                });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res
            .status(401)
            .json({
                success: false,
                message: "Unauthorized",
            });
    }
};

// Export all middleware functions so routes can protect endpoints for different user roles.
export { userAuth, artistAuth, authenticateUser };