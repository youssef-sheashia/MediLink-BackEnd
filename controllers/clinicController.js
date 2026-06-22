import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Clinic from "../models/clinicModel.js";
import { ACTIONS } from "../constant/activities.js";
import Activity from "../models/activitiesModel.js";
import Appointment from "../models/appointmentModel.js";
export const getClinicInformations = catchAsync(async (req, res, next) => {
  const existingClinic = await Clinic.findOne();
  if (!existingClinic) {
    return res.status(200).json({
      status: "success",
      data: { clinic: null },
    });
  }
  res.status(200).json({
    status: "success",
    data: { clinic: existingClinic },
  });
});

export const updateClinicInformations = catchAsync(async (req, res, next) => {
  let existingClinic = await Clinic.findOne();
  if (!existingClinic) {
    existingClinic = await Clinic.create(req.body);
    return res.status(201).json({
      status: "success",
      data: { clinic: existingClinic },
    });
  }
  const clinic = await Clinic.findOneAndUpdate(
    { _id: existingClinic._id },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  await Activity.create({user:user._id,action: ACTIONS.UPDATE_CLINIC_INFORMATION});
  res.status(200).json({
    status: "success",
    data: { clinic },
  });
});

export const updateClinicSchedule = catchAsync(async (req, res, next) => {
  let clinic = await Clinic.findOne();
  if (!clinic) return next(new AppError("Clinic not found", 404));

  clinic = await Clinic.findOneAndUpdate(
    { _id: clinic._id },
    { schedule: req.body },
    { new: true, runValidators: true },
  );
  await Activity.create({user:user._id,action: ACTIONS.UPDATE_CLINIC_SCHEDULE});
  res.status(200).json({
    status: "success",
    data: { schedule: clinic.schedule },
  });
});
export const getProfits = catchAsync(async (req, res, next) => {
  const { filter } = req.query; // filter = "day" | "week" | "month" | "year"

  const now = new Date();
  let startDate;

  if (filter === "day") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (filter === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7); 
  } else if (filter === "month") {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1); 
  } else if (filter === "year") {
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
  }

  const matchStage = { status: "مكتمل" };
  if (startDate) {
    matchStage.date = { $gte: startDate, $lte: now };
  }

  const result = await Appointment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,            
        totalProfit: { $sum: "$fees" },
        appointmentCount: { $sum: 1 },
        avgFeePerAppointment: { $avg: "$fees" },
      },
    },
    {
      $project: {
        _id: 0,
        totalProfit: 1,
        appointmentCount: 1,
        avgFeePerAppointment: { $round: ["$avgFeePerAppointment", 2] },
      },
    },
  ]);

  const data = result[0] || {
    totalProfit: 0,
    appointmentCount: 0,
    avgFeePerAppointment: 0,
  };

  res.status(200).json({
    status: "success",
    filter: filter || "all",
    data,
  });
});
