import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { ClinicInformationsSchema,updateScheduleSchema } from "../utils/validators.js";
import { getClinicInformations, updateClinicInformations ,updateClinicSchedule} from "../controllers/clinicController.js";

const clinicRouter = express.Router();

clinicRouter.get("/informations",getClinicInformations);
clinicRouter.use(authenticate, restrictTo("admin"));
// informations routes
clinicRouter.patch("/informations",validate(ClinicInformationsSchema),updateClinicInformations);
clinicRouter.patch("/schedule",validate(updateScheduleSchema),updateClinicSchedule);
export default clinicRouter;
