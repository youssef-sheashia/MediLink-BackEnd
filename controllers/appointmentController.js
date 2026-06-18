import catchAsync from "../utils/catchAsync.js";
import mongoose from "mongoose";
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
export const getAllAppointments = catchAsync(async (req, res, next) => {
  const allAppointments = await Appointment.find()
    .populate("patient", "firstName lastName phone photo")
    .populate("doctor", "firstName lastName phone photo")
  res.status(200).json({
    status: "success",
    length: allAppointments.length,
    data: { allAppointments },
  });
});
export const getPatientForDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.user._id;
  const { search  } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
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
    data: { patients, },
  });
});


export const getBookedAppointmentsForPatient = catchAsync(async (req, res, next) => {
  const patientId = req.user._id;
  const { search, page = 1, limit = 10 } = req.query;

  const appointments = await Appointment.aggregate([
    // 1. only this patient's appointments
    { $match: { patient: new mongoose.Types.ObjectId(patientId) } },

    // 2. get doctor user data (name, photo)
    {
      $lookup: {
        from: "users",
        let: { doctorId: "$doctor" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$doctorId"] },
            },
          },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              photo: 1,
            },
          },
        ],
        as: "doctor",
      },
    },
    { $unwind: "$doctor" },

    // 3. get doctor specialization from doctorprofiles
    {
      $lookup: {
        from: "doctorprofiles",
        let: { doctorId: "$doctor._id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$user", "$$doctorId"] },
            },
          },
          {
            $lookup: {
              from: "specializations",
              localField: "specialization",
              foreignField: "_id",
              as: "specialization",
            },
          },
          { $unwind: { path: "$specialization", preserveNullAndEmpty: true } },
          {
            $project: {
              "specialization.name": 1,
            },
          },
        ],
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 4. search by doctor name if provided
    ...(search
      ? [
          {
            $match: {
              $or: [
                { "doctor.firstName": { $regex: search, $options: "i" } },
                { "doctor.lastName": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : []),

    // 5. sort by latest first
    { $sort: { date: -1 } },

    // 6. pagination
    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) },

    // 7. return only what the UI needs
    {
      $project: {
        _id: 1,
        date: 1,
        slotTime: 1,
        status: 1,
        fees: 1,
        "doctor._id": 1,
        "doctor.firstName": 1,
        "doctor.lastName": 1,
        "doctor.photo": 1,
        "doctorProfile.specialization.name": 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    length: appointments.length,
    data: { appointments },
  });
});
