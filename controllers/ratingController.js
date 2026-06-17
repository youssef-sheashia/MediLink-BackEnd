// controllers/ratingController.js
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Rating from "../models/ratingModel.js";
import Appointment from "../models/appointmentModel.js";

// ─── Patient: submit rating ───────────────────────────────────────────────────

/**
 * POST /api/v1/ratings
 * Patient only — rate a doctor after a completed appointment.
 */
export const submitRating = catchAsync(async (req, res, next) => {
  const { appointmentId, rating } = req.body;

  // 1) find the appointment and make sure it belongs to this patient
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patient: req.user._id,
    status: "completed",
  });

  if (!appointment)
    return next(new AppError("completed appointment not found", 404));

  // 2) check if already rated
  const existingRating = await Rating.findOne({ appointment: appointmentId });
  if (existingRating)
    return next(new AppError("you already rated this appointment", 400));

  // 3) create the rating — post save hook auto updates doctor average
  const newRating = await Rating.create({
    patient: req.user._id,
    doctor: appointment.doctor,
    appointment: appointment._id,
    rating,
  });

  res.status(201).json({
    status: "success",
    data: { rating: newRating },
  });
});

// ─── Patient: check pending ratings ──────────────────────────────────────────

/**
 * GET /api/v1/ratings/pending
 * Patient only — returns completed appointments that haven't been rated yet.
 * This is what triggers the popup on the frontend.
 */
export const getPendingRatings = catchAsync(async (req, res, next) => {
  // 1) get all completed appointments for this patient
  const completedAppointments = await Appointment.find({
    patient: req.user._id,
    status: "completed",
  }).select("_id doctor");

  if (completedAppointments.length === 0)
    return res.status(200).json({
      status: "success",
      data: { pending: [] },
    });

  // 2) get already rated appointment ids
  const ratedAppointmentIds = await Rating.find({
    patient: req.user._id,
  }).distinct("appointment");

  // 3) filter out already rated ones
  const pendingAppointments = completedAppointments.filter(
    (apt) => !ratedAppointmentIds.some((ratedId) => ratedId.equals(apt._id)),
  );

  // 4) populate doctor info for the popup
  const pending = await Appointment.populate(pendingAppointments, {
    path: "doctor",
    select: "specialization averageRating",
    populate: { path: "user", select: "firstName lastName photo" },
  });

  res.status(200).json({
    status: "success",
    results: pending.length,
    data: { pending },
  });
});
