// routes/ratingRoutes.js
import express from "express";
import {
  submitRating,
  getPendingRatings,
} from "../controllers/ratingController.js";
import { restrictTo } from "../controllers/authController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.use(authenticate, restrictTo("patient"));

router.get("/pending", getPendingRatings);
router.post("/", submitRating);

export default router;
