import jwt from "jsonwebtoken"; // Import the jsonwebtoken library used to verify and decode JWT access tokens.

// Middleware that allows only users with role "user" to access certain routes.
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

        if (decoded.role !== "user") { // Ensure the decoded token belongs to a "user" role.
            return res
                .status(401) // Still treat this as unauthorized if role does not match.
                .json({
                    success: false, // Indicate the role-based authorization failed.
                    message: "Unauthorized", // Same generic unauthorized message (could be made more specific).
                });
        }

        req.user = decoded; // Attach the decoded token payload (including id and role) to req.user for downstream handlers.
        next(); // Call next() to allow the request to proceed to the next middleware or route handler.
    } catch (error) { // Handle any errors thrown by jwt.verify (e.g., expired token, invalid signature).
        return res
            .status(401) // Respond with unauthorized when token verification fails.
            .json({
                success: false, // Indicate that the authorization was not successful.
                message: "Unauthorized", // Generic message for failed auth.
            });
    }
};

// Middleware that allows only users with role "artist" to access certain routes (e.g., music upload).
const artistAuth = (req, res, next) => { // Similar structure to userAuth but checks for "artist" role.
    try { // Wrap in try/catch to handle missing or invalid tokens.
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Extract token from cookies or Authorization header.
        if (!token) { // If no token is present, block access.
            return res
                .status(401) // HTTP 401 Unauthorized.
                .json({
                    success: false, // Indicate failed authentication.
                    message: "Unauthorized", // Notify client they are not authorized.
                });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the JWT using the configured secret.
        if (decoded.role !== "artist") { // Check that the user's role is exactly "artist".
            return res
                .status(401) // Unauthorized for users without artist role.
                .json({
                    success: false, // Indicate role-based authorization failed.
                    message: "Unauthorized", // Generic unauthorized message.
                });
        }
        req.user = decoded; // Attach the decoded token payload (including id and role) to the request object for later use.
        next(); // Allow request to continue to the next handler in the chain.
    } catch (error) { // Catch errors thrown during token verification or decoding.
        return res
            .status(401) // Respond with HTTP 401 when verification fails.
            .json({
                success: false, // Indicate the client is not authorized.
                message: "Unauthorized", // Generic unauthorized message.
            });
    }
};

// Export both middleware functions so routes can protect endpoints for users and artists separately.
export { userAuth, artistAuth };