import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
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

        if (decoded.role !== "user") {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized",
                });
        }

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

const artistAuth = (req, res, next) => {
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
        if (decoded.role !== "artist") {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized",
                });
        }
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

export { userAuth, artistAuth };