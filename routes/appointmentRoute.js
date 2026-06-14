import express from "express";
import authnticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { appointmentQuerySchema } from "../utils/validators.js";
import { validateQuery } from "../middlewares/validate.js";
import { getMyAppointments } from "../controllers/appointmentController.js";
const router = express.Router();

router.use(authnticate);
router.use(restrictTo("doctor"));
router.get(
  "/appointments",
  validateQuery(appointmentQuerySchema),
  getMyAppointments,
);
export default router;
