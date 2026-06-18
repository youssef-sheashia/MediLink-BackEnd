import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { ClinicInformationsSchema,updateScheduleSchema } from "../utils/validators.js";
import { getClinicInformations, updateClinicInformations ,getClinicSchedule,updateClinicSchedule} from "../controllers/clinicController.js";

const clinicRouter = express.Router();

clinicRouter.use(authenticate, restrictTo("admin"));
// informations routes
clinicRouter.get("/informations",getClinicInformations);

clinicRouter.put("/informations",validate(ClinicInformationsSchema),updateClinicInformations);
// schedule routes
clinicRouter.get("/schedule",getClinicSchedule);
clinicRouter.put("/schedule",validate(updateScheduleSchema),updateClinicSchedule);
export default clinicRouter;
