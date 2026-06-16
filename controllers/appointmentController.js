import catchAsync from "../utils/catchAsync.js";
import { APIFeatures } from "../utils/apiFeatures.js";
import Appointment from "../models/appointmentModel.js";
import User from "../models/userModel.js";
export const getMyAppointments = catchAsync(async (req, res, next) => {
  const { date, startDate, endDate, month, year } = req.query;

  let filter = { doctor: req.user._id };

  if (date) {
    // for day date=2026-04-13
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    // week startDate=2026-04-13&endDate=2026-04-19
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  } else if (month && year) {
    // for year month=4&year=2026
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    filter.date = { $gte: start, $lte: end };
  }

  const appointments = await Appointment.find(filter)
    .populate("patient", "firstName lastName phone photo")
    .sort("date slotTime");

  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: { appointments },
  });
});

export const getPatientForDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.user._id;
  const { search , page = 1, limit = 10 } = req.query;

  const patients = await Appointment.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },

    {
      $group: {
        _id: "$patient",
        visitCount: { $sum: 1 },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "patient",
      },
    },

    { $unwind: "$patient" },
    ...(search
      ? [
          {
            $match: {
              $or: [
                { "patient.firstName": { $regex: search, $options: "i" } },
                { "patient.lastName": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : []),
    {
      $project: {
        _id: 0,
        patientId: "$_id",
        firstName: "$patient.firstName",
        lastName: "$patient.lastName",
        phone: "$patient.phone",
        visitCount: 1,
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  res.status(200).json({
    status: "success",
    length: patients.length,
    data: { patients },
  });
});
