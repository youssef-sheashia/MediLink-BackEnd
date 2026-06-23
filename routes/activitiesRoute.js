import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import {
  getAllActivities,
  getActivitiesByUser,
} from "../controllers/activitiesController.js";

const activitiesRouter = express.Router();

activitiesRouter.use(authenticate, restrictTo("admin", "receptionist","doctor"));
activitiesRouter.get("/", getAllActivities);
activitiesRouter.get("/:id", getActivitiesByUser);
export default activitiesRouter;
