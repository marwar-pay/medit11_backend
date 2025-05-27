import UserModel from "../models/user.model.js";
import APIResponse from "../utilities/APIResponse.js";
import jwt from "jsonwebtoken";

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization
            ? req.headers.authorization.split(" ")[1]
            : null;

        if (!token) {
            return res.status(401).json(new APIResponse(401, "Authorization token is missing"));
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        const user = await UserModel.findById(decodedToken.id).select("-password -__v -createdAt -updatedAt _id");
        if (!user) {
            return res.status(404).json(new APIResponse(404, "User not found"));
        }
        req.user = user;
        next();

    } catch (error) {
        console.error("Error validating user:", error);
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json(new APIResponse(401, "Invalid token"));
        } else if (error.name === "TokenExpiredError") {
            return res.status(401).json(new APIResponse(401, "Token has expired"));
        }
        return res.status(500).json(new APIResponse(500, "User validation failed"));
    }
}

export default auth;