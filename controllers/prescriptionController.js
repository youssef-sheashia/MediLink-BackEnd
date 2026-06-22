import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Prescription from "../models/prescriptionModel.js";
import User from "../models/userModel.js";

export const createPrescription = catchAsync(async (req, res, next) => {
  const prescription = await Prescription.create({
    ...req.body,
    doctor: req.user._id,
  });
  res.status(201).json({
    status: "success",
    data: {
      prescription,
    },
  });
});

export const getPrescriptionsByPatient = catchAsync(async (req, res, next) => {
  const { patientId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(patientId))
    return next(new AppError("invalid patient id", 400));

  const patient = await User.collection.findOne({
    _id: new mongoose.Types.ObjectId(patientId),
    role: "patient",
  });

  if (!patient) return next(new AppError("no patient found with this id", 404));

  if (!patient.active)
    return next(new AppError("this patient account is deactivated", 403));

  const prescriptions = await Prescription.aggregate([
    // 1) match this patient's prescriptions
    {
      $match: { patient: new mongoose.Types.ObjectId(patientId) },
    },

    // 2) join with users to get doctor name and photo
    {
      $lookup: {
        from: "users",
        localField: "doctor",
        foreignField: "_id",
        as: "doctor",
      },
    },
    {
      $unwind: {
        path: "$doctor",
        preserveNullAndEmptyArrays: true, // ← correct option name
      },
    },

    // 3) join with doctorprofiles using doctor._id
    {
      $lookup: {
        from: "doctorprofiles",
        localField: "doctor._id",
        foreignField: "user",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 4) join with specializations
    {
      $lookup: {
        from: "specializations",
        localField: "doctorProfile.specialization",
        foreignField: "_id",
        as: "specialization",
      },
    },
    {
      $unwind: {
        path: "$specialization",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 5) shape the response
    {
      $project: {
        medicines: 1,
        createdAt: 1,
        appointment: 1,
        "doctor._id": 1,
        "doctor.firstName": 1,
        "doctor.lastName": 1,
        "doctor.photo": 1,
        "specialization.name": 1,
      },
    },

    { $sort: { createdAt: -1 } },
  ]);

  res.status(200).json({
    status: "success",
    results: prescriptions.length,
    data: { prescriptions },
  });
});

export const getMyPrescriptions = catchAsync(async (req, res, next) => {
  const prescriptions = await Prescription.aggregate([
    // 1) match this patient's prescriptions
    {
      $match: { patient: new mongoose.Types.ObjectId(req.user._id) },
    },

    // 2) join with users to get doctor name and photo
    {
      $lookup: {
        from: "users",
        localField: "doctor",
        foreignField: "_id",
        as: "doctor",
      },
    },
    {
      $unwind: {
        path: "$doctor",
        preserveNullAndEmptyArrays: true, // ← correct option name
      },
    },

    // 3) join with doctorprofiles using doctor._id
    {
      $lookup: {
        from: "doctorprofiles",
        localField: "doctor._id",
        foreignField: "user",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 4) join with specializations
    {
      $lookup: {
        from: "specializations",
        localField: "doctorProfile.specialization",
        foreignField: "_id",
        as: "specialization",
      },
    },
    {
      $unwind: {
        path: "$specialization",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 5) shape the response
    {
      $project: {
        medicines: 1,
        createdAt: 1,
        appointment: 1,
        "doctor._id": 1,
        "doctor.firstName": 1,
        "doctor.lastName": 1,
        "doctor.photo": 1,
        "specialization.name": 1,
      },
    },

    { $sort: { createdAt: -1 } },
  ]);

  res.status(200).json({
    status: "success",
    results: prescriptions.length,
    data: { prescriptions },
  });
});
