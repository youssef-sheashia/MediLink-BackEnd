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
} from "../controllers/patientController.js";
import { uploadMedicalFilesMiddleware } from "../middlewares/multer.js";
import { uploadMultipleToImageKit } from "../utils/imageKit.js";
const router = express.Router();
router.use(authenticate);
router.patch(
  "/complete-profile",
  restrictTo("patient"),
  uploadMedicalFilesMiddleware,
  uploadMultipleToImageKit("medical-files"),
  completeMyProfile,
);
router.get("/:id",restrictTo("admin","doctor"), getPatientById);
router.use(restrictTo("admin"));

router.get("/", getAllPatients);

router.delete("/deleteMany", deleteManyPatients);
router.delete("/:id", deletePatient);
router.patch("/:id/active", changeActiveStatus);// test not work
export default router;
