import express from "express";
import UserController from "../controllers/User.controller.js";
import validate from "../middlewares/validate.js";
import { createUserSchema, loginUserSchema } from "../validators/user.validators.js";

const router = express.Router();

router.route("/register").post(validate("body", createUserSchema), UserController.createUSer);

router.route("/login").post(validate("body", loginUserSchema), UserController.loginUser);

export default router;