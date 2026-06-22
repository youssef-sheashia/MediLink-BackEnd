import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { ClinicInformationsSchema,updateScheduleSchema } from "../validationSchema/clinic.validation.js";
import { getClinicInformations, updateClinicInformations ,updateClinicSchedule,getProfits} from "../controllers/clinicController.js";

const clinicRouter = express.Router();

clinicRouter.get("/informations",getClinicInformations);
clinicRouter.use(authenticate, restrictTo("admin"));
// informations routes
clinicRouter.patch("/informations",validate(ClinicInformationsSchema),updateClinicInformations);
clinicRouter.patch("/schedule",validate(updateScheduleSchema),updateClinicSchedule);
clinicRouter.get("/getProfits",restrictTo("admin"),getProfits);
export default clinicRouter;
