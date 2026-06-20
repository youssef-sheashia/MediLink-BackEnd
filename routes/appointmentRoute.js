import express from "express";
import authnticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { appointmentQuerySchema,bookAppointmentSchema,bookAppointmentSchemaByRecption } from "../utils/validators.js";
import { validate, validateQuery } from "../middlewares/validate.js";
import { getMyAppointments,getPatientForDoctor,getBookedAppointmentsForPatient ,getAllAppointments,bookAppointmentByPatient,bookAppointmentByReceptionist} from "../controllers/appointmentController.js";
const router = express.Router();

router.use(authnticate);
// for admin and recp get all appoinments
router.get("/",restrictTo("admin","receptionist"),getAllAppointments);
// for patient and recp book / add appointment
router.post("/bookByPatient",restrictTo("patient"),validate(bookAppointmentSchema),bookAppointmentByPatient);
router.post("/bookByReceptionist",restrictTo("receptionist"),validate(bookAppointmentSchemaByRecption),bookAppointmentByReceptionist);
// for doctor get his appointments and his patients
router.get("/my-appointments", restrictTo("doctor"),validateQuery(appointmentQuerySchema), getMyAppointments);
router.get('/getPatientsForDoctor',restrictTo('doctor'),getPatientForDoctor);

// for patient get all booked appoinments 
router.get('/bookedAppointmentsForPatient',restrictTo("patient"),getBookedAppointmentsForPatient);
export default router;
