import express from "express";
import { validate } from "../middlewares/validate.js";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { createPrescriptionSchema } from "../validationSchema/prescription.validation.js";
import {
  createPrescription,
  getPrescriptionsByPatient,
  getMyPrescriptions,
} from "../controllers/prescriptionController.js";

const router = express.Router();
router.get(
  "/my-prescriptions",
  authenticate,
  restrictTo("patient"),
  getMyPrescriptions,
);
router.use(authenticate, restrictTo("doctor"));
router.post("/", validate(createPrescriptionSchema), createPrescription);
router.get("/:patientId", getPrescriptionsByPatient);

export default router;
