import validator from "validator";

/**
 * Base
 */
function clean(input) {
    if (typeof input !== "string") {
        throw new Error("Invalid input type");
    }

    return input.trim().replace(/\s+/g, " ");
}

/**
 * USERNAME (Industry Standard)
   - 3 to 30 chars
   - letters, numbers, underscores, hyphens
   - must start with letter
   - no consecutive special chars
 */
function sanitizeUsername(username) {
    const cleanUsername = clean(username)
        .replace(/\s+/g, "")
        .toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
        throw new Error("Username must be between 3 and 30 characters");
    }

    if (!/^[a-z]/.test(cleanUsername)) {
        throw new Error("Username must start with a letter");
    }

    if (!/^[a-z][a-z0-9_-]*$/.test(cleanUsername)) {
        throw new Error("Username can only contain letters, numbers, underscores, and hyphens");
    }

    if (/[_-]{2,}/.test(cleanUsername)) {
        throw new Error("Username cannot contain consecutive special characters");
    }

    return cleanUsername;
}

/**
 * EMAIL
 * - no spaces
 * - lowercase
 */
function sanitizeEmail(email) {
    const cleanEmail = email.trim().replace(/\s+/g, "").toLowerCase();

    if (!validator.isEmail(cleanEmail)) {
        throw new Error("Invalid email format");
    }

    // Optional: restrict domains (remove if you want all allowed)
    const allowedDomains = ["gmail.com", "outlook.com", "yahoo.com"];

    const domain = cleanEmail.split("@")[1];
    if (!allowedDomains.includes(domain)) {
        throw new Error("Email provider not supported");
    }

    return cleanEmail;
}

/**
   PASSWORD
   - 8+ chars
   - upper + lower + number + symbol
 */
function sanitizePassword(password) {
    if (typeof password !== "string") {
        throw new Error("Invalid password");
    }

    const cleanPassword = password.trim();

    if (cleanPassword.length < 6 || cleanPassword.length > 13) {
        throw new Error("Password must be between 6 and 13 characters");
    }

    if (!/[A-Z]/.test(cleanPassword)) {
        throw new Error("Password must contain uppercase letter");
    }

    if (!/[a-z]/.test(cleanPassword)) {
        throw new Error("Password must contain lowercase letter");
    }

    if (!/[0-9]/.test(cleanPassword)) {
        throw new Error("Password must contain number");
    }

    if (!/[^A-Za-z0-9]/.test(cleanPassword)) {
        throw new Error("Password must contain symbol");
    }

    return cleanPassword;
}

/**
 * ROLE (ENUM SAFE)
 */
const ALLOWED_ROLES = ["user", "artist"];

function sanitizeRole(role) {
    if (typeof role !== "string") {
        throw new Error("Invalid role");
    }

    if (role.trim() === "") {
        throw new Error("Role cannot be empty");
    }

    if (!['user', 'artist'].includes(role)) {
        return res
            .status(400)
            .json(
                {
                    success: false,
                    message: "Invalid role. Role must be either 'user' or 'artist'",
                }
            );
    }

    const cleanRole = role.trim().toLowerCase();

    if (!ALLOWED_ROLES.includes(cleanRole)) {
        throw new Error("Invalid role");
    }

    return cleanRole;
}

export {
    sanitizeUsername,
    sanitizeEmail,
    sanitizePassword,
    sanitizeRole
};