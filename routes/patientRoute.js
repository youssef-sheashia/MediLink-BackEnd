import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import {
  completeMyProfile,
  getAllPatients,
  getPatientById,
  deletePatient,
  changeActiveStatus,
  deleteManyPatients,
  getMyProfile,
} from "../controllers/patientController.js";
import { uploadMedicalFilesMiddleware } from "../middlewares/multer.js";
import { uploadMultipleToImageKit } from "../utils/imageKit.js";
const router = express.Router();
router.use(authenticate);
router.get("/my-profile", restrictTo("patient"), getMyProfile);
router.patch(
  "/complete-profile",
  restrictTo("patient"),
  uploadMedicalFilesMiddleware,
  uploadMultipleToImageKit("medical-files"),
  completeMyProfile,
);
router.get("/:id", restrictTo("admin", "doctor","receptionist"), getPatientById);

router.get("/", restrictTo("admin", "receptionist"),getAllPatients);
router.use(restrictTo("admin"));

router.delete("/deleteMany", deleteManyPatients);
router.delete("/:id", deletePatient);

router.patch("/:id/active", changeActiveStatus);
export default router;
