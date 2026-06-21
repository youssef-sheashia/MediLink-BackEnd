import {
  signUp,
  verifyOTP,
  login,
  forgetpassword,
  verifyForgetPassword,
  resetPassword,
  restrictTo,
  updatePassword,
} from "../controllers/authController.js";
import { validate,validateIdParams } from "../middlewares/validate.js";
import authenticate from "../middlewares/authenticate.js";
import {
  signUpSchema,
  verifyOTP_Schema,
  loginSchema,
  forgetSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "../validationSchema/auth.validation.js";
import {
  getAllUsers,
  getOneUser,
  changeUserActive,
  getMyProfile,
  updateMe,
  uploadSingleToImageKit,
} from "../controllers/userController.js";
import { uploadSingleImage } from "../middlewares/multer.js";
/////////////////
import express from "express";
const userRouter = express.Router();
// Auth
userRouter.post("/signup", validate(signUpSchema), signUp);
userRouter.post("/verifyOTP", validate(verifyOTP_Schema), verifyOTP);
userRouter.post("/login", validate(loginSchema), login);
userRouter.post("/forgetPassword", validate(forgetSchema),forgetpassword);
userRouter.post("/verifyPasswordOTP",validate(verifyOTP_Schema), verifyForgetPassword);
userRouter.patch("/resetPassword", validate(resetPasswordSchema),resetPassword);
// Users
userRouter.use(authenticate);
userRouter.get("/me", getMyProfile);
userRouter.patch(
  "/updateMe",
  uploadSingleImage("photo"),
  uploadSingleToImageKit("users"),
  updateMe,
);
userRouter.patch(
  "/updatePassword",
  validate(updatePasswordSchema),
  updatePassword,
);

////////////////////////////////////////////////
userRouter.use(restrictTo("admin"));
userRouter.get("/", getAllUsers);
userRouter.patch("/:id", validateIdParams,changeUserActive);

export default userRouter;
