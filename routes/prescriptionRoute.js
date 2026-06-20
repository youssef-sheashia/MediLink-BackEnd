import express from "express";
import { validate } from "../middlewares/validate.js";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { createPrescriptionSchema } from "../validationSchema/prescription.ValidationSchema.js";
import {
  createPrescription,
  getPrescriptionsByPatient,
} from "../controllers/prescriptionController.js";

const router = express.Router();
router.use(authenticate);
router.post("/", restrictTo("doctor"),validate(createPrescriptionSchema), createPrescription);
router.get("/:patientId", restrictTo("doctor","patient"),getPrescriptionsByPatient);

export default router;
