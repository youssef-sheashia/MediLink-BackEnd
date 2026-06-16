import express from "express";
import authnticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { appointmentQuerySchema } from "../utils/validators.js";
import { validateQuery } from "../middlewares/validate.js";
import { getMyAppointments,getPatientForDoctor } from "../controllers/appointmentController.js";
const router = express.Router();

router.use(authnticate);
router.use(restrictTo("doctor"));
router.get(
  "/",
  validateQuery(appointmentQuerySchema),
  getMyAppointments,
);
router.get('/getPatientsForDoctor/:id',getPatientForDoctor)
export default router;
