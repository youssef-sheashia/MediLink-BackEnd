import { signUp, verifyOTP ,login} from "../controllers/authController.js";
import {validate} from "../middlewares/validate.js";
import { signUpSchema,loginSchema,verifyOTP_Schema } from "../utils/validators.js";

import express from "express";
const userRouter = express.Router();
userRouter.post("/signup",validate(signUpSchema), signUp);
userRouter.post("/verifyOTP",validate(verifyOTP_Schema), verifyOTP);
userRouter.post("/login",validate(loginSchema),login);
export default userRouter;
