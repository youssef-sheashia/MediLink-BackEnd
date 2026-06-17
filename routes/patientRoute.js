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

const router = express.Router();
router.patch(
  "/complete-profile",
  authenticate,
  restrictTo("patient"),
  completeMyProfile,
);
router.get("/:id", authenticate, restrictTo("admin doctor"), getPatientById);
router.use(authenticate, restrictTo("admin"));

router.get("/", getAllPatients);

router.delete("/:id", deletePatient);
router.patch("/:id/active", changeActiveStatus);
router.delete("/deleteMany", deleteManyPatients);
export default router;
