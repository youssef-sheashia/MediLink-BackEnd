import express from "express";
import { createMedicalReportSchema } from "../validationSchema/medicalReport.ValidationShema.js";
import { validate } from "../middlewares/validate.js";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import {
  getMedicalReportsForPatient,
  createMedicalReport,
} from "../controllers/medicalReportController.js";

const router = express.Router();
router.use(authenticate);

router.get("/:patientId",restrictTo("doctor","patient"),getMedicalReportsForPatient);
router.post("/", restrictTo("doctor"),validate(createMedicalReportSchema), createMedicalReport);

export default router;
