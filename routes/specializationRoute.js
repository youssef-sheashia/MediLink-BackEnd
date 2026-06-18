import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { specializationSchema } from "../utils/validators.js";
import {getAllSpecializations, createSpecialization, updateSpecialization, deleteSpecialization} from "../controllers/specializationController.js";


const specializationRouter = express.Router();

specializationRouter.get(
  "/",
  getAllSpecializations,
);

specializationRouter.use(authenticate);

specializationRouter.post(
  "/",
  restrictTo("admin"),
  validate(specializationSchema),
  createSpecialization,
);
specializationRouter.put(
  "/:id",
  restrictTo("admin"),
  validate(specializationSchema),
  updateSpecialization,
);
specializationRouter.delete(
  "/:id",
  restrictTo("admin"),
  deleteSpecialization,
);
export default specializationRouter;
