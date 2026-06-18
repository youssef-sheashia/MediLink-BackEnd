import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import {
  getAllPatients,
  getPateintById,
  deletePateint,
  changeActiveStatus,
  deleteManyPateints,
} from "../controllers/patientController.js";
const router = express.Router();
router.use(authenticate, restrictTo("admin"));

router.get("/", getAllPatients);
router.delete("/deleteMany", deleteManyPateints);
router.get("/:id", getPateintById);
router.delete("/:id", deletePateint);
router.patch("/:id/active", changeActiveStatus);
export default router;
