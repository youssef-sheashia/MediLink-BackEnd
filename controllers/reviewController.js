import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Review from "../models/reviewModel.js";
import Appointment from "../models/appointmentModel.js";
import { ACTIONS } from "../constant/activities.js";
import Activity from "../models/activitiesModel.js";
export const createReview = catchAsync(async (req, res, next) => {
  const { stars, comment } = req.body;
  const patientId = req.user._id;

  // 1. get the appointment and make sure it belongs to this patient
  const appointment = await Appointment.findOne({
    patient: patientId,
    status: "مكتمل",
    isRated: false,
  });

  if (!appointment) return next(new AppError("Appointment not found", 404));

  if (appointment.patient.toString() !== patientId.toString())
    return next(new AppError("This appointment does not belong to you", 403));

  // 2. only allow reviews for completed appointments
  if (appointment.status !== "مكتمل")
    return next(
      new AppError("You can only review a completed appointment", 400),
    );

  // 3. create the review — post save hook will auto recalculate doctor rating
  const review = await Review.create({
    patient: patientId,
    doctor: appointment.doctor,
    appointment: appointment._id,
    stars,
    comment,
  });
  await Appointment.findByIdAndUpdate(appointment._id, { isRated: true });

  await Activity.create({ user: user._id, action: ACTIONS.CREATE_REVIEW });
  res.status(201).json({
    status: "success",
    data: { review },
  });
});

export const getDoctorReviews = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!mongoose.Types.ObjectId.isValid(doctorId))
    return next(new AppError("Invalid id", 400));
  const reviews = await Review.find({ doctor: doctorId })
    .populate("patient", "firstName lastName photo")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: { reviews },
  });
});

export const deleteReview = catchAsync(async (req, res, next) => {
  // findOneAndDelete triggers the post hook that recalculates rating
  const review = await Review.findOneAndDelete({
    _id: req.params.id,
    patient: req.user._id, // patient can only delete their own review
  });

  if (!review)
    return next(new AppError("Review not found or not yours to delete", 404));
  await Activity.create({ user: user._id, action: ACTIONS.DELETE_REVIEW });

  res.status(204).json({ status: "success" });
});
