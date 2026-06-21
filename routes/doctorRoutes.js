import express from "express";
import {
  createDoctor,
  getAllDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  getAvailableSlots,
} from "../controllers/doctorController.js";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { createDoctorSchema, updateDoctorSchema } from "../utils/validators.js";
const doctorRouter = express.Router();

doctorRouter.get("/", getAllDoctors);
doctorRouter.get("/:id", getDoctor);

//////////////////////////////////
doctorRouter.use(authenticate);

doctorRouter.post(
  "/",
  restrictTo("admin"),
  validate(createDoctorSchema),
  createDoctor,
);
doctorRouter.patch("/:id", restrictTo("admin"), updateDoctor);
doctorRouter.delete("/:id", restrictTo("admin"), deleteDoctor);
doctorRouter.get(
  "/:id/available-slots",
  restrictTo("patient receptionist"),
  getAvailableSlots,
);
export default doctorRouter;
