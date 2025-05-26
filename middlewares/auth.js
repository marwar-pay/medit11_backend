import APIResponse from "../utilities/APIResponse";
import HttpError from "../utilities/CustomError";

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization
            ? req.headers.authorization.split(" ")[1]
            : null;

        if (!token) {
            return new HttpError(401, "Authorization token is missing");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        const user = await UserModel.findById(decodedToken.id).select("-password -__v -createdAt -updatedAt -_id");
        if (!user) {
            return new APIResponse(404, "User not found");
        }

        req.user = user;
        next();

    } catch (error) {
        console.error("Error validating user:", error);
        if (error.name === "JsonWebTokenError") {
            return new HttpError(401, "Invalid token");
        } else if (error.name === "TokenExpiredError") {
            return new HttpError(401, "Token has expired");
        } else if (error instanceof HttpError) {
            throw error;
        }
        return new HttpError(500, "User validation failed");
    }
}

export default auth;