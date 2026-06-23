import express from "express";
import authnticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import {
  appointmentQuerySchema,
  bookAppointmentSchema,
  bookAppointmentSchemaByRecption,
  completeAppointmentSchema,
} from "../validationSchema/appointment.validation.js";
import { validate, validateQuery } from "../middlewares/validate.js";
import {
  getMyAppointments,
  getPatientForDoctor,
  getBookedAppointmentsForPatient,
  getAllAppointments,
  bookAppointmentByPatient,
  bookAppointmentByReceptionist,
  getCurrentPatientForDoctor,
  changeAppointmentStatus,
  completeAppointment,
  getAppointmentsCount,
  getDoctorQueueByDoctor,
  getDoctorQueueByRecepionist,
  cancelAppointment
} from "../controllers/appointmentController.js";
import { uploadMedicalFilesMiddleware } from "../middlewares/multer.js";
import { uploadMultipleToImageKit } from "../utils/imageKit.js";

const router = express.Router();

router.use(authnticate);

// for admin and recp get all appoinments
router.get("/", restrictTo("admin", "receptionist"), getAllAppointments);
// for patient and recp book / add appointment
router.post(
  "/bookByPatient",
  restrictTo("patient"),
  uploadMedicalFilesMiddleware,
  validate(bookAppointmentSchema),
  uploadMultipleToImageKit("appointment-medical-files"),

  bookAppointmentByPatient,
);
router.get(
  "/getAppointmentsCount/:id",
  restrictTo("admin"),
  getAppointmentsCount,
);
router.post(
  "/bookByReceptionist",
  restrictTo("receptionist"),
  validate(bookAppointmentSchemaByRecption),
  bookAppointmentByReceptionist,
);
// for doctor get his appointments and his patients
router.get(
  "/my-appointments",
  restrictTo("doctor"),
  validateQuery(appointmentQuerySchema),
  getMyAppointments,
);
router.get("/getPatientsForDoctor", restrictTo("doctor"), getPatientForDoctor);
router.get("/getDoctorQueueByDoctor",restrictTo("doctor"),getDoctorQueueByDoctor);
router.get("/getDoctorQueueByRecepionist",restrictTo("receptionist"),getDoctorQueueByRecepionist);
// for patient get all booked appoinments

router.get(
  "/bookedAppointmentsForPatient",
  restrictTo("patient"),
  getBookedAppointmentsForPatient,
);
router.post(
  "/completeAppointment/:id",
  restrictTo("doctor"),
  validate(completeAppointmentSchema),
  completeAppointment,
);
router.get(
  "/getCurrentPatientForDoctor/:id",
  restrictTo("doctor"),
  getCurrentPatientForDoctor,
);
router.patch(
  "/changeStatus/:id",
  restrictTo("receptionist", "doctor"),
  changeAppointmentStatus,
);
router.patch(
  "/cancelAppointment/:id",
  restrictTo("patient", "receptionist"),
  cancelAppointment,
);
export default router;
