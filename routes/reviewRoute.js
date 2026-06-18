import express from "express";
import authenticate from "../middlewares/authenticate.js";
import { restrictTo } from "../controllers/authController.js";
import { createReview, getDoctorReviews, deleteReview } from "../controllers/reviewController.js";

const router = express.Router();

router.use(authenticate);

router.post("/", restrictTo("patient"), createReview);

router.get("/doctor/:doctorId", getDoctorReviews);

router.delete("/:id", restrictTo("patient"), deleteReview);

export default router;
