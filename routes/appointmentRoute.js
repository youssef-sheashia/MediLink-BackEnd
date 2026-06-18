import express from "express";
import authnticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { appointmentQuerySchema } from "../utils/validators.js";
import { validateQuery } from "../middlewares/validate.js";
import { getMyAppointments,getPatientForDoctor,getBookedAppointmentsForPatient ,getAllAppointments} from "../controllers/appointmentController.js";
const router = express.Router();

router.use(authnticate);
router.get("/",restrictTo("admin"),getAllAppointments);
router.get("/my-appointments", restrictTo("doctor"), validateQuery(appointmentQuerySchema), getMyAppointments);
router.get('/getPatientsForDoctor',restrictTo('doctor'),getPatientForDoctor);

// get all booked appoinments for patient
router.get('/bookedAppointmentsForPatient',restrictTo("patient"),getBookedAppointmentsForPatient);
export default router;
