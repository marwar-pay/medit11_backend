import UserModel from "../models/user.model.js";
import APIResponse from "../utilities/APIResponse.js";
import HttpError from "../utilities/CustomError.js";

class UserController {
    async createUSer(req, res) {
        try {
            const { email, mobile } = req.body;
            const existingUser = await UserModel.findOne({ $or: [{ email }, { mobile }] });
            if (existingUser) {
                throw new HttpError(409, "User already exists with this email or mobile");
            }
            const user = new UserModel(req.body);
            const data = (await user.save()).toObject();

            delete data.password
            delete data.__v
            delete data.createdAt
            delete data.updatedAt
            delete data._id

            return res.status(201).json(new APIResponse(201, "User created successfully", data));
        } catch (error) {
            console.error("Error creating user:", error);
            if (error instanceof HttpError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            res.status(500).json({ message: "User creation failed" });
        }
    }

    async loginUser(req, res) {
        try {
            const { id, password } = req.body;
            const user = await UserModel.findOne({ $or: [{ email: id }, { mobile: id }] });
            if (!user) {
                return res.status(401).json(new APIResponse(401, "Username/Email or password is invalid"));
            }
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json(new APIResponse(401, "Username/Email or password is invalid"));
            }
            const token = user.generateAuthToken();

            const data = user.toObject();
            delete data.password
            delete data.__v
            delete data.createdAt
            delete data.updatedAt
            delete data._id
            data.token = token;

            return res.status(200).json(new APIResponse(200, "User logged in successfully", data))
        } catch (error) {
            console.error("Error logging in user:", error);
            if (error instanceof HttpError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            res.status(500).json({ message: "User login failed" });
        }
    }
}

export default new UserController();