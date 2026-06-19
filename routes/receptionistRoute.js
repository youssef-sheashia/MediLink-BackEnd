import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { createreceptionistSchema } from "../utils/validators.js";
import {
  createReceptionist,
  getAllReceptionist,
  updateReceptionist,
  getReceptionist,
  deleteReceptionist,
} from "../controllers/receptionistController.js";
import {receptionistUpdateSchema} from '../validationSchema/receptioniestSchema.Validation.js'
const receptionistRouter = express.Router();

receptionistRouter.use(authenticate, restrictTo("admin"));
receptionistRouter.get("/", getAllReceptionist);
receptionistRouter.post("/",validate(createreceptionistSchema),createReceptionist);
receptionistRouter.route("/:id").delete(deleteReceptionist).get(getReceptionist);
receptionistRouter.patch("/:id",validate(receptionistUpdateSchema),updateReceptionist);
export default receptionistRouter;
