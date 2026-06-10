import express from "express";
import {
  createDoctor,
  getAllDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  getMyProfile,
  updateMyProfile,
} from "../controllers/doctorController.js";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { createDoctorSchema, updateDoctorSchema } from "../utils/validators.js";
const doctorRouter = express.Router();

doctorRouter.get("/", getAllDoctors);
doctorRouter.get("/:id", getDoctor);

doctorRouter.get("/me", authenticate, restrictTo("doctor"), getMyProfile);
doctorRouter.patch("/me", authenticate, restrictTo("doctor"), updateMyProfile);

doctorRouter.post(
  "/",
  authenticate,
  restrictTo("admin"),
  validate(createDoctorSchema),
  createDoctor,
);
doctorRouter.patch("/:id", authenticate, restrictTo("admin"), updateDoctor);
doctorRouter.delete("/:id", authenticate, restrictTo("admin"), deleteDoctor);

export default doctorRouter;
